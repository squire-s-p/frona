"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { getAuthSession } from "@/lib/auth-session";

/* =========================
   CREATE
========================= */

const createClientSchema = z.object({
  name: z.string().min(1, "Назва/Ім'я обов'язкове").max(120),
  taxId: z.string().trim().max(32).optional().or(z.literal("")),
  email: z.string().trim().email("Некоректна пошта").optional().or(z.literal("")),
  address: z.string().trim().max(255).optional().or(z.literal("")),
  contactInfo: z.string().trim().max(5000).optional().or(z.literal("")),
  projectIds: z.array(z.string()).default([]),
});

export async function createClient(input: unknown) {
  const session = await getAuthSession();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const data = createClientSchema.parse(input);

  const client = await prisma.client.create({
    data: {
      userId: session.user.id,
      name: data.name.trim(),
      taxId: data.taxId?.trim() || null,
      email: data.email?.trim() || null,
      address: data.address?.trim() || null,
      contactInfo: data.contactInfo?.trim() || null,
    },
    select: { id: true },
  });

  if (data.projectIds.length) {
    await prisma.project.updateMany({
      where: {
        userId: session.user.id,
        id: { in: data.projectIds },
      },
      data: { clientId: client.id },
    });
  }

  revalidatePath("/dashboard/clients");
  revalidatePath("/dashboard/projects");
  revalidatePath(`/dashboard/clients/${client.id}`);
  return { ok: true, id: client.id };
}

/* =========================
   UPDATE (details)
========================= */

const updateClientSchema = z.object({
  clientId: z.string().min(1),
  name: z.string().min(1, "Назва/Ім'я обов'язкове").max(120),
  taxId: z.string().trim().max(32).optional().or(z.literal("")),
  email: z.string().trim().email("Некоректна пошта").optional().or(z.literal("")),
  address: z.string().trim().max(255).optional().or(z.literal("")),
  contactInfo: z.string().trim().max(5000).optional().or(z.literal("")),
});

export async function updateClient(input: unknown) {
  const session = await getAuthSession();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const data = updateClientSchema.parse(input);

  const existing = await prisma.client.findFirst({
    where: { id: data.clientId, userId: session.user.id },
    select: { id: true },
  });
  if (!existing) throw new Error("Not found");

  await prisma.client.update({
    where: { id: data.clientId },
    data: {
      name: data.name.trim(),
      taxId: data.taxId?.trim() || null,
      email: data.email?.trim() || null,
      address: data.address?.trim() || null,
      contactInfo: data.contactInfo?.trim() || null,
    },
  });

  revalidatePath("/dashboard/clients");
  revalidatePath(`/dashboard/clients/${data.clientId}`);
  revalidatePath("/dashboard/projects");
  return { ok: true };
}

/* =========================
   SET CLIENT PROJECTS
========================= */

const setClientProjectsSchema = z.object({
  clientId: z.string().min(1),
  projectIds: z.array(z.string()).default([]),
});

export async function setClientProjects(input: unknown) {
  const session = await getAuthSession();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const { clientId, projectIds } = setClientProjectsSchema.parse(input);

  const client = await prisma.client.findFirst({
    where: { id: clientId, userId: session.user.id },
    select: { id: true },
  });
  if (!client) throw new Error("Not found");

  // 1) відвʼязати зайві (які були привʼязані до цього клієнта, але вже не вибрані)
  await prisma.project.updateMany({
    where: {
      userId: session.user.id,
      clientId,
      id: { notIn: projectIds.length ? projectIds : ["__none__"] },
    },
    data: { clientId: null },
  });

  // 2) привʼязати вибрані
  if (projectIds.length) {
    await prisma.project.updateMany({
      where: { userId: session.user.id, id: { in: projectIds } },
      data: { clientId },
    });
  }

  revalidatePath("/dashboard/clients");
  revalidatePath(`/dashboard/clients/${clientId}`);
  revalidatePath("/dashboard/projects");
  return { ok: true };
}

/* =========================
   DELETE (safe)
========================= */

const deleteClientSchema = z.object({
  clientId: z.string().min(1),
});

export async function deleteClient(input: unknown) {
  const session = await getAuthSession();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const { clientId } = deleteClientSchema.parse(input);

  const existing = await prisma.client.findFirst({
    where: { id: clientId, userId: session.user.id },
    select: { id: true },
  });
  if (!existing) throw new Error("Not found");

  // 🔒 щоб не впасти на FK: спочатку відвʼязуємо проєкти
  await prisma.project.updateMany({
    where: { userId: session.user.id, clientId },
    data: { clientId: null },
  });

  await prisma.client.delete({
    where: { id: clientId },
  });

  revalidatePath("/dashboard/clients");
  revalidatePath("/dashboard/projects");
  return { ok: true };
}
