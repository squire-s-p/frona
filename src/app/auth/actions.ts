"use server";

import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { Resend } from "resend";

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

interface ActionState {
  error?: string;
  success?: boolean;
}

export async function forgotPasswordAction(prevState: ActionState, formData: FormData) {
  const email = formData.get("email") as string;
  if (!email) return { error: "Введіть email" };

  try {
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (!user) {
      return { success: true };
    }

    const token = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    const expires = new Date(Date.now() + 3600000);

    await prisma.verificationToken.upsert({
      where: {
        identifier_token: {
          identifier: email.toLowerCase(),
          token: token
        }
      },
      update: { token, expires },
      create: {
        identifier: email.toLowerCase(),
        token,
        expires
      }
    });

    const resetLink = `${process.env.NEXTAUTH_URL}/auth/reset-password?token=${token}&email=${encodeURIComponent(email.toLowerCase())}`;

    if (resend) {
      await resend.emails.send({
        from: 'Frona <auth@frona.online>',
        to: email.toLowerCase(),
        subject: 'Відновлення пароля',
        html: `<p>Ви запросили скидання пароля. Перейдіть за посиланням: <a href="${resetLink}">${resetLink}</a></p>`
      });
    } else {
      console.log("--- RESET LINK (DEV MODE) ---");
      console.log(resetLink);
      console.log("----------------------------");
    }

    return { success: true };
  } catch (error) {
    console.error(error);
    return { error: "Сталася помилка. Спробуйте пізніше." };
  }
}

export async function resetPasswordAction(prevState: ActionState, formData: FormData) {
  const password = formData.get("password") as string;
  const confirmPassword = formData.get("confirmPassword") as string;
  const token = formData.get("token") as string;
  const email = formData.get("email") as string;

  if (!password || password.length < 6) return { error: "Пароль має бути не менше 6 символів" };
  if (password !== confirmPassword) return { error: "Паролі не збігаються" };

  try {
    const storedToken = await prisma.verificationToken.findFirst({
      where: {
        identifier: email.toLowerCase(),
        token: token,
        expires: { gt: new Date() }
      }
    });

    if (!storedToken) {
      return { error: "Посилання недійсне або термін його дії закінчився" };
    }

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      select: { id: true },
    });

    if (!user) {
      return { error: "Користувача не знайдено" };
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await prisma.userPassword.upsert({
      where: { userId: user.id },
      update: { passwordHash: hashedPassword },
      create: {
        userId: user.id,
        passwordHash: hashedPassword
      }
    });

    await prisma.verificationToken.deleteMany({
      where: { identifier: email.toLowerCase() }
    });

    return { success: true };
  } catch (error) {
    console.error(error);
    return { error: "Помилка при зміні пароля." };
  }
}
