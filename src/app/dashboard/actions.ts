"use server";

import { getAuthSession } from "@/lib/auth-session";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { startOfMonth, endOfMonth, startOfWeek, endOfWeek, startOfDay, endOfDay, subDays } from "date-fns";

export async function updateDashboardActivityLayoutAction(layout: any) {
  try {
    const session = await getAuthSession();
    if (!session?.user?.id) {
      return { error: "Ви не авторизовані" };
    }

    await prisma.user.update({
      where: { id: session.user.id },
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
  const session = await getAuthSession();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const userId = session.user.id;
  const now = new Date();
  const monthStart = startOfMonth(now);
  const monthEnd = endOfMonth(now);
  const weekStart = startOfWeek(now, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(now, { weekStartsOn: 1 });

  const [
    // Time
    monthlyWork,
    weeklyEntries,
    activeTimer,
    todayWork,

    // Projects
    activeProjects,
    recentProjects,

    // Tasks
    pendingTasks,
    overdueTasks,

    // Finance
    financeAccounts,
    monthlyIncome,
    monthlyExpense,
    recentTransactions,

    // Notes
    recentNotes,
    pinnedNotesCount,

    // Clients
    activeClientsCount,
    allClientsRevenue,

    // Statistics
    prevMonthWork,
    transactionsByClient,
    urgentTasks,
    completedTasksToday,
    totalTasksToday,
  ] = await Promise.all([
    // Total time this month
    prisma.timeEntry.aggregate({
      where: { userId, type: "work", startAt: { gte: monthStart, lte: monthEnd } },
      _sum: { durationSec: true },
    }),

    // Daily hours this week (for bar chart)
    prisma.timeEntry.findMany({
      where: { userId, type: "work", startAt: { gte: weekStart, lte: weekEnd } },
      select: { startAt: true, durationSec: true },
    }),

    // Active timer from ActiveTimer model
    prisma.activeTimer.findUnique({
      where: { userId },
      include: {
        project: { select: { name: true } },
        task: { select: { title: true } },
      },
    }),

    // Today's work
    prisma.timeEntry.aggregate({
      where: { userId, type: "work", startAt: { gte: startOfDay(now) } },
      _sum: { durationSec: true },
    }),

    // Active projects count
    prisma.project.count({
      where: { userId, status: "active" },
    }),

    // Recent projects
    prisma.project.findMany({
      where: { userId, status: "active" },
      orderBy: { updatedAt: "desc" },
      take: 4,
      select: { id: true, name: true, updatedAt: true, clientId: true, client: { select: { name: true } } },
    }),

    // Pending tasks
    prisma.task.count({
      where: { userId, status: { in: ["todo", "doing"] } },
    }),

    // Overdue tasks (past due date, not done)
    prisma.task.count({
      where: { userId, status: { in: ["todo", "doing"] }, dueAt: { lt: now } },
    }),

    // Finance accounts
    prisma.financeAccount.findMany({
      where: { userId },
      select: { id: true, name: true, balance: true, currency: true, type: true },
      orderBy: { balance: "desc" },
    }),

    // Monthly income
    prisma.transaction.aggregate({
      where: { userId, type: "income", date: { gte: monthStart, lte: monthEnd } },
      _sum: { amount: true },
    }),

    // Monthly expense
    prisma.transaction.aggregate({
      where: { userId, type: "expense", date: { gte: monthStart, lte: monthEnd } },
      _sum: { amount: true },
    }),

    // Recent transactions
    prisma.transaction.findMany({
      where: { userId },
      orderBy: { date: "desc" },
      take: 5,
      select: {
        id: true, amount: true, type: true, description: true, date: true,
        category: { select: { name: true } },
      },
    }),

    // Recent notes (not archived)
    prisma.note.findMany({
      where: { userId, isArchived: false },
      orderBy: { updatedAt: "desc" },
      take: 4,
      select: { id: true, title: true, updatedAt: true, content: true },
    }),

    // Pinned notes
    prisma.note.count({
      where: { userId, isFavorite: true, isArchived: false }
    }),

    // Clients
    prisma.client.count({
      where: { userId }
    }),

    // Clients Revenue (Top)
    prisma.transaction.groupBy({
      by: ["clientId"],
      where: { userId, type: "income", clientId: { not: null } },
      _sum: { amount: true },
      orderBy: { _sum: { amount: "desc" } },
      take: 5
    }),

    // Previous month total work
    prisma.timeEntry.aggregate({
      where: {
        userId,
        type: "work",
        startAt: {
          gte: startOfMonth(subDays(monthStart, 1)),
          lte: endOfMonth(subDays(monthStart, 1))
        }
      },
      _sum: { durationSec: true }
    }),

    // Revenue by client (only this month)
    prisma.transaction.groupBy({
      by: ["clientId"],
      where: { userId, type: "income", date: { gte: monthStart, lte: monthEnd }, clientId: { not: null } },
      _sum: { amount: true }
    }),

    // Urgent tasks (due in next 3 days)
    prisma.task.findMany({
      where: {
        userId,
        status: { in: ["todo", "doing"] },
        dueAt: { not: null, gt: now }
      },
      orderBy: { dueAt: "asc" },
      take: 8,
      select: { id: true, title: true, dueAt: true, priority: true, status: true }
    }),

    // Tasks completion today
    prisma.task.count({
      where: { userId, status: "done", updatedAt: { gte: startOfDay(now) } }
    }),

    // Total tasks for today (either due today or updated to done today)
    prisma.task.count({
      where: { 
        userId, 
        OR: [
          { dueAt: { gte: startOfDay(now), lte: endOfDay(now) } },
          { status: "done", updatedAt: { gte: startOfDay(now) } }
        ]
      }
    }),
  ]);

  // Clients for all-time revenue mapping
  const topClientIds = allClientsRevenue.map((t: { clientId: string | null }) => t.clientId).filter(Boolean) as string[];
  const topClients = await prisma.client.findMany({
    where: { id: { in: topClientIds } },
    select: { id: true, name: true }
  });
  const topClientNameMap = new Map(topClients.map(c => [c.id, c.name]));

  const topClientsRevenue = allClientsRevenue.map(t => ({
    name: topClientNameMap.get(t.clientId as string) || "Клієнт",
    value: Number(t._sum.amount || 0)
  }));

  // Map clients names for revenue
  const clientIds = transactionsByClient.map(t => t.clientId as string);
  const clients = await prisma.client.findMany({
    where: { id: { in: clientIds } },
    select: { id: true, name: true }
  });
  const clientNameMap = new Map(clients.map(c => [c.id, c.name]));

  const revenueByClient = transactionsByClient.map(t => ({
    name: clientNameMap.get(t.clientId as string) || "Невідомий клієнт",
    value: Number(t._sum.amount || 0)
  }));

  // Build weekly chart data: group by day Mon-Sun
  const dailyMap: Record<number, number> = {};
  weeklyEntries.forEach((e) => {
    const day = e.startAt.getDay(); // 0=Sun, 1=Mon... 6=Sat
    dailyMap[day] = (dailyMap[day] || 0) + (e.durationSec || 0);
  });
  // ISO week: Mon(1) -> Sun(0), map to [Mon, Tue, Wed, Thu, Fri, Sat, Sun]
  const weeklyHours = [1, 2, 3, 4, 5, 6, 0].map((dow) =>
    Math.round(((dailyMap[dow] || 0) / 3600) * 10) / 10
  );

  return {
    // Time
    totalDuration: monthlyWork._sum.durationSec ?? 0,
    todayDuration: todayWork._sum.durationSec ?? 0,
    hasActiveTimer: !!activeTimer,
    activeProjectName: activeTimer?.project?.name,
    activeTaskName: activeTimer?.task?.title,
    weeklyHours,

    // Projects
    projectCount: activeProjects,
    recentProjects: recentProjects.map((p) => ({
      id: p.id,
      name: p.name,
      clientName: p.client?.name,
      updatedAt: p.updatedAt.toISOString(),
    })),

    // Tasks
    pendingTasksCount: pendingTasks,
    overdueTasksCount: overdueTasks,

    // Finance
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

    // Statistics
    prevMonthDuration: prevMonthWork._sum.durationSec ?? 0,
    revenueByClient,
    urgentTasks: urgentTasks.map(t => ({
      id: t.id,
      title: t.title,
      dueAt: t.dueAt?.toISOString(),
      priority: t.priority
    })),

    // Recent notes
    recentNotes: recentNotes.map((n) => ({
      id: n.id,
      title: n.title,
      content: n.content?.substring(0, 100),
      updatedAt: n.updatedAt.toISOString(),
    })),
    pinnedNotesCount,

    // Clients
    activeClientsCount,
    topClientsRevenue,

    // Tasks Statistics
    completedTasksToday,
    totalTasksToday,
    taskCompletionRate: totalTasksToday > 0 ? Math.round((completedTasksToday / totalTasksToday) * 100) : 0,
  };
}
