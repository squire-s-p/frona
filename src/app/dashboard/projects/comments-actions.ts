"use server";

import { prisma } from "@/lib/prisma";
import { getAuthSession } from "@/lib/auth-session";
import { revalidatePath } from "next/cache";

function requireUserId(session: any) {
  const id = session?.user?.id;
  if (!id) throw new Error("Unauthorized");
  return id as string;
}

export async function getProjectComments(projectId: string) {
  const session = await getAuthSession();
  const userId = requireUserId(session);

  const project = await prisma.project.findFirst({
    where: { id: projectId, userId },
    select: { id: true, status: true },
  });
  if (!project) throw new Error("Not found");

  const rows = await prisma.projectComment.findMany({
    where: { projectId },
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      body: true,
      createdAt: true,
      user: { select: { name: true, email: true, image: true } },
    },
  });

  return rows;
}

export async function addProjectComment(projectId: string, body: string) {
  const session = await getAuthSession();
  const userId = requireUserId(session);

  const text = (body ?? "").trim();
  if (!text) throw new Error("Comment is empty");

  const project = await prisma.project.findFirst({
    where: { id: projectId, userId },
    select: { id: true, status: true },
  });
  if (!project) throw new Error("Not found");

  // ✅ Архівні — read-only
  if (project.status === "archived") {
    throw new Error("Archived projects are read-only");
  }

  await prisma.projectComment.create({
    data: {
      projectId,
      userId,
      body: text,
    },
  });

  revalidatePath(`/dashboard/projects/${projectId}`);
}

export async function deleteProjectComment(commentId: string) {
  const session = await getAuthSession();
  const userId = requireUserId(session);

  const existing = await prisma.projectComment.findFirst({
    where: { id: commentId },
    select: { id: true, projectId: true, project: { select: { userId: true, status: true } } },
  });

  if (!existing) throw new Error("Not found");
  if (existing.project.userId !== userId) throw new Error("Unauthorized");

  // ✅ Архівні — read-only
  if (existing.project.status === "archived") {
    throw new Error("Archived projects are read-only");
  }

  await prisma.projectComment.delete({ where: { id: commentId } });

  revalidatePath(`/dashboard/projects/${existing.projectId}`);
}
