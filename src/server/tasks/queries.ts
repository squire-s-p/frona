import { prisma } from "@/lib/prisma";

export async function listTasks(userId: string) {
  return prisma.task.findMany({
    where: { userId },
    orderBy: [{ updatedAt: "desc" }],
    include: {
      project: { select: { id: true, name: true, isPinned: true } },
      attachments: { select: { id: true, name: true, url: true } },
      taskTags: {
        include: {
          tag: { select: { id: true, name: true, color: true } },
        },
      },
      _count: { select: { comments: true } },
    },
  });
}

export async function listProjects(userId: string) {
  return prisma.project.findMany({
    where: {
      userId,
      status: { in: ["active", "completed"] },
    },
    orderBy: { updatedAt: "desc" },
    select: { id: true, name: true, isPinned: true },
  });
}

export async function listTags(userId: string) {
  return prisma.tag.findMany({
    where: { userId },
    orderBy: { name: "asc" },
    select: { id: true, name: true, color: true, isPinned: true },
  });
}
