"use server";

import { prisma } from "@/lib/prisma";
import { getAuthSession } from "@/lib/auth-session";
import { redirect } from "next/navigation";

async function requireUser() {
    const session = await getAuthSession();
    if (!session?.user) redirect("/login");
    return session.user;
}

/**
 * Отримує детальну аналітику по проектах
 */
export async function getProjectsProfitability() {
    const user = await requireUser();

    // Отримуємо всі проекти користувача
    const projects = await prisma.project.findMany({
        where: { userId: user.id },
        include: {
            client: true,
            _count: {
                select: { tasks: true, timeEntries: true, transactions: true }
            }
        },
        orderBy: { updatedAt: 'desc' }
    });

    const projectMetrics = await Promise.all(projects.map(async (project) => {
        // 1. Транзакції
        const transactions = await prisma.transaction.aggregate({
            where: { projectId: project.id, userId: user.id },
            _sum: { amount: true },
            _count: true
        });

        // Окремо дохід і витрати по проекту
        const incomeTx = await prisma.transaction.aggregate({
            where: { projectId: project.id, userId: user.id, type: "income" },
            _sum: { amount: true }
        });

        const expenseTx = await prisma.transaction.aggregate({
            where: { projectId: project.id, userId: user.id, type: "expense" },
            _sum: { amount: true }
        });

        const income = Number(incomeTx._sum.amount || 0);
        const expenses = Number(expenseTx._sum.amount || 0);
        const profit = income - expenses;
        const margin = income > 0 ? (profit / income) * 100 : 0;
        const roi = expenses > 0 ? (profit / expenses) * 100 : 0;

        // 2. Час
        const timeData = await prisma.timeEntry.aggregate({
            where: { projectId: project.id, userId: user.id, type: "work" },
            _sum: { durationSec: true }
        });

        const totalSeconds = Number(timeData._sum.durationSec || 0);
        const totalHours = totalSeconds / 3600;

        // 3. Ефективна погодинна ставка
        const hourlyRate = totalHours > 0 ? profit / totalHours : 0;

        // 4. Оплачено по інвойсах (якщо є)
        const paidInvoices = await prisma.invoice.aggregate({
            where: { projectId: project.id, userId: user.id, status: "paid" },
            _sum: { total: true }
        });

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
            paidInvoices: Number(paidInvoices._sum.total || 0),
            status: project.status,
            updatedAt: project.updatedAt.toISOString()
        };
    }));

    return projectMetrics.sort((a, b) => b.profit - a.profit);
}

/**
 * Отримує прибутковість по клієнтах
 */
export async function getClientsProfitability() {
    const user = await requireUser();
    const projectMetrics = await getProjectsProfitability();

    const clientStats: Record<string, any> = {};

    projectMetrics.forEach(p => {
        const clientName = p.client || "Приватний";
        if (!clientStats[clientName]) {
            clientStats[clientName] = {
                name: clientName,
                income: 0,
                expenses: 0,
                profit: 0,
                totalHours: 0,
                projectsCount: 0,
                paidInvoices: 0
            };
        }

        clientStats[clientName].income += p.income;
        clientStats[clientName].expenses += p.expenses;
        clientStats[clientName].profit += p.profit;
        clientStats[clientName].totalHours += p.totalHours;
        clientStats[clientName].projectsCount += 1;
        clientStats[clientName].paidInvoices += p.paidInvoices;
    });

    return Object.values(clientStats).map(c => ({
        ...c,
        margin: c.income > 0 ? (c.profit / c.income) * 100 : 0,
        hourlyRate: c.totalHours > 0 ? c.profit / c.totalHours : 0
    })).sort((a, b) => b.profit - a.profit);
}
