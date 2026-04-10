"use server";

import { prisma } from "@/lib/prisma";
import { getAuthSession } from "@/lib/auth-session";
import { revalidatePath } from "next/cache";

function requireUserId(session: any) {
  const id = session?.user?.id;
  if (!id) throw new Error("Unauthorized");
  return id as string;
}

/**
 * UI enums (what your components use)
 */
type Priority = "LOW" | "MEDIUM" | "HIGH" | "NONE";
type Status = "TODO" | "DONE";

/**
 * DB enums (what Prisma expects based on schema.prisma)
 * Priority: low | medium | high | urgent
 */
type PriorityDb = "low" | "medium" | "high";

function mapPriority(p?: Priority): PriorityDb | "urgent" {
  switch (p) {
    case "NONE": return "low";
    case "LOW": return "medium";
    case "MEDIUM": return "high";
    case "HIGH": return "urgent";
    default: return "low";
  }
}

function mapStatus(s?: Status): any {
  return s === "DONE" ? "done" : "todo";
}

export async function createTask(input: {
  title: string;
  description?: string | null;
  projectId?: string | null;
  priority?: Priority;
  status?: Status;
  startDate?: string | null; // ISO (UI)
  endDate?: string | null; // ISO (UI)
  recurrenceRule?: string | null; // JSON string
  parentTaskId?: string | null;
  tagIds?: string[];
  isPinned?: boolean;
  isTemplate?: boolean;
}) {
  const session = await getAuthSession();
  const userId = requireUserId(session);

  const title = (input.title ?? "").trim();
  if (!title) throw new Error("Title is required");

  // Перевіряємо теги якщо є
  if (input.tagIds && input.tagIds.length > 0) {
    const tags = await prisma.tag.findMany({
      where: { id: { in: input.tagIds }, userId },
      select: { id: true },
    });
    if (tags.length !== input.tagIds.length) throw new Error("Invalid tags");
  }

  const task = await prisma.task.create({
    data: {
      title,
      description: input.description ?? null,
      userId,
      projectId: input.projectId ?? null,

      // ✅ map UI enums -> DB enums (lowercase)
      priority: mapPriority(input.priority),
      status: mapStatus(input.status) as any,

      // ✅ schema fields are startAt/endAt (not startDate/endDate)
      startAt: input.startDate ? new Date(input.startDate) : null,
      endAt: input.endDate ? new Date(input.endDate) : null,

      // Recurring
      recurrenceRule: (input.recurrenceRule ?? null) as any,
      parentTaskId: (input.parentTaskId ?? null) as any,

      isPinned: (input.isPinned ?? false) as any,
      isTemplate: (input.isTemplate ?? false) as any,

      // Tags
      taskTags: (input.tagIds && input.tagIds.length > 0
        ? {
          create: input.tagIds.map((tagId) => ({ tagId })),
        }
        : undefined) as any,
    },
  });

  revalidatePath("/dashboard/tasks");
  return task;
}

export async function toggleTaskStatus(taskId: string, status: Status) {
  const session = await getAuthSession();
  const userId = requireUserId(session);

  const task = await prisma.task.findFirst({
    where: { id: taskId, userId },
  });
  if (!task) throw new Error("Task not found");

  const updated = await prisma.task.update({
    where: { id: taskId },
    data: {
      status: mapStatus(status) as any,
    },
  });

  revalidatePath("/dashboard/tasks");
  return updated;
}


export async function updateTask(
  taskId: string,
  input: {
    title: string;
    description?: string | null;
    projectId?: string | null;
    priority?: Priority;
    status?: Status;
    startDate?: string | null;
    endDate?: string | null;
    recurrenceRule?: string | null; // JSON string
    parentTaskId?: string | null;
    tagIds?: string[];
    isPinned?: boolean;
    isTemplate?: boolean;
  }
) {
  const session = await getAuthSession();
  const userId = requireUserId(session);

  const task = await prisma.task.findFirst({
    where: { id: taskId, userId },
    select: { id: true },
  });
  if (!task) throw new Error("Not found");

  if (input.title !== undefined) {
    const title = (input.title ?? "").trim();
    if (!title) throw new Error("Title is required");
  }


  // Оновлюємо теги окремо якщо передано
  if (input.tagIds !== undefined) {
    // Перевіряємо теги
    if (input.tagIds.length > 0) {
      const tags = await prisma.tag.findMany({
        where: { id: { in: input.tagIds }, userId },
        select: { id: true },
      });
      if (tags.length !== input.tagIds.length) throw new Error("Invalid tags");
    }

    // Оновлюємо теги в транзакції
    await prisma.$transaction([
      prisma.taskTag.deleteMany({
        where: { taskId },
      }),
      ...(input.tagIds.length > 0
        ? [
          prisma.taskTag.createMany({
            data: input.tagIds.map((tagId) => ({ taskId, tagId })),
          }),
        ]
        : []),
    ]);
  }

  await prisma.task.update({
    where: { id: taskId },
    data: {
      title: input.title !== undefined ? input.title.trim() : undefined,
      description: input.description !== undefined ? input.description : undefined,
      projectId: input.projectId !== undefined ? input.projectId : undefined,

      // ✅ map UI enums -> DB enums
      priority: input.priority !== undefined ? mapPriority(input.priority) : undefined,
      status: input.status !== undefined ? mapStatus(input.status) : undefined,

      // ✅ schema fields
      startAt: input.startDate !== undefined ? (input.startDate ? new Date(input.startDate) : null) : undefined,
      endAt: input.endDate !== undefined ? (input.endDate ? new Date(input.endDate) : null) : undefined,

      // Recurring
      recurrenceRule: input.recurrenceRule !== undefined ? input.recurrenceRule : undefined,
      parentTaskId: input.parentTaskId !== undefined ? input.parentTaskId : undefined,

      isPinned: (input.isPinned !== undefined ? input.isPinned : undefined) as any,
      isTemplate: (input.isTemplate !== undefined ? input.isTemplate : undefined) as any,
    },
  });


  revalidatePath("/dashboard/tasks");
}

export async function deleteTask(taskId: string) {
  const session = await getAuthSession();
  const userId = requireUserId(session);

  const task = await prisma.task.findFirst({
    where: { id: taskId, userId },
    select: { id: true },
  });
  if (!task) throw new Error("Not found");

  await prisma.task.delete({ where: { id: taskId } });
  revalidatePath("/dashboard/tasks");
}

export async function createProjectQuick(name: string) {
  const session = await getAuthSession();
  const userId = requireUserId(session);

  const trimmed = name.trim();
  if (!trimmed) throw new Error("Project name is required");

  const project = await prisma.project.create({
    data: { name: trimmed, userId },
    select: { id: true, name: true },
  });

  revalidatePath("/dashboard/tasks");
  return project;
}

export async function addTaskComment(taskId: string, body: string) {
  const session = await getAuthSession();
  const userId = requireUserId(session);

  const text = body.trim();
  if (!text) throw new Error("Comment is empty");

  const task = await prisma.task.findFirst({
    where: { id: taskId, userId },
    select: { id: true },
  });
  if (!task) throw new Error("Not found");

  await prisma.taskComment.create({
    data: { taskId, body: text, userId },
  });

  revalidatePath("/dashboard/tasks");
}

export async function getTaskComments(taskId: string) {
  const session = await getAuthSession();
  const userId = requireUserId(session);

  // Перевіряємо доступ до таска
  const task = await prisma.task.findFirst({
    where: { id: taskId, userId },
    select: { id: true },
  });
  if (!task) throw new Error("Not found");

  const comments = await prisma.taskComment.findMany({
    where: { taskId },
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      body: true,
      createdAt: true,
      user: { select: { name: true, email: true, image: true } },
    },
  });

  return comments;
}

export async function deleteTaskComment(commentId: string) {
  const session = await getAuthSession();
  const userId = requireUserId(session);

  // Видаляти може тільки власник таска (userId таска)
  const comment = await prisma.taskComment.findFirst({
    where: { id: commentId },
    select: { id: true, taskId: true },
  });
  if (!comment) throw new Error("Not found");

  const task = await prisma.task.findFirst({
    where: { id: comment.taskId, userId },
    select: { id: true },
  });
  if (!task) throw new Error("Not allowed");

  await prisma.taskComment.delete({ where: { id: commentId } });

  revalidatePath("/dashboard/tasks");
}

export async function createTag(name: string) {
  const session = await getAuthSession();
  const userId = requireUserId(session);

  const trimmed = name.trim();
  if (!trimmed) throw new Error("Tag name is required");

  // Використовуємо upsert для уникнення дублікатів (unique constraint)
  const tag = await prisma.tag.upsert({
    where: {
      userId_name: {
        userId,
        name: trimmed,
      },
    },
    create: {
      userId,
      name: trimmed,
    },
    update: {},
    select: { id: true, name: true },
  });

  revalidatePath("/dashboard/tasks");
  return tag;
}

export async function updateTaskTags(taskId: string, tagIds: string[]) {
  const session = await getAuthSession();
  const userId = requireUserId(session);

  // Перевіряємо доступ до задачі
  const task = await prisma.task.findFirst({
    where: { id: taskId, userId },
    select: { id: true },
  });
  if (!task) throw new Error("Not found");

  // Перевіряємо що всі теги належать користувачу
  if (tagIds.length > 0) {
    const tags = await prisma.tag.findMany({
      where: { id: { in: tagIds }, userId },
      select: { id: true },
    });
    if (tags.length !== tagIds.length) throw new Error("Invalid tags");
  }

  // Видаляємо старі зв'язки та створюємо нові
  await prisma.$transaction([
    prisma.taskTag.deleteMany({
      where: { taskId },
    }),
    ...(tagIds.length > 0
      ? [
        prisma.taskTag.createMany({
          data: tagIds.map((tagId) => ({ taskId, tagId })),
        }),
      ]
      : []),
  ]);

  revalidatePath("/dashboard/tasks");
}

export async function toggleTaskPin(taskId: string, isPinned: boolean) {
  const session = await getAuthSession();
  const userId = requireUserId(session);

  await prisma.task.update({
    where: { id: taskId, userId },
    data: { isPinned: isPinned as any },
  });

  revalidatePath("/dashboard/tasks");
}

export async function toggleTaskTemplate(taskId: string, isTemplate: boolean) {
  const session = await getAuthSession();
  const userId = requireUserId(session);

  await prisma.task.update({
    where: { id: taskId, userId },
    data: { isTemplate: isTemplate as any },
  });

  revalidatePath("/dashboard/tasks");
}

export async function addTaskAttachment(
  taskId: string,
  attachment: {
    name: string;
    url: string;
    mimeType: string | null;
    size: number;
  }
) {
  const session = await getAuthSession();
  const userId = requireUserId(session);

  // Verify task belongs to user
  const task = await prisma.task.findFirst({
    where: { id: taskId, userId },
    select: { id: true },
  });
  if (!task) throw new Error("Task not found");

  await prisma.taskAttachment.create({
    data: {
      taskId,
      userId,
      name: attachment.name,
      url: attachment.url,
      mimeType: attachment.mimeType,
      size: attachment.size,
    },
  });

  revalidatePath("/dashboard/tasks");
}

export async function getTaskAttachments(taskId: string) {
  const session = await getAuthSession();
  const userId = requireUserId(session);

  // Verify task belongs to user
  const task = await prisma.task.findFirst({
    where: { id: taskId, userId },
    select: { id: true },
  });
  if (!task) throw new Error("Task not found");

  return await prisma.taskAttachment.findMany({
    where: { taskId },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      url: true,
      mimeType: true,
      size: true,
      createdAt: true,
    },
  });
}

export async function deleteTaskAttachment(attachmentId: string) {
  const session = await getAuthSession();
  const userId = requireUserId(session);

  // Verify attachment belongs to user's task
  const attachment = await prisma.taskAttachment.findFirst({
    where: { id: attachmentId },
    select: { id: true, taskId: true, url: true },
  });
  if (!attachment) throw new Error("Attachment not found");

  const task = await prisma.task.findFirst({
    where: { id: attachment.taskId, userId },
    select: { id: true },
  });
  if (!task) throw new Error("Not allowed");

  // Delete from database
  await prisma.taskAttachment.delete({
    where: { id: attachmentId },
  });

  // Optionally delete file from filesystem
  // Note: For production, consider keeping files or using a cleanup job
  try {
    const { unlink } = await import("fs/promises");
    const { join } = await import("path");
    const filepath = join(process.cwd(), "public", attachment.url);
    await unlink(filepath);
  } catch (error) {
    // File might not exist or already deleted, ignore
    console.warn("Could not delete file:", error);
  }

  revalidatePath("/dashboard/tasks");
}

export async function createSubtask(taskId: string, title: string) {
  const session = await getAuthSession();
  const userId = requireUserId(session);

  const text = title.trim();
  if (!text) throw new Error("Title is required");

  const task = await prisma.task.findFirst({
    where: { id: taskId, userId },
    select: { id: true },
  });
  if (!task) throw new Error("Not found");

  const subtask = await prisma.subtask.create({
    data: {
      taskId,
      title: text,
      isDone: false,
    },
  });

  revalidatePath("/dashboard/tasks");
  return subtask;
}

export async function toggleSubtask(subtaskId: string, isDone: boolean) {
  const session = await getAuthSession();
  const userId = requireUserId(session);

  const subtask = await prisma.subtask.findFirst({
    where: { id: subtaskId },
    select: { id: true, taskId: true },
  });
  if (!subtask) throw new Error("Not found");

  const task = await prisma.task.findFirst({
    where: { id: subtask.taskId, userId },
    select: { id: true },
  });
  if (!task) throw new Error("Not allowed");

  await prisma.subtask.update({
    where: { id: subtaskId },
    data: { isDone },
  });

  revalidatePath("/dashboard/tasks");
}

export async function deleteSubtask(subtaskId: string) {
  const session = await getAuthSession();
  const userId = requireUserId(session);

  const subtask = await prisma.subtask.findFirst({
    where: { id: subtaskId },
    select: { id: true, taskId: true },
  });
  if (!subtask) throw new Error("Not found");

  const task = await prisma.task.findFirst({
    where: { id: subtask.taskId, userId },
    select: { id: true },
  });
  if (!task) throw new Error("Not allowed");

  await prisma.subtask.delete({
    where: { id: subtaskId },
  });

  revalidatePath("/dashboard/tasks");
}

export async function getTaskSubtasks(taskId: string) {
  const session = await getAuthSession();
  const userId = requireUserId(session);

  const task = await prisma.task.findFirst({
    where: { id: taskId, userId },
    select: { id: true },
  });
  if (!task) throw new Error("Not found");

  return await prisma.subtask.findMany({
    where: { taskId },
    orderBy: { createdAt: "asc" } as any,
  });
}

export async function duplicateTask(taskId: string) {
  const session = await getAuthSession();
  const userId = requireUserId(session);

  const task = await prisma.task.findFirst({
    where: { id: taskId, userId },
    include: {
      tags: true,
      subtasks: true,
      taskTags: true,
    } as any,
  });
  if (!task) throw new Error("Not found");

  // Create new task
  const newTask = await prisma.task.create({
    data: {
      userId,
      title: `Copy of ${task.title}`,
      description: task.description,
      priority: task.priority,
      status: "todo", // Reset status
      projectId: task.projectId,
      isPinned: false as any, // Don't pin copy
      isTemplate: false as any, // Don't template copy

      // Copy tags
      taskTags: (task as any).taskTags.length > 0
        ? {
          create: task.taskTags.map((tt) => ({ tagId: tt.tagId })),
        }
        : undefined,

      // Copy subtasks (reset isDone)
      subtasks: task.subtasks.length > 0
        ? {
          create: task.subtasks.map((s) => ({
            title: s.title,
            isDone: false,
          })),
        }
        : undefined,
    },
  });

  revalidatePath("/dashboard/tasks");
  return newTask;
}

export async function deleteProject(projectId: string) {
  const session = await getAuthSession();
  const userId = requireUserId(session);

  const project = await prisma.project.findFirst({
    where: { id: projectId, userId },
  });
  if (!project) throw new Error("Project not found");

  await prisma.project.delete({ where: { id: projectId } });
  revalidatePath("/dashboard/tasks");
}

export async function updateProjectName(projectId: string, name: string) {
  const session = await getAuthSession();
  const userId = requireUserId(session);

  const project = await prisma.project.findFirst({
    where: { id: projectId, userId },
  });
  if (!project) throw new Error("Project not found");

  await prisma.project.update({
    where: { id: projectId },
    data: { name: name.trim() },
  });
  revalidatePath("/dashboard/tasks");
}

export async function deleteTag(tagId: string) {
  const session = await getAuthSession();
  const userId = requireUserId(session);

  const tag = await prisma.tag.findFirst({
    where: { id: tagId, userId },
  });
  if (!tag) throw new Error("Tag not found");

  await prisma.tag.delete({ where: { id: tagId } });
  revalidatePath("/dashboard/tasks");
}

export async function toggleProjectPin(projectId: string, isPinned: boolean) {
  const session = await getAuthSession();
  const userId = requireUserId(session);

  await (prisma.project as any).update({
    where: { id: projectId, userId },
    data: { isPinned: !!isPinned },
  });

  revalidatePath("/dashboard/tasks");
}

export async function toggleTagPin(tagId: string, isPinned: boolean) {
  const session = await getAuthSession();
  const userId = requireUserId(session);

  await (prisma.tag as any).update({
    where: { id: tagId, userId },
    data: { isPinned: !!isPinned },
  });

  revalidatePath("/dashboard/tasks");
}

export async function updateTagName(tagId: string, name: string, color?: string | null) {
  const session = await getAuthSession();
  const userId = requireUserId(session);

  const tag = await prisma.tag.findFirst({
    where: { id: tagId, userId },
  });
  if (!tag) throw new Error("Tag not found");

  try {
    const updateData: any = { name: name.trim() };
    if (color !== undefined) updateData.color = color;

    await (prisma.tag as any).update({
      where: { id: tagId },
      data: updateData,
    });
  } catch (error) {
    console.error("Error updating tag:", error);
    throw new Error("Failed to update tag");
  }
  revalidatePath("/dashboard/tasks");
}
