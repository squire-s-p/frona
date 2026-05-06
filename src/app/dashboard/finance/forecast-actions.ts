"use server";

import { prisma } from "@/lib/prisma";
import { getAuthSession } from "@/lib/auth-session";
import { redirect } from "next/navigation";
import { addDays, addMonths, format } from "date-fns";
import { uk } from "date-fns/locale";

async function requireUser() {
    const session = await getAuthSession();
    if (!session?.user) redirect("/login");
    return session.user;
}

export interface ForecastOptions {
    months?: number;
    whatIf?: {
        name: string;
        amount: number;
        date: Date;
        type: "income" | "expense";
    }[];
}

/**
 * Герує прогноз руху коштів на вказану кількість місяців (Симулятор)
 */
export async function generateForecast(options: ForecastOptions = { months: 6 }) {
    const user = await requireUser();
    const months = options.months || 6;
    const now = new Date();
    const endDate = addMonths(now, months);

    // 1. Отримуємо баланси: загальний та ліквідний
    const accounts = await prisma.financeAccount.findMany({
        where: { userId: user.id, isArchived: false }
    });

    const currentTotalBalance = accounts.reduce((sum: number, acc) => sum + Number(acc.balance), 0);
    const currentLiquidBalance = accounts
        .filter((acc) => acc.role === "liquid" || acc.type === "cash")
        .reduce((sum: number, acc) => sum + Number(acc.balance), 0);

    // 2. Отримуємо рекурентні платежі, які впливають на прогноз
    const recurring = await prisma.recurringPayment.findMany({
        where: {
            userId: user.id,
            affectsForecast: true,
            OR: [
                { endDate: null },
                { endDate: { gte: now } }
            ]
        }
    });

    // 3. Отримуємо заплановані майбутні транзакції
    const scheduled = await prisma.transaction.findMany({
        where: {
            userId: user.id,
            date: { gt: now, lte: endDate },
            isRecurring: false
        }
    });

    const dailyProjections = [];
    const cashGaps: { date: Date; balance: number }[] = [];
    let movingLiquidBalance = currentLiquidBalance;
    let movingTotalBalance = currentTotalBalance;

    // Симуляція по днях
    for (let d = new Date(now); d <= endDate; d = addDays(d, 1)) {
        let dayIncome = 0;
        let dayExpense = 0;

        // Поточна дата для порівняння
        const dStr = d.toDateString();

        // А) Рекурентні платежі
        for (const payment of recurring) {
            let nextDate = new Date(payment.nextPaymentDate);

            // Якщо це разовий платіж (once), перевіряємо тільки його наступну дату
            if (payment.frequency === "once") {
                if (nextDate.toDateString() === dStr && nextDate >= now) {
                    const amount = Number(payment.amount);
                    if (payment.type === "income" || amount > 0) dayIncome += Math.abs(amount);
                    else dayExpense += Math.abs(amount);
                }
            } else {
                // Для циклічних платежів шукаємо всі входження у майбутньому
                while (nextDate <= endDate) {
                    if (nextDate.toDateString() === dStr) {
                        const amount = Number(payment.amount);
                        if (payment.type === "income" || amount > 0) dayIncome += Math.abs(amount);
                        else dayExpense += Math.abs(amount);
                    }

                    if (payment.frequency === "weekly") nextDate = addDays(nextDate, 7);
                    else if (payment.frequency === "monthly") nextDate = addMonths(nextDate, 1);
                    else if (payment.frequency === "yearly") nextDate = addMonths(nextDate, 12);
                    else break;
                }
            }
        }

        // Б) Заплановані транзакції
        const dayScheduled = scheduled.filter((t) => t.date.toDateString() === dStr);
        for (const t of dayScheduled) {
            const amount = Math.abs(Number(t.amount));
            if (t.type === "income") dayIncome += amount;
            else dayExpense += amount;
        }

        // В) What-if сценарії
        if (options.whatIf) {
            const dayWhatIf = options.whatIf.filter(w => new Date(w.date).toDateString() === dStr);
            for (const w of dayWhatIf) {
                const amount = Math.abs(w.amount);
                if (w.type === "income") dayIncome += amount;
                else dayExpense += amount;
            }
        }

        movingLiquidBalance += (dayIncome - dayExpense);
        movingTotalBalance += (dayIncome - dayExpense);

        // Виявлення касового розриву
        if (movingLiquidBalance < 0) {
            cashGaps.push({ date: new Date(d), balance: movingLiquidBalance });
        }

        dailyProjections.push({
            date: new Date(d),
            liquidBalance: movingLiquidBalance,
            totalBalance: movingTotalBalance,
            income: dayIncome,
            expense: dayExpense
        });
    }

    // Групуємо по місяцях для звіту
    type MonthlyReportItem = { month: string; income: number; expense: number; endBalance: number; endLiquidBalance: number };
    const monthlyReport: MonthlyReportItem[] = [];
    dailyProjections.forEach((p) => {
        const monthKey = format(p.date, 'LLLL yyyy', { locale: uk });
        let month = monthlyReport.find((m) => m.month === monthKey);
        if (!month) {
            month = { month: monthKey, income: 0, expense: 0, endBalance: 0, endLiquidBalance: 0 };
            monthlyReport.push(month);
        }
        month.income += p.income;
        month.expense += p.expense;
        month.endBalance = p.totalBalance;
        month.endLiquidBalance = p.liquidBalance;
    });

    return {
        daily: dailyProjections,
        monthly: monthlyReport,
        cashGaps,
        currentBalance: currentTotalBalance,
        currentLiquidBalance
    };
}

/**
 * Отримує метрики фінансового здоров’я
 */
export async function getFinancialHealth() {
    const user = await requireUser();
    const now = new Date();
    const lastMonth = addMonths(now, -1);
    const sixMonthsAgo = addMonths(now, -6);

    // 1. Burn Rate (середні витрати за останній місяць)
    const recentExpenses = await prisma.transaction.aggregate({
        where: {
            userId: user.id,
            type: "expense",
            date: { gte: lastMonth, lte: now }
        },
        _sum: { amount: true }
    });

    const burnRate = Number(recentExpenses._sum.amount || 0);

    // 2. Рахунки: загальний та ліквідний баланси
    const accounts = await prisma.financeAccount.findMany({
        where: { userId: user.id, includeInTotal: true, isArchived: false }
    });

    const totalBalance = accounts.reduce((sum: number, acc) => sum + Number(acc.balance), 0);
    const liquidBalance = accounts
        .filter((acc) => acc.role === "liquid" || acc.type === "cash")
        .reduce((sum: number, acc) => sum + Number(acc.balance), 0);

    // 3. Runway
    const totalRunway = burnRate > 0 ? totalBalance / burnRate : Infinity;
    const liquidRunway = burnRate > 0 ? liquidBalance / burnRate : Infinity;

    // 4. Savings Rate (% заощаджень від доходу за останній місяць)
    const recentIncome = await prisma.transaction.aggregate({
        where: {
            userId: user.id,
            type: "income",
            date: { gte: lastMonth, lte: now }
        },
        _sum: { amount: true }
    });

    const incomeSum = Number(recentIncome._sum.amount || 0);
    const savingsRate = incomeSum > 0 ? ((incomeSum - burnRate) / incomeSum) * 100 : 0;

    // 5. Income Stability (Варіативність за останні 6 місяців)
    const monthlyIncomeTx = await prisma.transaction.groupBy({
        by: ['date'],
        where: {
            userId: user.id,
            type: "income",
            date: { gte: sixMonthsAgo, lte: now }
        },
        _sum: { amount: true }
    });

    // Групуємо по місяцях
    const monthlyTotals: Record<string, number> = {};
    monthlyIncomeTx.forEach((tx) => {
        const key = format(tx.date, 'yyyy-MM');
        monthlyTotals[key] = (monthlyTotals[key] || 0) + Number(tx._sum.amount || 0);
    });

    const incomes = Object.values(monthlyTotals);
    let stabilityScore = 0;
    if (incomes.length >= 2) {
        const avg = incomes.reduce((a, b) => a + b, 0) / incomes.length;
        const squareDiffs = incomes.map(v => Math.pow(v - avg, 2));
        const stdDev = Math.sqrt(squareDiffs.reduce((a, b) => a + b, 0) / incomes.length);
        // Коефіцієнт варіації: чим менший, тим стабільніший дохід (1 - CV)
        const cv = avg > 0 ? stdDev / avg : 1;
        stabilityScore = Math.max(0, Math.min(100, (1 - cv) * 100));
    } else if (incomes.length === 1) {
        stabilityScore = 50; // Мало даних
    }

    // 6. Прогнозовані залишки (30, 60, 90 днів)
    const forecast = await generateForecast({ months: 3 });
    const getBalanceAtDay = (days: number) => {
        const targetDate = addDays(now, days);
        const dayReport = forecast.daily.find(d =>
            format(d.date, 'yyyy-MM-dd') === format(targetDate, 'yyyy-MM-dd')
        );
        return dayReport ? dayReport.totalBalance : totalBalance;
    };

    return {
        burnRate,
        runway: totalRunway,
        liquidRunway,
        savingsRate,
        stabilityScore,
        totalBalance,
        liquidBalance,
        projections: {
            d30: getBalanceAtDay(30),
            d60: getBalanceAtDay(60),
            d90: getBalanceAtDay(90)
        }
    };
}
