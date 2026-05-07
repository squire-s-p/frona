"use server";

import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/require-user";

export async function getProjectsProfitability() {
    const user = await requireUser();

    const projects = await prisma.project.findMany({
        where: { userId: user.id },
        include: {
            client: true,
        },
        orderBy: { updatedAt: 'desc' }
    });

    const projectIds = projects.map((p) => p.id);
    if (projectIds.length === 0) return [];

    const [incomeAgg, expenseAgg, timeAgg, invoiceAgg] = await Promise.all([
        prisma.transaction.groupBy({
            by: ['projectId'],
            where: { projectId: { in: projectIds }, userId: user.id, type: "income" },
            _sum: { amount: true },
        }),
        prisma.transaction.groupBy({
            by: ['projectId'],
            where: { projectId: { in: projectIds }, userId: user.id, type: "expense" },
            _sum: { amount: true },
        }),
        prisma.timeEntry.groupBy({
            by: ['projectId'],
            where: { projectId: { in: projectIds }, userId: user.id, type: "work" },
            _sum: { durationSec: true },
        }),
        prisma.invoice.groupBy({
            by: ['projectId'],
            where: { projectId: { in: projectIds }, userId: user.id, status: "paid" },
            _sum: { total: true },
        }),
    ]);

    const incomeMap = new Map(incomeAgg.map((r) => [r.projectId, Number(r._sum.amount || 0)]));
    const expenseMap = new Map(expenseAgg.map((r) => [r.projectId, Number(r._sum.amount || 0)]));
    const timeMap = new Map(timeAgg.map((r) => [r.projectId, Number(r._sum.durationSec || 0)]));
    const invoiceMap = new Map(invoiceAgg.map((r) => [r.projectId, Number(r._sum.total || 0)]));

    return projects.map((project) => {
        const income = incomeMap.get(project.id) || 0;
        const expenses = expenseMap.get(project.id) || 0;
        const profit = income - expenses;
        const margin = income > 0 ? (profit / income) * 100 : 0;
        const roi = expenses > 0 ? (profit / expenses) * 100 : 0;
        const totalSeconds = timeMap.get(project.id) || 0;
        const totalHours = totalSeconds / 3600;
        const hourlyRate = totalHours > 0 ? profit / totalHours : 0;

        return {
            id: project.id,
            name: project.name,
            client: project.client?.name || project.clientName || "Приватний",
            income,
            expenses,
            profit,
            margin,
            roi,
            totalHours,
            hourlyRate,
            paidInvoices: invoiceMap.get(project.id) || 0,
            status: project.status,
            updatedAt: project.updatedAt.toISOString()
        };
    }).sort((a, b) => b.profit - a.profit);
}

export async function getClientsProfitability() {
    await requireUser();
    const projectMetrics = await getProjectsProfitability();

    const clientStats: Record<string, { name: string; income: number; expenses: number; profit: number; totalHours: number; projectsCount: number; paidInvoices: number }> = {};

    for (const p of projectMetrics) {
        const clientName = p.client || "Приватний";
        if (!clientStats[clientName]) {
            clientStats[clientName] = { name: clientName, income: 0, expenses: 0, profit: 0, totalHours: 0, projectsCount: 0, paidInvoices: 0 };
        }
        clientStats[clientName].income += p.income;
        clientStats[clientName].expenses += p.expenses;
        clientStats[clientName].profit += p.profit;
        clientStats[clientName].totalHours += p.totalHours;
        clientStats[clientName].projectsCount += 1;
        clientStats[clientName].paidInvoices += p.paidInvoices;
    }

    return Object.values(clientStats).map((c) => ({
        ...c,
        margin: c.income > 0 ? (c.profit / c.income) * 100 : 0,
        hourlyRate: c.totalHours > 0 ? c.profit / c.totalHours : 0
    })).sort((a, b) => b.profit - a.profit);
}
