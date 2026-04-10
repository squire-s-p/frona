import type { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { headers } from "next/headers";
import { UAParser } from "ua-parser-js";

import { prisma } from "@/lib/prisma";


export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt" },

  providers: [
    // ---------- Google ----------
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      allowDangerousEmailAccountLinking: true,
      authorization: {
        params: {
          // ✅ basic scopes only for login
          scope: "openid email profile",
          prompt: "select_account",
        },
      },
    }),

    // ---------- Email + Password ----------
    CredentialsProvider({
      name: "Email & Password",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const email = (credentials?.email ?? "").toString().trim().toLowerCase();
        const password = (credentials?.password ?? "").toString();

        if (!email || !password) return null;

        const user = await prisma.user.findUnique({
          where: { email },
          select: {
            id: true,
            email: true,
            name: true,
            image: true,
          },
        });

        if (!user) return null;

        const pass = await prisma.userPassword.findUnique({
          where: { userId: user.id },
          select: { passwordHash: true },
        });

        // ❗ користувач створений через Google → без пароля
        if (!pass) return null;

        const isValid = await bcrypt.compare(password, pass.passwordHash);
        if (!isValid) return null;

        return user;
      },
    }),
  ],

  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === "google" && user?.id) {
        const existingAccount = await prisma.account.findFirst({
          where: { userId: user.id, provider: "google" },
        });

        if (existingAccount) {
          await prisma.account.update({
            where: { id: existingAccount.id },
            data: {
              access_token: account.access_token,
              expires_at: account.expires_at,
              refresh_token: account.refresh_token ?? existingAccount.refresh_token,
              scope: account.scope,
            },
          });
        }
      }
      return true;
    },
    async jwt({ token, user, trigger }) {
      if (user?.id) {
        (token as any).id = user.id;

        // Create DeviceSession strictly on login
        if (!token.deviceSessionId) {
          try {
            const reqHeaders = await headers();
            const userAgent = reqHeaders.get("user-agent") || "";
            const ip = reqHeaders.get("x-forwarded-for") || reqHeaders.get("x-real-ip") || "Unknown Format";

            const parser = new UAParser(userAgent);
            const browserStr = parser.getBrowser().name ? `${parser.getBrowser().name} ${parser.getBrowser().version || ""}`.trim() : "Unknown Browser";
            const osStr = parser.getOS().name ? `${parser.getOS().name} ${parser.getOS().version || ""}`.trim() : "Unknown OS";
            const devInfo = parser.getDevice();
            const deviceStr = devInfo.model ? `${devInfo.vendor || ""} ${devInfo.model}`.trim() : (devInfo.type ? devInfo.type : "Desktop");

            const newSession = await prisma.deviceSession.create({
              data: {
                userId: user.id as string,
                userAgent,
                ipAddress: ip,
                browser: browserStr,
                os: osStr,
                device: deviceStr,
              }
            });
            (token as any).deviceSessionId = newSession.id;
          } catch (e) {
            console.error("Failed to extract device session details", e);
          }
        }
      }

      if (trigger === "update") {
        try {
          const dbUser = await prisma.user.findUnique({
            where: { id: token.id as string },
            select: { name: true, image: true }
          });
          if (dbUser) {
            token.name = dbUser.name;
            token.picture = dbUser.image;
          }
        } catch (error) {
          // Ignore
        }
      }

      // Check if session continues to exist
      if (token.deviceSessionId) {
        try {
          const dbSession = await prisma.deviceSession.findUnique({
            where: { id: token.deviceSessionId as string }
          });
          
          if (!dbSession) {
            (token as any).error = "SessionRevoked";
          } else {
            // Update lastActive if older than 1 hour
            if (Date.now() - dbSession.lastActive.getTime() > 1000 * 60 * 60) {
              await prisma.deviceSession.update({
                where: { id: dbSession.id },
                data: { lastActive: new Date() }
              });
            }
          }
        } catch(e) {
          // ignore DB errors silently so we don't break login if DB is slow
        }
      }

      return token;
    },
    async session({ session, token }) {
      if ((token as any).error === "SessionRevoked") {
        // Return empty session to force client-side logout
        return {} as any;
      }
      if (session.user) {
        (session.user as any).id = (token as any).id as string;
        (session as any).deviceSessionId = token.deviceSessionId;
        
        // Pass updated token values down to the client session
        if (token.name) session.user.name = token.name;
        if (token.picture) session.user.image = token.picture;
      }
      return session;
    },
  },
};
