"use server";

import { requireUser } from "@/lib/require-user";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import {
  getUtcTodayRange,
  getUtcMonthRange,
  getUtcMonthRangeFromISO,
  getUtcWeekRange,
  getLocalDayOfWeek,
  getZonedParts,
} from "@/lib/time/day-range";

export async function updateDashboardActivityLayoutAction(layout: any) {
  try {
    const user = await requireUser();

    await prisma.user.update({
      where: { id: user.id },
      data: {
        dashboardLayout: layout,
      },
    });

    revalidatePath("/dashboard");
    return { success: "Макет збережено успішно" };
  } catch (error) {
    console.error("Помилка збереження макета:", error);
    return { error: "Не вдалося зберегти макет" };
  }
}

export async function getFullDashboardData() {
  const user = await requireUser();
  const tz = user.timezone || "Europe/Kyiv";

  const today = getUtcTodayRange(tz);
  const { start: monthStart, end: monthEnd } = getUtcMonthRange(tz);
  const { start: weekStart, end: weekEnd } = getUtcWeekRange(tz);

  const now = new Date();

  // Previous month range
  const p = getZonedParts(now, tz);
  const prevM = p.month === 1 ? 12 : p.month - 1;
  const prevY = p.month === 1 ? p.year - 1 : p.year;
  const prevMonthFirstISO = `${prevY}-${String(prevM).padStart(2, "0")}-01`;
  const { start: prevMonthStart, end: prevMonthEnd } = getUtcMonthRangeFromISO(prevMonthFirstISO, tz);

  const [
    monthlyWork,
    weeklyEntries,
    activeTimer,
    todayWork,

    activeProjects,
    recentProjects,

    pendingTasks,
    overdueTasks,

    financeAccounts,
    monthlyIncome,
    monthlyExpense,
    recentTransactions,

    recentNotes,
    pinnedNotesCount,

    activeClientsCount,
    allClientsRevenue,

    prevMonthWork,
    transactionsByClient,
    urgentTasks,
    completedTasksToday,
    totalTasksToday,
  ] = await Promise.all([
    prisma.timeEntry.aggregate({
      where: { userId: user.id, type: "work", startAt: { gte: monthStart, lte: monthEnd } },
      _sum: { durationSec: true },
    }),

    prisma.timeEntry.findMany({
      where: { userId: user.id, type: "work", startAt: { gte: weekStart, lte: weekEnd } },
      select: { startAt: true, durationSec: true },
    }),

    prisma.activeTimer.findUnique({
      where: { userId: user.id },
      include: {
        project: { select: { name: true } },
        task: { select: { title: true } },
      },
    }),

    prisma.timeEntry.aggregate({
      where: { userId: user.id, type: "work", startAt: { gte: today.start } },
      _sum: { durationSec: true },
    }),

    prisma.project.count({
      where: { userId: user.id, status: "active" },
    }),

    prisma.project.findMany({
      where: { userId: user.id, status: "active" },
      orderBy: { updatedAt: "desc" },
      take: 4,
      select: { id: true, name: true, updatedAt: true, clientId: true, client: { select: { name: true } } },
    }),

    prisma.task.count({
      where: { userId: user.id, status: { in: ["todo", "doing"] } },
    }),

    prisma.task.count({
      where: { userId: user.id, status: { in: ["todo", "doing"] }, dueAt: { lt: now } },
    }),

    prisma.financeAccount.findMany({
      where: { userId: user.id },
      select: { id: true, name: true, balance: true, currency: true, type: true },
      orderBy: { balance: "desc" },
    }),

    prisma.transaction.aggregate({
      where: { userId: user.id, type: "income", date: { gte: monthStart, lte: monthEnd } },
      _sum: { amount: true },
    }),

    prisma.transaction.aggregate({
      where: { userId: user.id, type: "expense", date: { gte: monthStart, lte: monthEnd } },
      _sum: { amount: true },
    }),

    prisma.transaction.findMany({
      where: { userId: user.id, type: { in: ["income", "expense"] } },
      orderBy: { date: "desc" },
      take: 5,
      select: {
        id: true, amount: true, type: true, description: true, date: true,
        category: { select: { name: true } },
      },
    }),

    prisma.note.findMany({
      where: { userId: user.id, isArchived: false },
      orderBy: { updatedAt: "desc" },
      take: 4,
      select: { id: true, title: true, updatedAt: true, content: true },
    }),

    prisma.note.count({
      where: { userId: user.id, isFavorite: true, isArchived: false }
    }),

    prisma.client.count({
      where: { userId: user.id }
    }),

    prisma.transaction.groupBy({
      by: ["clientId"],
      where: { userId: user.id, type: "income", clientId: { not: null } },
      _sum: { amount: true },
      orderBy: { _sum: { amount: "desc" } },
      take: 5
    }),

    prisma.timeEntry.aggregate({
      where: {
        userId: user.id,
        type: "work",
        startAt: { gte: prevMonthStart, lte: prevMonthEnd }
      },
      _sum: { durationSec: true }
    }),

    prisma.transaction.groupBy({
      by: ["clientId"],
      where: { userId: user.id, type: "income", date: { gte: monthStart, lte: monthEnd }, clientId: { not: null } },
      _sum: { amount: true }
    }),

    prisma.task.findMany({
      where: {
        userId: user.id,
        status: { in: ["todo", "doing"] },
        dueAt: { not: null, gt: now }
      },
      orderBy: { dueAt: "asc" },
      take: 8,
      select: { id: true, title: true, dueAt: true, priority: true, status: true }
    }),

    prisma.task.count({
      where: { userId: user.id, status: "done", updatedAt: { gte: today.start } }
    }),

    prisma.task.count({
      where: {
        userId: user.id,
        OR: [
          { dueAt: { gte: today.start, lte: today.end } },
          { status: "done", updatedAt: { gte: today.start } }
        ]
      }
    }),
  ]);

  const topClientIds = allClientsRevenue.map((t) => t.clientId).filter(Boolean) as string[];
  const topClients = await prisma.client.findMany({
    where: { id: { in: topClientIds } },
    select: { id: true, name: true }
  });
  const topClientNameMap = new Map(topClients.map((c) => [c.id, c.name]));

  const topClientsRevenue = allClientsRevenue.map((t) => ({
    name: topClientNameMap.get(t.clientId as string) || "Клієнт",
    value: Number(t._sum.amount || 0)
  }));

  const clientIds = transactionsByClient.map((t) => t.clientId as string);
  const clients = await prisma.client.findMany({
    where: { id: { in: clientIds } },
    select: { id: true, name: true }
  });
  const clientNameMap = new Map(clients.map((c) => [c.id, c.name]));

  const revenueByClient = transactionsByClient.map((t) => ({
    name: clientNameMap.get(t.clientId as string) || "Невідомий клієнт",
    value: Number(t._sum.amount || 0)
  }));

  const dailyMap: Record<number, number> = {};
  weeklyEntries.forEach((e) => {
    const day = getLocalDayOfWeek(e.startAt, tz);
    dailyMap[day] = (dailyMap[day] || 0) + (e.durationSec || 0);
  });
  const weeklyHours = [1, 2, 3, 4, 5, 6, 0].map((dow: number) =>
    Math.round(((dailyMap[dow] || 0) / 3600) * 10) / 10
  );

  return {
    totalDuration: monthlyWork._sum.durationSec ?? 0,
    todayDuration: todayWork._sum.durationSec ?? 0,
    hasActiveTimer: !!activeTimer,
    activeProjectName: activeTimer?.project?.name,
    activeTaskName: activeTimer?.task?.title,
    weeklyHours,

    projectCount: activeProjects,
    recentProjects: recentProjects.map((p) => ({
      id: p.id,
      name: p.name,
      clientName: p.client?.name,
      updatedAt: p.updatedAt.toISOString(),
    })),

    pendingTasksCount: pendingTasks,
    overdueTasksCount: overdueTasks,

    financeAccounts: financeAccounts.map((a) => ({
      name: a.name,
      balance: Number(a.balance),
      currency: a.currency,
      type: a.type,
    })),
    monthlyIncome: Number(monthlyIncome._sum.amount ?? 0),
    monthlyExpense: Number(monthlyExpense._sum.amount ?? 0),
    recentTransactions: recentTransactions.map((t) => ({
      id: t.id,
      amount: Number(t.amount),
      type: t.type,
      description: t.description || t.category.name,
      date: t.date.toISOString(),
    })),

    prevMonthDuration: prevMonthWork._sum.durationSec ?? 0,
    revenueByClient,
    urgentTasks: urgentTasks.map((t) => ({
      id: t.id,
      title: t.title,
      dueAt: t.dueAt?.toISOString(),
      priority: t.priority
    })),

    recentNotes: recentNotes.map((n) => ({
      id: n.id,
      title: n.title,
      content: n.content?.substring(0, 100),
      updatedAt: n.updatedAt.toISOString(),
    })),
    pinnedNotesCount,

    activeClientsCount,
    topClientsRevenue,

    completedTasksToday,
    totalTasksToday,
    taskCompletionRate: totalTasksToday > 0 ? Math.round((completedTasksToday / totalTasksToday) * 100) : 0,
  };
}
