"use server";

import { prisma } from "@/lib/prisma";
import { getAuthSession } from "@/lib/auth-session";

export type SearchResult = {
  id: string;
  title: string;
  type: "task" | "project" | "note" | "client" | "whiteboard";
  href: string;
  subtitle?: string;
};

export async function searchDashboard(query: string): Promise<SearchResult[]> {
  if (!query || query.length < 2) return [];

  const session = await getAuthSession();
  if (!session?.user?.id) return [];

  const userId = session.user.id;
  const q = query.trim();

  // Паралельні запити до різних таблиць
  const [tasks, projects, notes, clients, whiteboards] = await Promise.all([
    prisma.task.findMany({
      where: {
        userId,
        OR: [
          { title: { contains: q, mode: "insensitive" } },
          { description: { contains: q, mode: "insensitive" } },
        ],
      },
      take: 5,
      select: { id: true, title: true },
    }),
    prisma.project.findMany({
      where: {
        userId,
        name: { contains: q, mode: "insensitive" },
      },
      take: 5,
      select: { id: true, name: true },
    }),
    prisma.note.findMany({
      where: {
        userId,
        OR: [
          { title: { contains: q, mode: "insensitive" } },
          { content: { contains: q, mode: "insensitive" } },
        ],
      },
      take: 5,
      select: { id: true, title: true },
    }),
    prisma.client.findMany({
      where: {
        userId,
        name: { contains: q, mode: "insensitive" },
      },
      take: 5,
      select: { id: true, name: true },
    }),
    prisma.whiteboard.findMany({
      where: {
        userId,
        title: { contains: q, mode: "insensitive" },
      },
      take: 5,
      select: { id: true, title: true },
    }),
  ]);

  const results: SearchResult[] = [
    ...tasks.map((t) => ({
      id: t.id,
      title: t.title,
      type: "task" as const,
      href: `/dashboard/tasks?id=${t.id}`, // або пряме посилання якщо є
    })),
    ...projects.map((p) => ({
      id: p.id,
      title: p.name,
      type: "project" as const,
      href: `/dashboard/projects/${p.id}`,
    })),
    ...notes.map((n) => ({
      id: n.id,
      title: n.title,
      type: "note" as const,
      href: `/dashboard/notes/${n.id}`,
    })),
    ...clients.map((c) => ({
      id: c.id,
      title: c.name,
      type: "client" as const,
      href: `/dashboard/clients/${c.id}`,
    })),
    ...whiteboards.map((w) => ({
      id: w.id,
      title: w.title,
      type: "whiteboard" as const,
      href: `/dashboard/whiteboard/${w.id}`,
    })),
  ];

  return results;
}
