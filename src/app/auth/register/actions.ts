"use server";

import { z } from "zod";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { sendVerificationEmail } from "@/lib/email";

const RegisterSchema = z.object({
  name: z.string().trim().min(2).max(80).optional().or(z.literal("")),
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(8).max(72),
});

export async function registerWithEmail(formData: FormData) {
  const parsed = RegisterSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { ok: false as const, message: "Перевір поля (email / пароль мін 8 символів)." };
  }

  const { name, email, password } = parsed.data;

  const existing = await prisma.user.findUnique({
    where: { email },
    select: { id: true, emailVerified: true },
  });

  if (existing) {
    if (!existing.emailVerified) {
      await sendVerificationEmail(email);
      return { ok: false as const, message: "Користувач з таким email вже існує, але пошту не підтверджено. Лист для підтвердження надіслано повторно." };
    }
    return { ok: false as const, message: "Користувач з таким email вже існує." };
  }

  const passwordHash = await bcrypt.hash(password, 12);

  await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    const user = await tx.user.create({
      data: { email, name: name?.trim() ? name.trim() : null },
      select: { id: true },
    });

    await tx.userPassword.create({
      data: { userId: user.id, passwordHash },
    });
  });

  await sendVerificationEmail(email);

  return { ok: true as const, message: "Реєстрація успішна! Перевірте пошту для підтвердження email." };
}

export async function resendVerificationEmailAction(email: string) {
  if (!email) return { ok: false, error: "Введіть email" };

  const user = await prisma.user.findUnique({
    where: { email: email.toLowerCase() },
    select: { id: true, emailVerified: true },
  });

  if (!user) return { ok: true };
  if (user.emailVerified) return { ok: true, alreadyVerified: true };

  await sendVerificationEmail(email);
  return { ok: true };
}
