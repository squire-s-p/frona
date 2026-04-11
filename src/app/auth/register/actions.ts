"use server";

import { z } from "zod";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client"; // 👈 додано

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
    select: { id: true },
  });

  if (existing) {
    return { ok: false as const, message: "Користувач з таким email вже існує." };
  }

  const passwordHash = await bcrypt.hash(password, 12);

  await prisma.$transaction(async (tx: Prisma.TransactionClient) => { // 👈 типізація
    const user = await tx.user.create({
      data: { email, name: name?.trim() ? name.trim() : null },
      select: { id: true },
    });

    await tx.userPassword.create({
      data: { userId: user.id, passwordHash },
    });
  });

  return { ok: true as const };
}