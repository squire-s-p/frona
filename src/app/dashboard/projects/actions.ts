"use server";

import { prisma } from "@/lib/prisma";
import { getAuthSession } from "@/lib/auth-session";
import { revalidatePath } from "next/cache";

// Removed Prisma import to bypass build errors in CI

export async function createProject(input: {
  name: string;
  description?: string | null;
  site?: string | null;
  cost?: string | null;
  source?: string | null;

  // ✅ NEW
  clientId?: string | null;

  accesses?: string | null;
  notes?: string | null;

  // legacy (можеш лишити поки, але UI вже не мусить це використовувати)
  clientName?: string | null;
  clientContact?: string | null;
}) {
  const session = await getAuthSession();
  const userId = requireUserId(session);

  const name = (input.name ?? "").trim();
  if (!name) throw new Error("Name is required");

  const cost =
    input.cost && input.cost.trim()
      ? (input.cost.trim() as any)
      : null;

  // ✅ normalize clientId: "" -> null
  const rawClientId =
    typeof input.clientId === "string" ? input.clientId.trim() : input.clientId ?? null;

  // ✅ якщо clientId передали — перевіряємо що клієнт належить цьому ж юзеру
  let safeClientId: string | null = null;
  if (rawClientId) {
    const client = await prisma.client.findFirst({
      where: { id: rawClientId, userId },
      select: { id: true },
    });
    if (!client) throw new Error("Client not found");
    safeClientId = client.id;
  }

  const project = await prisma.project.create({
    data: {
      userId,
      name,
      description: input.description?.trim() ? input.description.trim() : null,
      site: input.site?.trim() ? input.site.trim() : null,
      cost,
      source: input.source?.trim() ? input.source.trim() : null,

      // ✅ NEW relation
      clientId: safeClientId,

      accesses: input.accesses?.trim() ? input.accesses.trim() : null,
      notes: input.notes?.trim() ? input.notes.trim() : null,

      status: "active",
      completedAt: null,
      archivedAt: null,

      // legacy (поки залишаємо, щоб нічого не ламати)
      clientName: input.clientName?.trim() ? input.clientName.trim() : null,
      clientContact: input.clientContact?.trim() ? input.clientContact.trim() : null,
    },
    select: { id: true },
  });

  revalidatePath("/dashboard/projects");
  revalidatePath(`/dashboard/projects/${project.id}`);
  if (safeClientId) revalidatePath(`/dashboard/clients/${safeClientId}`);

  return project;
}

function requireUserId(session: any) {
  const id = session?.user?.id;
  if (!id) throw new Error("Unauthorized");
  return id as string;
}

export async function autoArchiveCompletedProjects() {
  const session = await getAuthSession();
  const userId = requireUserId(session);

  const cutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  await prisma.project.updateMany({
    where: {
      userId,
      status: "completed",
      completedAt: { not: null, lt: cutoff },
    },
    data: {
      status: "archived",
      archivedAt: new Date(),
    },
  });
}

export async function archiveProject(projectId: string) {
  const session = await getAuthSession();
  const userId = requireUserId(session);

  const exists = await prisma.project.findFirst({
    where: { id: projectId, userId },
    select: { id: true },
  });
  if (!exists) throw new Error("Not found");

  await prisma.project.update({
    where: { id: projectId },
    data: { status: "archived", archivedAt: new Date() },
  });

  revalidatePath("/dashboard/projects");
  revalidatePath(`/dashboard/projects/${projectId}`);
}

export async function restoreProject(projectId: string) {
  const session = await getAuthSession();
  const userId = requireUserId(session);

  const exists = await prisma.project.findFirst({
    where: { id: projectId, userId },
    select: { id: true },
  });
  if (!exists) throw new Error("Not found");

  await prisma.project.update({
    where: { id: projectId },
    data: { status: "active", archivedAt: null },
  });

  revalidatePath("/dashboard/projects");
  revalidatePath(`/dashboard/projects/${projectId}`);
}

export async function setProjectStatus(projectId: string, status: "active" | "completed") {
  const session = await getAuthSession();
  const userId = requireUserId(session);

  const exists = await prisma.project.findFirst({
    where: { id: projectId, userId },
    select: { id: true },
  });
  if (!exists) throw new Error("Not found");

  await prisma.project.update({
    where: { id: projectId },
    data: {
      status,
      completedAt: status === "completed" ? new Date() : null,
      archivedAt: null,
    },
  });

  revalidatePath("/dashboard/projects");
  revalidatePath(`/dashboard/projects/${projectId}`);
}

export async function updateProject(
  projectId: string,
  input: {
    name: string;
    description?: string | null;
    site?: string | null;
    cost?: string | null;
    source?: string | null;
    clientName?: string | null;
    accesses?: string | null;
    clientContact?: string | null;
    notes?: string | null;
  }
) {
  const session = await getAuthSession();
  const userId = requireUserId(session);

  const exists = await prisma.project.findFirst({
    where: { id: projectId, userId },
    select: { id: true, status: true },
  });
  if (!exists) throw new Error("Not found");

  if (exists.status === "archived") throw new Error("Archived projects are read-only");

  const name = (input.name ?? "").trim();
  if (!name) throw new Error("Name is required");

  const cost =
    input.cost && input.cost.trim()
      ? (input.cost.trim() as any)
      : null;

  await prisma.project.update({
    where: { id: projectId },
    data: {
      name,
      description: input.description?.trim() ? input.description.trim() : null,
      site: input.site?.trim() ? input.site.trim() : null,
      source: input.source?.trim() ? input.source.trim() : null,
      clientName: input.clientName?.trim() ? input.clientName.trim() : null,
      accesses: input.accesses?.trim() ? input.accesses.trim() : null,
      clientContact: input.clientContact?.trim()
        ? input.clientContact.trim()
        : null,
      notes: input.notes?.trim() ? input.notes.trim() : null,
      cost,
    },
  });

  revalidatePath(`/dashboard/projects/${projectId}`);
  revalidatePath("/dashboard/projects");
}

/**
 * ✅ привʼязка/відвʼязка проєкту до клієнта
 */
export async function setProjectClient(projectId: string, clientId: string | null) {
  const session = await getAuthSession();
  const userId = requireUserId(session);

  const project = await prisma.project.findFirst({
    where: { id: projectId, userId },
    select: { id: true, status: true },
  });
  if (!project) throw new Error("Not found");

  if (project.status === "archived") throw new Error("Archived projects are read-only");

  const rawClientId =
    typeof clientId === "string" ? clientId.trim() : clientId ?? null;

  if (rawClientId) {
    const client = await prisma.client.findFirst({
      where: { id: rawClientId, userId },
      select: { id: true },
    });
    if (!client) throw new Error("Client not found");
  }

  await prisma.project.update({
    where: { id: projectId },
    data: {
      clientId: rawClientId ? rawClientId : null,
    },
  });

  revalidatePath(`/dashboard/projects/${projectId}`);
  revalidatePath("/dashboard/projects");
  if (rawClientId) revalidatePath(`/dashboard/clients/${rawClientId}`);
}

export async function deleteProject(projectId: string) {
  const session = await getAuthSession();
  const userId = requireUserId(session);

  const exists = await prisma.project.findFirst({
    where: { id: projectId, userId },
    select: { id: true },
  });
  if (!exists) throw new Error("Not found");

  await prisma.project.delete({
    where: { id: projectId },
  });

  revalidatePath("/dashboard/projects");
}
