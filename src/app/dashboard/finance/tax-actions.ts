"use server";

import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { startOfYear, endOfYear, startOfQuarter, endOfQuarter, format, subQuarters } from "date-fns";
import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/require-user";

const TAX_CONFIG = {
    epRate: Number(process.env.TAX_EP_RATE) || 0.05,
    vzRate: Number(process.env.TAX_VZ_RATE) || 0.01,
    esvQuarterly: Number(process.env.TAX_ESV_QUARTERLY) || 5280,
    fopLimit3Group: Number(process.env.TAX_FOP_LIMIT_3_GROUP) || 10091049,
};

export async function getTaxStats() {
    const user = await requireUser();
    const now = new Date();

    // 1. Отримуємо всі ФОП рахунки
    const fopAccounts = await prisma.financeAccount.findMany({
        where: {
            userId: user.id,
            OR: [
                { type: "fop" },
                { name: { contains: "ФОП", mode: "insensitive" } }
            ]
        },
        select: { id: true }
    });

    const fopAccountIds = fopAccounts.map((a: any) => a.id);

    // Поточний рік
    const yearStart = startOfYear(now);
    const yearEnd = endOfYear(now);

    // Поточний квартал
    const quarterStart = startOfQuarter(now);
    const quarterEnd = endOfQuarter(now);

    // Отримуємо всі доходи за рік з ФОП рахунків
    const incomeTransactions = fopAccountIds.length > 0
        ? await prisma.transaction.findMany({
            where: {
                userId: user.id,
                type: "income",
                accountId: { in: fopAccountIds },
                date: {
                    gte: yearStart,
                    lte: yearEnd
                }
            },
            include: {
                category: true
            }
        })
        : [];

    // Розраховуємо загальний дохід (для ліміту)
    const totalYearlyIncome = incomeTransactions.reduce((sum: number, tx: any) => sum + Number(tx.amount), 0);

    // Розраховуємо оподатковуваний дохід
    // Оскільки в БД у категорій за замовчуванням isTaxable = false, 
    // ми вважаємо всі надходження на ФОП доходом, крім внутрішніх переказів.
    const taxableIncomeTransactions = incomeTransactions.filter((tx: any) =>
        tx.category?.name !== "Внутрішній переказ"
    );

    const yearlyTaxableIncome = taxableIncomeTransactions.reduce((sum: number, tx: any) => sum + Number(tx.amount), 0);

    const quarterlyTaxableIncome = taxableIncomeTransactions
        .filter((tx: any) => tx.date >= quarterStart && tx.date <= quarterEnd)
        .reduce((sum: number, tx: any) => sum + Number(tx.amount), 0);

    // Розрахунок податків для 3-ї групи ФОП (5% ЄП + 1% ВЗ)
    const tax5Yearly = yearlyTaxableIncome * TAX_CONFIG.epRate;
    const tax1Yearly = yearlyTaxableIncome * TAX_CONFIG.vzRate;

    const tax5Quarterly = quarterlyTaxableIncome * TAX_CONFIG.epRate;
    const tax1Quarterly = quarterlyTaxableIncome * TAX_CONFIG.vzRate;

    const currentQuarter = Math.floor(now.getMonth() / 3) + 1;
    const esvYearly = TAX_CONFIG.esvQuarterly * currentQuarter;

    // Ліміт доходу для 3-ї групи
    const limitPercentage = (totalYearlyIncome / TAX_CONFIG.fopLimit3Group) * 100;

    // Отримуємо категорію "Податки" (без автостворення)
    const taxCategory = await prisma.category.findFirst({
        where: { userId: user.id, name: "Податки" }
    });

    const taxPayments = taxCategory
        ? await prisma.transaction.findMany({
            where: {
                userId: user.id,
                categoryId: taxCategory.id,
                date: {
                    gte: subQuarters(yearStart, 2),
                    lte: yearEnd
                }
            },
            orderBy: { date: "desc" }
        })
        : [];

    // Функція для визначення періоду (квартал та рік) з нотатки або дати
    const getTaxPeriod = (tx: any) => {
        const note = tx.note || tx.description || "";
        const qMatch = note.match(/([1-4])\s*кв/i);
        const yMatch = note.match(/(20\d{2})/);

        const quarter = qMatch ? parseInt(qMatch[1]) : (Math.floor(tx.date.getMonth() / 3) + 1);
        let year = yMatch ? parseInt(yMatch[1]) : tx.date.getFullYear();

        // Евристика: якщо ми в 1-му кварталі року і бачимо оплату за 4-й квартал без вказаного року,
        // то це на 99% оплата за минулий рік.
        const txQuarter = Math.floor(tx.date.getMonth() / 3) + 1;
        if (!yMatch && quarter > txQuarter && txQuarter === 1) {
            year -= 1;
        }

        return { quarter, year };
    };

    const paidByQuarter: Record<string, number> = {};
    taxPayments.forEach((tx: any) => {
        const { quarter, year } = getTaxPeriod(tx);
        const key = `${year}-${quarter}`;
        paidByQuarter[key] = (paidByQuarter[key] || 0) + Math.abs(Number(tx.amount));
    });

    // Поточний баланс податкового резерву
    const taxAccount = await prisma.financeAccount.findFirst({
        where: { userId: user.id, role: "tax" }
    });
    const reserveBalance = taxAccount ? Number(taxAccount.balance) : 0;

    // Розрахунок Tax Gap (скільки треба додати в резерв для покриття квартальних зобов'язань)
    const quarterlyObligations = tax5Quarterly + tax1Quarterly + TAX_CONFIG.esvQuarterly;
    const currentPaid = paidByQuarter[`${now.getFullYear()}-${currentQuarter}`] || 0;
    const taxGap = Math.max(0, quarterlyObligations - currentPaid - reserveBalance);

    // Групування по місяцях для графіка
    const monthlyIncome: Record<string, number> = {};
    for (let i = 0; i < 12; i++) {
        const monthName = format(new Date(now.getFullYear(), i, 1), "MMM");
        monthlyIncome[monthName] = 0;
    }

    incomeTransactions.forEach((tx: any) => {
        const monthName = format(tx.date, "MMM");
        if (monthlyIncome[monthName] !== undefined) {
            monthlyIncome[monthName] += Number(tx.amount);
        }
    });

    const chartData = Object.entries(monthlyIncome).map(([name, value]) => ({
        name,
        income: Math.round(value),
        tax: Math.round(        value * (TAX_CONFIG.epRate + TAX_CONFIG.vzRate))
    }));

    return {
        yearly: {
            income: totalYearlyIncome,
            taxableIncome: yearlyTaxableIncome,
            tax5: tax5Yearly,
            tax1: tax1Yearly,
            esv: esvYearly,
            totalTax: tax5Yearly + tax1Yearly + esvYearly,
            paid: Object.entries(paidByQuarter)
                .filter(([key]) => key.startsWith(`${now.getFullYear()}-`))
                .reduce((sum: number, [_key, val]: [string, any]) => sum + val, 0)
        },
        quarterly: {
            income: incomeTransactions.filter((tx: any) => tx.date >= quarterStart && tx.date <= quarterEnd).reduce((sum: number, tx: any) => sum + Number(tx.amount), 0),
            taxableIncome: quarterlyTaxableIncome,
            tax5: tax5Quarterly,
            tax1: tax1Quarterly,
            esv: TAX_CONFIG.esvQuarterly,
            totalTax: quarterlyObligations,
            paid: currentPaid
        },
        previousQuarter: await (async () => {
            const prevQDate = subQuarters(now, 1);
            const ps = startOfQuarter(prevQDate);
            const pe = endOfQuarter(prevQDate);

            const prevIncomeTxs = fopAccountIds.length > 0
                ? await prisma.transaction.findMany({
                    where: {
                        userId: user.id,
                        type: "income",
                        accountId: { in: fopAccountIds },
                        date: { gte: ps, lte: pe }
                    },
                    include: { category: true }
                })
                : [];

            const prevTaxable = prevIncomeTxs
                .filter((tx: any) => tx.category?.name !== "Внутрішній переказ")
                .reduce((sum: number, tx: any) => sum + Number(tx.amount), 0);

            const qNum = Math.floor(prevQDate.getMonth() / 3) + 1;
            const yNum = prevQDate.getFullYear();

            const prevPaid = paidByQuarter[`${yNum}-${qNum}`] || 0;
            const prevObligations = (prevTaxable * (TAX_CONFIG.epRate + TAX_CONFIG.vzRate)) + TAX_CONFIG.esvQuarterly;

            return {
                quarter: qNum,
                year: yNum,
                taxableIncome: prevTaxable,
                totalTax: prevObligations,
                paid: prevPaid,
                debt: Math.max(0, prevObligations - prevPaid)
            };
        })(),
        limit: {
            total: TAX_CONFIG.fopLimit3Group,
            current: totalYearlyIncome,
            percentage: limitPercentage
        },
        reserve: {
            balance: reserveBalance,
            gap: taxGap,
            accountId: taxAccount?.id || null
        },
        paidByQuarter: [1, 2, 3, 4].map((q: number) => paidByQuarter[`${now.getFullYear()}-${q}`] || 0),
        payments: taxPayments.map((p: any) => {
            const { quarter, year } = getTaxPeriod(p);
            return {
                id: p.id,
                amount: Math.abs(Number(p.amount)),
                date: p.date,
                description: p.description,
                note: p.note,
                quarter: quarter,
                year: year
            };
        }),
        chartData
    };
}

/**
 * Переказ коштів у податковий резерв
 */
export async function moveToTaxReserve(amount: number, fromAccountId: string) {
    const user = await requireUser();

    // Знаходимо податковий рахунок
    const taxAccount = await prisma.financeAccount.findFirst({
        where: { userId: user.id, role: "tax" }
    });

    if (!taxAccount) {
        throw new Error("Податковий рахунок не знайдено. Створіть рахунок з роллю 'Tax Reserve'.");
    }

    if (fromAccountId === taxAccount.id) {
        throw new Error("Джерело та ціль однакові.");
    }

    const sourceAccount = await prisma.financeAccount.findFirst({
        where: { id: fromAccountId, userId: user.id },
    });
    if (!sourceAccount) throw new Error("Рахунок-джерело не знайдено");
    if (Number(sourceAccount.balance) < amount) throw new Error("Недостатньо коштів на рахунку");

    await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
        // 1. Списуємо з основного
        await tx.financeAccount.update({
            where: { id: fromAccountId },
            data: { balance: { decrement: amount } }
        });

        // 2. Додаємо на податковий
        await tx.financeAccount.update({
            where: { id: taxAccount.id },
            data: { balance: { increment: amount } }
        });

        // 3. Find or create "Податки" category for audit trail
        const taxCat = await tx.category.upsert({
            where: { userId_type_name: { userId: user.id, type: "expense", name: "Податки" } },
            create: { userId: user.id, type: "expense", name: "Податки" },
            update: {},
        });

        await tx.transaction.create({
            data: {
                userId: user.id,
                accountId: fromAccountId,
                categoryId: taxCat.id,
                type: "expense",
                amount: amount,
                description: "Резервування на податки",
                date: new Date(),
            }
        });

        // 4. Створюємо income-запис на податковому рахунку
        const taxIncomeCat = await tx.category.upsert({
            where: { userId_type_name: { userId: user.id, type: "income", name: "Податки" } },
            create: { userId: user.id, type: "income", name: "Податки" },
            update: {},
        });

        await tx.transaction.create({
            data: {
                userId: user.id,
                accountId: taxAccount.id,
                categoryId: taxIncomeCat.id,
                type: "expense",
                amount: amount,
                description: "Резервування на податки",
                date: new Date(),
            }
        });

        // 4. Створюємо income-запис на податковому рахунку
        await tx.transaction.create({
            data: {
                userId: user.id,
                accountId: taxAccount.id,
                categoryId: taxCat?.id ?? undefined,
                type: "income",
                amount: amount,
                description: "Надходження до податкового резерву",
                date: new Date(),
            }
        });
    });

    revalidatePath("/dashboard/finance");
    return { success: true };
}
