import "server-only";
import { google } from "googleapis";
import { prisma } from "@/lib/prisma";
import { getAuthSession } from "@/lib/auth-session";

function oauthClient() {
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET
  );
}

export async function getGoogleCalendar() {
  const session = await getAuthSession();
  const userId = session?.user?.id;
  if (!userId) throw new Error("Unauthorized");

  const account = await prisma.account.findFirst({
    where: { userId, provider: "google" },
    select: {
      access_token: true,
      refresh_token: true,
      expires_at: true,
    },
  });

  if (!account?.access_token) {
    throw new Error("Google account not connected");
  }

  const auth = oauthClient();
  auth.setCredentials({
    access_token: account.access_token ?? undefined,
    refresh_token: account.refresh_token ?? undefined,
    expiry_date: account.expires_at ? account.expires_at * 1000 : undefined,
  });

  // Якщо access token протух — googleapis сам спробує оновити, але ми ще й збережемо новий.
  auth.on("tokens", async (tokens) => {
    // tokens.access_token може бути новим
    // refresh_token зазвичай НЕ приходить повторно — тому не затираємо, якщо його нема
    const nextAccess = tokens.access_token;
    const nextExpiry =
      typeof tokens.expiry_date === "number"
        ? Math.floor(tokens.expiry_date / 1000)
        : undefined;

    if (nextAccess || nextExpiry) {
      await prisma.account.updateMany({
        where: { userId, provider: "google" },
        data: {
          access_token: nextAccess ?? undefined,
          expires_at: nextExpiry ?? undefined,
        },
      });
    }
  });

  return google.calendar({ version: "v3", auth });
}
