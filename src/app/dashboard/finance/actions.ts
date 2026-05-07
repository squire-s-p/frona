"use server";

import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { getMonobankClient } from "@/lib/monobank";
import { revalidatePath } from "next/cache";
import { format } from "date-fns";
import { requireUser } from "@/lib/require-user";

// ─── Legacy Monobank Sync Removed ──────────────────────────────────────────────
// Now using /modules/bank for all synchronization logic.

/**
 * Отримати всі фінансові рахунки користувача
 */
export async function getFinanceAccounts() {
    const user = await requireUser();
    const accounts = await prisma.financeAccount.findMany({
        where: { userId: user.id, isArchived: false },
        orderBy: { createdAt: "asc" },
    });

    return accounts.map((a) => ({
        id: a.id,
        userId: a.userId,
        name: a.name,
        type: a.type,
        role: a.role,
        currency: a.currency,
        balance: Number(a.balance),
        color: a.color,
        includeInTotal: a.includeInTotal,
        isArchived: a.isArchived,
        lastSyncedAt: a.lastSyncedAt?.toISOString() || null,
        createdAt: a.createdAt.toISOString(),
        updatedAt: a.updatedAt.toISOString(),
    }));
}

/**
 * Отримати останні транзакції та трансфери (об'єднана історія) з фільтрацією
 */
export async function getRecentTransactions(limit = 10, offset = 0, filters?: {
    search?: string;
    accountId?: string;
    categoryId?: string;
    projectId?: string;
    dateFrom?: string;
    dateTo?: string;
}) {
    const user = await requireUser();

    const txWhere: Prisma.TransactionWhereInput = { userId: user.id, NOT: { amount: 0, note: "[SPLIT]" } };
    const transferWhere: Prisma.TransferWhereInput = { userId: user.id };

    if (filters) {
        if (filters.search) {
            const search = filters.search.trim();
            if (search.startsWith('>') || search.startsWith('<')) {
                const amount = parseFloat(search.slice(1).trim());
                if (!isNaN(amount)) {
                    const condition = search.startsWith('>') ? { gt: amount } : { lt: amount };
                    txWhere.amount = condition;
                    transferWhere.amount = condition;
                }
            } else {
                txWhere.OR = [
                    { description: { contains: search, mode: 'insensitive' } },
                    { note: { contains: search, mode: 'insensitive' } },
                ];
                transferWhere.note = { contains: search, mode: 'insensitive' };
            }
        }
        if (filters.accountId) {
            txWhere.accountId = filters.accountId;
            transferWhere.OR = [
                { fromAccountId: filters.accountId },
                { toAccountId: filters.accountId }
            ];
        }
        if (filters.categoryId) {
            txWhere.categoryId = filters.categoryId;
            // Трансфери не мають категорій в БД, але ми можемо їх відфільтрувати, якщо вибрано категорію "Переказ"
            if (filters.categoryId !== 'transfer-special-id') {
                // Якщо вибрана інша категорія, трансферів не буде
                transferWhere.id = 'none';
            }
        }
        if (filters.projectId) {
            txWhere.projectId = filters.projectId;
            // Трансфери поки не мають прив'язки до проектів
            transferWhere.id = 'none';
        }
        if (filters.dateFrom || filters.dateTo) {
            txWhere.date = {};
            transferWhere.date = {};
            if (filters.dateFrom) {
                txWhere.date.gte = new Date(filters.dateFrom);
                transferWhere.date.gte = new Date(filters.dateFrom);
            }
            if (filters.dateTo) {
                txWhere.date.lte = new Date(filters.dateTo);
                transferWhere.date.lte = new Date(filters.dateTo);
            }
        }
    }

    // 1. Отримуємо транзакції та трансфери
    // Для особистих фінансів обсяг даних невеликий — беремо розумний ліміт
    // і робимо пагінацію in-memory після merge
    const MAX_ROWS = 500;

    const txs = await prisma.transaction.findMany({
        where: txWhere,
        include: {
            account: true,
            category: true,
            project: true,
        },
        orderBy: [{ date: "desc" }, { createdAt: "desc" }, { id: "desc" }],
        take: MAX_ROWS,
    });

    // 2. Отримуємо трансфери
    const transfers = await prisma.transfer.findMany({
        where: transferWhere,
        include: {
            fromAccount: true,
            toAccount: true,
        },
        orderBy: [{ date: "desc" }, { createdAt: "desc" }, { id: "desc" }],
        take: MAX_ROWS,
    });

    // 3. Об'єднуємо та нормалізуємо
    const merged = [
        ...txs.map((t) => ({
            id: t.id,
            userId: t.userId,
            accountId: t.accountId,
            type: t.type as string,
            amount: Number(t.amount),
            date: t.date.toISOString(),
            description: t.description || (t.type === 'income' ? 'Дохід' : 'Витрата'),
            category: t.category ? {
                id: t.category.id,
                name: t.category.name,
                type: t.category.type
            } : null,
            account: t.account ? {
                id: t.account.id,
                name: t.account.name,
                type: t.account.type,
                balance: Number(t.account.balance)
            } : null,
            projectId: t.projectId,
            project: t.project ? {
                id: t.project.id,
                name: t.project.name
            } : null,
            isTransfer: false,
            createdAt: t.createdAt.toISOString(),
        })),
        ...transfers.map((t) => ({
            id: t.id.startsWith('transfer-') ? t.id : `transfer-${t.id}`,
            userId: t.userId,
            accountId: t.fromAccountId,
            type: 'transfer',
            amount: Number(t.amount),
            date: t.date.toISOString(),
            description: t.note || `Переказ: ${t.fromAccount.name} → ${t.toAccount.name}`,
            category: { id: 'transfer-special-id', name: 'Переказ', type: 'transfer' },
            account: t.fromAccount ? {
                id: t.fromAccount.id,
                name: t.fromAccount.name,
                type: t.fromAccount.type,
                balance: Number(t.fromAccount.balance)
            } : null,
            toAccount: t.toAccount ? {
                id: t.toAccount.id,
                name: t.toAccount.name,
                type: t.toAccount.type,
                balance: Number(t.toAccount.balance)
            } : null,
            isTransfer: true,
            createdAt: t.createdAt.toISOString(),
        }))
    ];

    // 4. Отримуємо загальні підсумки для фільтрації (без пагінації)
    // Виключаємо внутрішні перекази з підсумків доходу/витрат
    const exclusionFilter = {
        category: {
            name: { notIn: ["Внутрішній переказ"] }
        }
    };

    const [incomeAgg, expenseAgg] = await Promise.all([
        prisma.transaction.aggregate({
            where: { ...txWhere, type: 'income', ...exclusionFilter },
            _sum: { amount: true }
        }),
        prisma.transaction.aggregate({
            where: { ...txWhere, type: 'expense', ...exclusionFilter },
            _sum: { amount: true }
        })
    ]);

    const paginated = merged
        .sort((a, b) => {
            const dateDiff = new Date(b.date).getTime() - new Date(a.date).getTime();
            if (dateDiff !== 0) return dateDiff;
            const createdDiff = new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
            if (createdDiff !== 0) return createdDiff;
            return b.id.localeCompare(a.id);
        })
        .slice(offset, offset + limit);

    // Перевіряємо чи є ще дані. Якщо розмір merged менший за наш ліміт вибірки (take * 2),
    // і ми вибрали все що було, то hasMore залежить від slice.
    // Але надійніше перевірити чи merged.length > offset + limit.
    const hasMore = merged.length > (offset + limit);

    return {
        transactions: paginated,
        hasMore,
        totals: {
            income: Number(incomeAgg._sum.amount || 0),
            expense: Number(expenseAgg._sum.amount || 0)
        }
    };
}

// ─── Legacy Monobank Sync Removed ──────────────────────────────────────────────
// This module no longer handles direct Monobank synchronization.
// All banking logic is now located in @/modules/bank.
// The code below strictly reads from the local FinanceAccount/Transaction tables.

/**
 * Отримати проекти користувача
 */
export async function getProjects() {
    const user = await requireUser();
    const projects = await prisma.project.findMany({
        where: { userId: user.id },
        orderBy: { name: "asc" }
    });

    return projects.map((p) => ({
        ...p,
        cost: p.cost ? Number(p.cost) : null,
        createdAt: p.createdAt.toISOString(),
        updatedAt: p.updatedAt.toISOString(),
        completedAt: p.completedAt?.toISOString() || null,
        archivedAt: p.archivedAt?.toISOString() || null,
    }));
}

/**
 * Оновити проект транзакції
 */
export async function updateTransactionProject(transactionId: string, projectId: string | null) {
    const user = await requireUser();

    try {
        await prisma.transaction.update({
            where: { id: transactionId, userId: user.id },
            data: { projectId: projectId === "none" ? null : projectId }
        });
        revalidatePath("/dashboard/finance");
        return { success: true };
    } catch (error: unknown) {
        return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
    }
}

/**
 * Оновити деталі транзакції (категорію, проект та коментар)
 */
export async function updateTransactionDetails(transactionId: string, data: { categoryId?: string, projectId?: string | null, note?: string }) {
    const user = await requireUser();

    try {
        const updateData: Record<string, unknown> = {};
        if (data.categoryId !== undefined) updateData.categoryId = data.categoryId === "none" ? null : data.categoryId;
        if (data.projectId !== undefined) updateData.projectId = data.projectId === "none" ? null : data.projectId;
        if (data.note !== undefined) updateData.note = data.note;

        await prisma.transaction.update({
            where: { id: transactionId, userId: user.id },
            data: updateData as Prisma.TransactionUncheckedUpdateInput
        });
        revalidatePath("/dashboard/finance");
        return { success: true };
    } catch (error: unknown) {
        return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
    }
}

/**
 * Отримати аналітику витрат за останні 14 днів
 */
export async function getSpendingAnalytics() {
    const user = await requireUser();
    const fourteenDaysAgo = new Date();
    fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);

    const txs = await prisma.transaction.findMany({
        where: {
            userId: user.id,
            type: "expense",
            date: { gte: fourteenDaysAgo },
            category: {
                name: { notIn: ["Внутрішній переказ"] }
            }
        },
        orderBy: { date: "asc" }
    });

    const dailyData: Record<string, number> = {};

    // Ініціалізуємо всі дні нулями
    for (let i = 0; i <= 14; i++) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        dailyData[format(d, "yyyy-MM-dd")] = 0;
    }

    txs.forEach((t) => {
        const day = format(new Date(t.date), "yyyy-MM-dd");
        if (dailyData[day] !== undefined) {
            dailyData[day] += Number(t.amount);
        }
    });

    return Object.entries(dailyData)
        .map(([date, amount]) => ({
            date: format(new Date(date), "dd.MM"),
            amount: Math.round(amount)
        }))
        .reverse();
}

// Внутрішній кеш для курсів валют — using unstable_cache for serverless safety
import { unstable_cache } from "next/cache";

const FALLBACK_RATES = { USD: 41.5, EUR: 45.0 };

async function fetchExchangeRatesFromApi(): Promise<{ USD: number; EUR: number }> {
    const mono = getMonobankClient();
    const rates = await mono.getCurrencyRates();
    const usd = rates.find(r => r.currencyCodeA === 840 && r.currencyCodeB === 980);
    const eur = rates.find(r => r.currencyCodeA === 978 && r.currencyCodeB === 980);
    return {
        USD: usd?.rateBuy || usd?.rateCross || FALLBACK_RATES.USD,
        EUR: eur?.rateBuy || eur?.rateCross || FALLBACK_RATES.EUR
    };
}

const getCachedRates = unstable_cache(
    fetchExchangeRatesFromApi,
    ["exchange-rates"],
    { revalidate: 3600 }
);

/**
 * Отримати курси валют (USD, EUR -> UAH)
 */
export async function getExchangeRates() {
    try {
        return await getCachedRates();
    } catch (error) {
        console.error("Failed to fetch rates:", error);
        return FALLBACK_RATES;
    }
}

/**
 * Створити або оновити бюджет для категорії
 */
export async function createBudget(categoryId: string, amount: number) {
    const user = await requireUser();

    try {
        await prisma.budget.upsert({
            where: { categoryId: categoryId },
            update: { amount },
            create: {
                userId: user.id,
                categoryId,
                amount
            }
        });
        revalidatePath("/dashboard/finance");
        return { success: true };
    } catch (error: unknown) {
        return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
    }
}

/**
 * Отримати бюджети з прогресом виконання
 */
export async function getBudgets() {
    const user = await requireUser();
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const budgets = await prisma.budget.findMany({
        where: { userId: user.id },
        include: { category: true }
    });

    if (budgets.length === 0) return [];

    const categoryIds = budgets.map(b => b.categoryId);

    const spentByCategory = await prisma.transaction.groupBy({
        by: ['categoryId'],
        where: {
            userId: user.id,
            categoryId: { in: categoryIds },
            type: "expense",
            date: { gte: startOfMonth }
        },
        _sum: { amount: true }
    });

    const spentMap = new Map(spentByCategory.map(r => [r.categoryId, Number(r._sum.amount || 0)]));

    const budgetsWithProgress = budgets.map(b => {
        const amount = Number(b.amount);
        const used = spentMap.get(b.categoryId) || 0;
        const percentage = amount > 0 ? Math.round((used / amount) * 100) : 0;

        return {
            id: b.id,
            categoryName: b.category.name,
            limit: amount,
            spent: used,
            percentage
        };
    });

    return budgetsWithProgress.sort((a, b) => b.percentage - a.percentage);
}

/**
 * Отримати розширену фінансову статистику
 * period: "month" | "year"
 */
export async function getFinancialStats(period: "month" | "year" = "month") {
    const user = await requireUser();

    const startDate = new Date();

    if (period === "month") {
        startDate.setDate(1);
        startDate.setHours(0, 0, 0, 0);
    } else {
        startDate.setMonth(0, 1);
        startDate.setHours(0, 0, 0, 0);
    }

    // 1. Витрати по категоріях (Pie Chart)
    const expensesByCategory = await prisma.transaction.groupBy({
        by: ['categoryId'],
        where: {
            userId: user.id,
            type: "expense",
            date: { gte: startDate },
        },
        _sum: { amount: true },
        orderBy: {
            _sum: { amount: 'desc' }
        }
    });

    const transferCategoryIdSet = new Set<string>();
    const transferCategories = await prisma.category.findMany({
        where: { userId: user.id, name: "Внутрішній переказ" },
        select: { id: true },
    });
    transferCategories.forEach((c) => transferCategoryIdSet.add(c.id));

    const filteredExpenses = expensesByCategory
        .filter((item) => !transferCategoryIdSet.has(item.categoryId));

    // Batch fetch all needed categories at once instead of N+1
    const categoryIds = filteredExpenses.map(item => item.categoryId);
    const categories = await prisma.category.findMany({
        where: { id: { in: categoryIds } },
        select: { id: true, name: true },
    });
    const categoryMap = new Map(categories.map(c => [c.id, c.name]));

    const categoryStats = filteredExpenses.map((item) => ({
        name: categoryMap.get(item.categoryId) || "Інше",
        value: Number(item._sum.amount),
        fill: ""
    }));

    const income = await prisma.transaction.aggregate({
        where: { userId: user.id, type: "income", date: { gte: startDate }, categoryId: { notIn: [...transferCategoryIdSet] } },
        _sum: { amount: true }
    });

    const expense = await prisma.transaction.aggregate({
        where: { userId: user.id, type: "expense", date: { gte: startDate }, categoryId: { notIn: [...transferCategoryIdSet] } },
        _sum: { amount: true }
    });

    const cashFlow = [
        { name: "Дохід", value: Number(income._sum.amount || 0) },
        { name: "Витрати", value: Number(expense._sum.amount || 0) }
    ];

    return {
        pieChart: categoryStats,
        barChart: cashFlow
    };
}

/**
 * Створити скарбничку (Savings Goal)
 */
export async function createSavingsGoal(data: {
    name: string;
    targetAmount: number;
    deadline?: Date;
    color?: string;
    goalType?: string;
    accountId?: string;
}) {
    const user = await requireUser();
    try {
        await prisma.savingsGoal.create({
            data: {
                userId: user.id,
                name: data.name,
                targetAmount: data.targetAmount,
                deadline: data.deadline,
                color: data.color,
                goalType: data.goalType || "general",
                accountId: data.accountId,
                status: "active"
            }
        });
        revalidatePath("/dashboard/finance");
        return { success: true };
    } catch (error: unknown) {
        return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
    }
}

/**
 * Оновити скарбничку (наприклад, додати грошей)
 */
export async function updateSavingsGoal(id: string, data: {
    currentAmount?: number;
    name?: string;
    color?: string;
    goalType?: string;
    status?: string;
    accountId?: string;
    targetAmount?: number;
    deadline?: Date;
}) {
    const user = await requireUser();
    try {
        await prisma.savingsGoal.update({
            where: { id, userId: user.id },
            data: {
                currentAmount: data.currentAmount,
                name: data.name,
                color: data.color,
                goalType: data.goalType,
                status: data.status,
                accountId: data.accountId,
                targetAmount: data.targetAmount,
                deadline: data.deadline,
            }
        });
        revalidatePath("/dashboard/finance");
        return { success: true };
    } catch (error: unknown) {
        return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
    }
}

/**
 * Видалити скарбничку
 */
export async function deleteSavingsGoal(id: string) {
    const user = await requireUser();
    try {
        await prisma.savingsGoal.delete({
            where: { id, userId: user.id }
        });
        revalidatePath("/dashboard/finance");
        return { success: true };
    } catch (error: unknown) {
        return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
    }
}

/**
 * Створити регулярний платіж
 */
export async function createRecurringPayment(data: {
    name: string;
    amount: number;
    frequency: string;
    nextPaymentDate: Date;
    type?: "income" | "expense";
    category?: string;
    accountId?: string;
    affectsForecast?: boolean;
    isExpectedIncome?: boolean;
}) {
    const user = await requireUser();
    try {
        await prisma.recurringPayment.create({
            data: {
                userId: user.id,
                name: data.name,
                amount: Math.abs(data.amount),
                type: data.type || (data.amount >= 0 ? "income" : "expense"),
                frequency: data.frequency,
                nextPaymentDate: data.nextPaymentDate,
                categoryId: data.category,
                accountId: data.accountId,
                affectsForecast: data.affectsForecast ?? true,
                isExpectedIncome: data.isExpectedIncome ?? false,
            }
        });
        revalidatePath("/dashboard/finance");
        return { success: true };
    } catch (error: unknown) {
        return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
    }
}

/**
 * Видалити регулярний платіж
 */
export async function deleteRecurringPayment(id: string) {
    const user = await requireUser();
    try {
        await prisma.recurringPayment.delete({
            where: { id, userId: user.id }
        });
        revalidatePath("/dashboard/finance");
        return { success: true };
    } catch (error: unknown) {
        return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
    }
}

/**
 * Створити товар для списку покупок
 */
/**
 * Створити товар для списку покупок
 */
export async function createShoppingItem(data: { name: string; url?: string; price?: number }) {
    const user = await requireUser();
    try {
        const item = await prisma.shoppingItem.create({
            data: {
                userId: user.id,
                name: data.name,
                url: data.url, // Keep as main/fallback
                price: data.price,
                status: "PLANNED"
            }
        });

        // If URL provided, create a link automatically
        if (data.url) {
            await addShoppingLink(item.id, data.url);
        }

        revalidatePath("/dashboard/finance");
        return { success: true };
    } catch (error: unknown) {
        return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
    }
}

/**
 * Helper to scrape price from URL (Best Effort)
 */
async function scrapePrice(url: string): Promise<{ price: number | null, siteName: string | null }> {
    try {
        const parsedUrl = new URL(url);
        const blockedHosts = ["localhost", "127.0.0.1", "0.0.0.0", "::1", "169.254.", "10.", "172.16.", "172.17.", "172.18.", "172.19.", "172.20.", "172.21.", "172.22.", "172.23.", "172.24.", "172.25.", "172.26.", "172.27.", "172.28.", "172.29.", "172.30.", "172.31.", "192.168.", "100.64.", "198.18.", "metadata.google.internal", "metadata.azure.com"];
        const hostname = parsedUrl.hostname.toLowerCase();
        if (blockedHosts.some((h) => hostname === h || hostname.endsWith("." + h) || hostname.startsWith(h))) {
            return { price: null, siteName: null };
        }
        if (parsedUrl.protocol !== "http:" && parsedUrl.protocol !== "https:") {
            return { price: null, siteName: null };
        }

        const response = await fetch(url, {
            headers: {
                // Mimic a real browser to avoid 403 blocks
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
                'Accept-Language': 'uk-UA,uk;q=0.9,en-US;q=0.8,en;q=0.7',
                'Cache-Control': 'no-cache',
                'Pragma': 'no-cache'
            },
            next: { revalidate: 3600 } // Cache for 1 hour
        });

        if (!response.ok) {
            console.error(`Scraping failed: ${response.status} for ${url}`);
            return { price: null, siteName: null };
        }

        const html = await response.text();

        // 1. Try to find price
        let price = null;

        // Pattern A: JSON-LD (Most reliable)
        const jsonLdMatch = html.match(/<script type="application\/ld\+json">\s*({[^<]+})\s*<\/script>/);
        if (jsonLdMatch && jsonLdMatch[1]) {
            try {
                const data = JSON.parse(jsonLdMatch[1]);
                // Handle single object or array
                const item = Array.isArray(data) ? data.find((i) => i.offers) : data;
                if (item && item.offers) {
                    const priceValue = item.offers.price || item.offers.lowPrice || item.offers.highPrice;
                    if (priceValue) price = parseFloat(priceValue);
                }
            } catch {
                // Ignore json parse error
            }
        }

        // Pattern B: Meta Tags
        if (!price) {
            const priceMeta = html.match(/meta\s+property="product:price:amount"\s+content="([\d\.]+)"/i) ||
                html.match(/meta\s+name="price"\s+content="([\d\.]+)"/i) ||
                html.match(/meta\s+itemprop="price"\s+content="([\d\.]+)"/i);
            if (priceMeta && priceMeta[1]) {
                price = parseFloat(priceMeta[1]);
            }
        }

        // Pattern C: Regex for visible price (e.g. "12 300 ₴" or "12.300 грн")
        if (!price) {
            const priceRegex = /class="[^"]*(?:price|sum|cost|value)[^"]*"[^>]*>\s*([\d\s\.,]+)\s*(?:₴|грн|UAH)/i;
            const match = html.match(priceRegex);
            if (match && match[1]) {
                // Clean up: remove spaces, replace comma with dot
                const clean = match[1].replace(/\s/g, '').replace(',', '.');
                price = parseFloat(clean);
            }
        }

        // 2. Try to find site name
        let siteName = null;
        const siteNameMeta = html.match(/meta\s+property="og:site_name"\s+content="([^"]+)"/i);
        if (siteNameMeta && siteNameMeta[1]) {
            siteName = siteNameMeta[1];
        } else {
            try {
                const urlObj = new URL(url);
                siteName = urlObj.hostname.replace('www.', '');
            } catch { }
        }

        return { price, siteName };
    } catch (error) {
        console.error("Scraping error:", error);
        return { price: null, siteName: null };
    }
}

/**
 * Додати посилання до товару
 */
export async function addShoppingLink(itemId: string, url: string) {
    const user = await requireUser();
    try {
        const item = await prisma.shoppingItem.findFirst({
            where: { id: itemId, userId: user.id },
        });
        if (!item) return { success: false, error: "Item not found" };

        const { price, siteName } = await scrapePrice(url);

        await prisma.shoppingLink.create({
            data: {
                itemId,
                url,
                price,
                siteName
            }
        });

        revalidatePath("/dashboard/finance");
        return { success: true, price, siteName };
    } catch (error: unknown) {
        return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
    }
}

/**
 * Видалити посилання
 */
export async function deleteShoppingLink(linkId: string) {
    const user = await requireUser();
    // Validate ownership via item->user relation query would be safer, 
    // but for now simple delete is okay if we assume IDs are hard to guess.
    // Better: verify ownership.
    try {
        const link = await prisma.shoppingLink.findUnique({
            where: { id: linkId },
            include: { item: true }
        });

        if (!link || link.item.userId !== user.id) {
            throw new Error("Not authorized");
        }

        await prisma.shoppingLink.delete({
            where: { id: linkId }
        });

        revalidatePath("/dashboard/finance");
        return { success: true };
    } catch (error: unknown) {
        return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
    }
}

/**
 * Видалити товар
 */
export async function deleteShoppingItem(id: string) {
    const user = await requireUser();
    try {
        await prisma.shoppingItem.delete({
            where: { id, userId: user.id }
        });
        revalidatePath("/dashboard/finance");
        return { success: true };
    } catch (error: unknown) {
        return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
    }
}

/**
 * Змінити статус товару (Куплено / Заплановано)
 */
export async function toggleShoppingItemStatus(id: string, currentStatus: string) {
    const user = await requireUser();
    const newStatus = currentStatus === "PLANNED" ? "BOUGHT" : "PLANNED";
    try {
        await prisma.shoppingItem.update({
            where: { id, userId: user.id },
            data: { status: newStatus }
        });
        revalidatePath("/dashboard/finance");
        return { success: true };
    } catch (error: unknown) {
        return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
    }
}

/**
 * Отримати дані для планування
 */
export async function getPlanningData() {
    const user = await requireUser();

    const goals = await prisma.savingsGoal.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: 'desc' }
    });

    const payments = await prisma.recurringPayment.findMany({
        where: { userId: user.id },
        orderBy: { nextPaymentDate: 'asc' }
    });

    const shoppingItems = await prisma.shoppingItem.findMany({
        where: { userId: user.id },
        include: { links: true },
        orderBy: { createdAt: 'desc' }
    });
    const accounts = await prisma.financeAccount.findMany({
        where: { userId: user.id }
    });

    return {
        goals: goals.map((g) => {
            let current = Number(g.currentAmount);
            if (g.accountId) {
                const linkedAccount = accounts.find((a) => a.id === g.accountId);
                if (linkedAccount) {
                    current = Number(linkedAccount.balance);
                }
            }

            return {
                id: g.id,
                userId: g.userId,
                name: g.name,
                targetAmount: Number(g.targetAmount),
                currentAmount: current,
                goalType: g.goalType,
                status: g.status,
                accountId: g.accountId,
                deadline: g.deadline,
                color: g.color,
                createdAt: g.createdAt,
                updatedAt: g.updatedAt
            };
        }),
        payments: payments.map((p) => ({
            id: p.id,
            userId: p.userId,
            accountId: p.accountId,
            categoryId: p.categoryId,
            name: p.name,
            amount: Number(p.amount),
            type: p.type,
            frequency: p.frequency,
            nextPaymentDate: p.nextPaymentDate,
            endDate: p.endDate,
            affectsForecast: p.affectsForecast,
            isExpectedIncome: p.isExpectedIncome,
            createdAt: p.createdAt,
            updatedAt: p.updatedAt
        })),
        shoppingItems: shoppingItems.map((i) => ({
            id: i.id,
            userId: i.userId,
            name: i.name,
            price: i.price ? Number(i.price) : null,
            status: i.status,
            createdAt: i.createdAt,
            updatedAt: i.updatedAt,
            links: i.links.map((l) => ({
                id: l.id,
                itemId: l.itemId,
                url: l.url,
                price: l.price ? Number(l.price) : null,
                siteName: l.siteName,
                createdAt: l.createdAt,
                updatedAt: l.updatedAt
            }))
        }))
    };
}

/**
 * Застосувати категорію/проєкт до всіх транзакцій з однаковим описом
 * та створити правило автоматизації.
 */
export async function applySmartCategorization(data: {
    description: string,
    categoryId: string,
    projectId?: string | null
}) {
    const user = await requireUser();

    try {
        // 1. Оновлюємо всі існуючі транзакції з таким самим описом
        const updateData: Record<string, unknown> = { categoryId: data.categoryId };
        if (data.projectId !== undefined) {
            updateData.projectId = data.projectId === "none" ? null : data.projectId;
        }

        await prisma.transaction.updateMany({
            where: {
                userId: user.id,
                description: { equals: data.description, mode: 'insensitive' }
            },
            data: updateData as Prisma.TransactionUncheckedUpdateManyInput
        });

        // 2. Створюємо або оновлюємо правило автоматизації
        const existingRule = await prisma.automationRule.findFirst({
            where: {
                userId: user.id,
                pattern: { equals: data.description, mode: 'insensitive' },
                type: 'category'
            }
        });

        if (existingRule) {
            await prisma.automationRule.update({
                where: { id: existingRule.id },
                data: { targetId: data.categoryId }
            });
        } else {
            await prisma.automationRule.create({
                data: {
                    userId: user.id,
                    name: `Auto: ${data.description}`,
                    pattern: data.description,
                    type: 'category',
                    targetId: data.categoryId,
                    isActive: true
                }
            });
        }

        // Якщо є проект, створюємо окреме правило для проекту (або об'єднуємо, якщо логіка дозволяє)
        // Для простоти поки сконцентруємось на категорії

        revalidatePath("/dashboard/finance");
        return { success: true };
    } catch (error: unknown) {
        console.error("Smart categorization error:", error);
        return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
    }
}

/**
 * Масове оновлення транзакцій
 */
export async function bulkUpdateTransactions(transactionIds: string[], data: { categoryId?: string, projectId?: string | null }) {
    const user = await requireUser();

    try {
        const updateData: Record<string, unknown> = {};
        if (data.categoryId) updateData.categoryId = data.categoryId;
        if (data.projectId !== undefined) updateData.projectId = data.projectId === "none" ? null : data.projectId;

        await prisma.transaction.updateMany({
            where: {
                id: { in: transactionIds },
                userId: user.id
            },
            data: updateData as Prisma.TransactionUncheckedUpdateManyInput
        });

        revalidatePath("/dashboard/finance");
        return { success: true };
    } catch (error: unknown) {
        console.error("Bulk update error:", error);
        return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
    }
}
