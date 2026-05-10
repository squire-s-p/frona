import { prisma } from "@/lib/prisma";
import { Resend } from "resend";

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

const APP_URL = process.env.NEXTAUTH_URL || "https://frona.online";

export async function sendVerificationEmail(email: string) {
  const token = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  const expires = new Date(Date.now() + 24 * 3600 * 1000);

  await prisma.verificationToken.upsert({
    where: {
      identifier_token: {
        identifier: email.toLowerCase(),
        token,
      },
    },
    update: { token, expires },
    create: {
      identifier: email.toLowerCase(),
      token,
      expires,
    },
  });

  const verifyLink = `${APP_URL}/auth/verify-email?token=${token}&email=${encodeURIComponent(email.toLowerCase())}`;

  if (resend) {
    try {
      await resend.emails.send({
        from: "Frona <auth@frona.online>",
        to: email.toLowerCase(),
        subject: "Підтвердіть вашу пошту — Frona",
        html: `
          <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 24px;">
            <h2 style="color: #111;">Підтвердіть вашу пошту</h2>
            <p>Натисніть кнопку нижче, щоб підтвердити email-адресу:</p>
            <a href="${verifyLink}" style="display:inline-block;padding:12px 24px;background:#7c3aed;color:#fff;border-radius:8px;text-decoration:none;font-weight:bold;">Підтвердити</a>
            <p style="color:#888;font-size:13px;margin-top:16px;">Посилання дійсне 24 години. Якщо ви не реєструвались на Frona — проігноруйте цей лист.</p>
          </div>
        `,
      });
    } catch (e) {
      console.error("Failed to send verification email:", e);
    }
  } else {
    console.log("--- VERIFY EMAIL LINK (DEV) ---");
    console.log(verifyLink);
    console.log("-------------------------------");
  }

  return { sent: !!resend, verifyLink: !resend ? verifyLink : undefined };
}

export async function verifyEmailToken(token: string, email: string) {
  const stored = await prisma.verificationToken.findFirst({
    where: {
      identifier: email.toLowerCase(),
      token,
      expires: { gt: new Date() },
    },
  });

  if (!stored) return { ok: false, error: "Токен недійсний або термін дії закінчився" };

  const user = await prisma.user.findUnique({
    where: { email: email.toLowerCase() },
    select: { id: true },
  });

  if (!user) return { ok: false, error: "Користувача не знайдено" };

  await prisma.$transaction([
    prisma.user.update({
      where: { id: user.id },
      data: { emailVerified: new Date() },
    }),
    prisma.verificationToken.deleteMany({
      where: { identifier: email.toLowerCase() },
    }),
  ]);

  return { ok: true };
}
