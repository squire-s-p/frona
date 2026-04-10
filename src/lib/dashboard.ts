// src/lib/dashboard.ts
import { prisma } from "@/lib/prisma";

type DashboardStats = {
  activeProjects: number;
  tasksTodayTotal: number;
  tasksTodayDoing: number;
  timeTodaySeconds: number;
  balanceMonth: number; // income - expense (у валюті записів)
};

function startOfDay(d = new Date()) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0);
}
function endOfDay(d = new Date()) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999);
}
function startOfMonth(d = new Date()) {
  return new Date(d.getFullYear(), d.getMonth(), 1, 0, 0, 0, 0);
}

export async function getDashboardStats(userId: string): Promise<DashboardStats> {
  const todayStart = startOfDay();
  const todayEnd = endOfDay();
  const monthStart = startOfMonth();

  const [
    activeProjects,
    tasksTodayTotal,
    tasksTodayDoing,
    timeEntriesToday,
    transactionsMonth,
  ] = await Promise.all([
    prisma.project.count({
      where: { userId, status: "active" },
    }),

    prisma.task.count({
      where: {
        userId,
        // “сьогодні” = dueAt потрапляє у сьогоднішній день
        dueAt: { gte: todayStart, lte: todayEnd },
      },
    }),

    prisma.task.count({
      where: {
        userId,
        status: "doing",
        dueAt: { gte: todayStart, lte: todayEnd },
      },
    }),

    prisma.timeEntry.findMany({
      where: {
        userId,
        startAt: { gte: todayStart, lte: todayEnd },
      },
      select: { startAt: true, endAt: true },
      orderBy: { startAt: "asc" },
    }),

    prisma.transaction.findMany({
      where: {
        userId,
        date: { gte: monthStart, lte: new Date() },
      },
      select: { type: true, amount: true },
    }),
  ]);

  const timeTodaySeconds = timeEntriesToday.reduce((acc, t) => {
    const start = t.startAt.getTime();
    const end = (t.endAt ?? new Date()).getTime();
    const diff = Math.max(0, Math.floor((end - start) / 1000));
    return acc + diff;
  }, 0);

  const balanceMonth = transactionsMonth.reduce((acc, tx) => {
    const amount = Number(tx.amount); // Decimal -> number
    return tx.type === "income" ? acc + amount : acc - amount;
  }, 0);

  return {
    activeProjects,
    tasksTodayTotal,
    tasksTodayDoing,
    timeTodaySeconds,
    balanceMonth,
  };
}

export async function getTodayTasks(userId: string) {
  const todayStart = startOfDay();
  const todayEnd = endOfDay();

  return prisma.task.findMany({
    where: { userId, dueAt: { gte: todayStart, lte: todayEnd } },
    select: {
      id: true,
      title: true,
      status: true,
      priority: true,
      project: { select: { name: true } },
    },
    orderBy: [{ status: "asc" }, { priority: "desc" }],
    take: 5,
  });
}

export async function getUserBase(userId: string) {
  return prisma.user.findUnique({
    where: { id: userId },
    select: { baseCurrency: true, name: true },
  });
}
