"use server";

import { prisma } from "@/lib/prisma";
import { getAuthSession } from "@/lib/auth-session";

// Types imported as any to bypass Prisma generate issues in CI
type Priority = any;
type TaskStatus = any;

async function requireUser() {
  const session = await getAuthSession();
  const userId = session?.user?.id;
  if (!userId) throw new Error("Unauthorized");
  return userId;
}

async function requireProjectOwner(projectId: string, userId: string) {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { userId: true },
  });
  if (!project || project.userId !== userId) throw new Error("Forbidden");
}

export async function createTask(input: {
  projectId: string;
  title: string;
  priority?: Priority;
}) {
  const userId = await requireUser();
  await requireProjectOwner(input.projectId, userId);

  const title = input.title.trim();
  if (!title) throw new Error("Title is required");

  const task = await prisma.task.create({
    data: {
      userId,
      projectId: input.projectId,
      title,
      priority: input.priority ?? "medium",
      status: "todo",
    },
    select: { id: true, title: true, status: true, priority: true, createdAt: true },
  });

  return task;
}

export async function moveTask(input: {
  projectId: string;
  taskId: string;
  status: TaskStatus;
}) {
  const userId = await requireUser();
  await requireProjectOwner(input.projectId, userId);

  const task = await prisma.task.findUnique({
    where: { id: input.taskId },
    select: { userId: true, projectId: true },
  });

  if (!task || task.userId !== userId || task.projectId !== input.projectId) {
    throw new Error("Forbidden");
  }

  await prisma.task.update({
    where: { id: input.taskId },
    data: { status: input.status },
  });

  return { ok: true };
}
