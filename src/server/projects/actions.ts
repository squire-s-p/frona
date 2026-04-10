"use server";

import { prisma } from "@/lib/prisma";
import { getAuthSession } from "@/lib/auth-session";
import { revalidatePath } from "next/cache";

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

  const project = await prisma.project.findFirst({
    where: { id: projectId, userId },
    select: { id: true },
  });
  if (!project) throw new Error("Not found");

  await prisma.project.update({
    where: { id: projectId },
    data: { status: "archived", archivedAt: new Date() },
  });

  revalidatePath("/dashboard/projects");
}

export async function restoreProject(projectId: string) {
  const session = await getAuthSession();
  const userId = requireUserId(session);

  const project = await prisma.project.findFirst({
    where: { id: projectId, userId },
    select: { id: true },
  });
  if (!project) throw new Error("Not found");

  await prisma.project.update({
    where: { id: projectId },
    data: { status: "active", archivedAt: null },
  });

  revalidatePath("/dashboard/projects");
}

export async function setProjectStatus(projectId: string, status: "active" | "completed") {
  const session = await getAuthSession();
  const userId = requireUserId(session);

  const project = await prisma.project.findFirst({
    where: { id: projectId, userId },
    select: { id: true },
  });
  if (!project) throw new Error("Not found");

  await prisma.project.update({
    where: { id: projectId },
    data: {
      status,
      completedAt: status === "completed" ? new Date() : null,
      archivedAt: null,
    },
  });

  revalidatePath("/dashboard/projects");
}
