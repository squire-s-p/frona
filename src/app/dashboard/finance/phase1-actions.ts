"use server";

import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireUser } from "@/lib/require-user";

const createAccountSchema = z.object({
    name: z.string().min(1).max(100),
    type: z.enum(["checking", "savings", "cash", "credit", "investment", "tax_reserve"]),
    currency: z.enum(["UAH", "USD", "EUR"]),
    balance: z.number().finite(),
    color: z.string().optional(),
    includeInTotal: z.boolean().optional(),
    role: z.enum(["liquid", "savings", "tax_reserve", "investment"]).optional(),
});

const createTransferSchema = z.object({
    fromAccountId: z.string().cuid(),
    toAccountId: z.string().cuid(),
    amount: z.number().positive(),
    fee: z.number().min(0).optional(),
    exchangeRate: z.number().positive().optional(),
    note: z.string().max(500).optional(),
    date: z.date(),
});

// ========================
// ACCOUNT MANAGEMENT
// ========================

/**
 * Створити новий фінансовий рахунок
 */
export async function createAccount(data: z.infer<typeof createAccountSchema>) {
    const user = await requireUser();
    const validated = createAccountSchema.parse(data);

    const account = await prisma.financeAccount.create({
        data: {
            userId: user.id,
            name: validated.name,
            type: validated.type,
            currency: validated.currency,
            balance: validated.balance,
            color: validated.color,
            includeInTotal: validated.includeInTotal ?? true,
            role: validated.role || "liquid",
        }
    });

    revalidatePath("/dashboard/finance");
    return {
        ...account,
        balance: Number(account.balance),
    };
}

/**
 * Оновити рахунок
 */
export async function updateAccount(
    id: string,
    data: {
        name?: string;
        type?: string;
        color?: string;
        includeInTotal?: boolean;
        isArchived?: boolean;
        role?: string;
    }
) {
    const user = await requireUser();

    const account = await prisma.financeAccount.update({
        where: { id, userId: user.id },
        data,
    });

    revalidatePath("/dashboard/finance");
    return {
        ...account,
        balance: Number(account.balance),
    };
}

/**
 * Видалити рахунок (архівувати)
 */
export async function deleteAccount(id: string) {
    const user = await requireUser();

    await prisma.financeAccount.update({
        where: { id, userId: user.id },
        data: { isArchived: true },
    });

    revalidatePath("/dashboard/finance");
    return { success: true };
}

/**
 * Отримати історію балансу рахунку
 */
export async function getAccountHistory(
    accountId: string,
    from: Date,
    to: Date
) {
    const user = await requireUser();

    const transactions = await prisma.transaction.findMany({
        where: {
            userId: user.id,
            accountId,
            date: {
                gte: from,
                lte: to,
            },
        },
        orderBy: { date: "asc" },
        include: {
            category: true,
        },
    });

    return transactions.map((t) => ({
        ...t,
        amount: Number(t.amount),
    }));
}

// ========================
// TRANSFER MANAGEMENT
// ========================

/**
 * Створити трансфер між рахунками
 */
export async function createTransfer(data: z.infer<typeof createTransferSchema>) {
    const user = await requireUser();
    const validated = createTransferSchema.parse(data);

    // Перевіряємо рахунки
    const [fromAccount, toAccount] = await Promise.all([
        prisma.financeAccount.findFirst({
            where: { id: validated.fromAccountId, userId: user.id },
        }),
        prisma.financeAccount.findFirst({
            where: { id: validated.toAccountId, userId: user.id },
        }),
    ]);

    if (!fromAccount || !toAccount) {
        throw new Error("Account not found");
    }

    if (validated.fromAccountId === validated.toAccountId) {
        throw new Error("Рахунки джерела та призначення мають відрізнятися");
    }

    const totalDebit = new Prisma.Decimal(validated.amount).plus(new Prisma.Decimal(validated.fee || 0));
    if (new Prisma.Decimal(fromAccount.balance).lessThan(totalDebit)) {
        throw new Error("Недостатньо коштів на рахунку");
    }

    // Створюємо переказ
    const transfer = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
        // Створюємо запис трансферу
        const newTransfer = await tx.transfer.create({
            data: {
                userId: user.id,
                fromAccountId: validated.fromAccountId,
                toAccountId: validated.toAccountId,
                amount: validated.amount,
                fee: validated.fee || 0,
                exchangeRate: validated.exchangeRate,
                note: validated.note,
                date: validated.date || new Date(),
            },
        });

        // Оновлюємо баланси
        const creditAmount = validated.exchangeRate
            ? new Prisma.Decimal(validated.amount).times(new Prisma.Decimal(validated.exchangeRate)).toDecimalPlaces(2)
            : new Prisma.Decimal(validated.amount);

        await tx.financeAccount.update({
            where: { id: validated.fromAccountId },
            data: {
                balance: {
                    decrement: totalDebit,
                },
            },
        });

        await tx.financeAccount.update({
            where: { id: validated.toAccountId },
            data: {
                balance: {
                    increment: creditAmount,
                },
            },
        });

        return newTransfer;
    });

    revalidatePath("/dashboard/finance");
    return {
        ...transfer,
        amount: Number(transfer.amount),
        fee: Number(transfer.fee),
        exchangeRate: transfer.exchangeRate
            ? Number(transfer.exchangeRate)
            : null,
    };
}

/**
 * Отримати всі трансфери
 */
export async function getTransfers(filters?: {
    from?: Date;
    to?: Date;
}) {
    const user = await requireUser();

    const where: Prisma.TransferWhereInput = { userId: user.id };
    if (filters?.from || filters?.to) {
        where.date = {};
        if (filters.from) where.date.gte = filters.from;
        if (filters.to) where.date.lte = filters.to;
    }

    const transfers = await prisma.transfer.findMany({
        where,
        include: {
            fromAccount: true,
            toAccount: true,
        },
        orderBy: { date: "desc" },
    });

    return transfers.map((t) => ({
        ...t,
        amount: Number(t.amount),
        fee: Number(t.fee),
        exchangeRate: t.exchangeRate ? Number(t.exchangeRate) : null,
    }));
}

/**
 * Отримати всі категорії
 */
export async function getCategories() {
    const user = await requireUser();
    return prisma.category.findMany({
        where: { userId: user.id },
        orderBy: { name: "asc" },
    });
}

/**
 * Створити категорію
 */
export async function createCategory(data: {
    name: string;
    type: "income" | "expense";
    isTaxable?: boolean;
}) {
    const user = await requireUser();

    const existing = await prisma.category.findFirst({
        where: { userId: user.id, name: data.name, type: data.type },
    });
    if (existing) {
        return { ...existing, alreadyExists: true };
    }

    const category = await prisma.category.create({
        data: {
            userId: user.id,
            name: data.name,
            type: data.type,
            isTaxable: data.isTaxable ?? false,
        },
    });

    revalidatePath("/dashboard/finance");
    return category;
}

/**
 * Оновити категорію
 */
export async function updateCategory(
    id: string,
    data: {
        name?: string;
        isTaxable?: boolean;
    }
) {
    const user = await requireUser();

    const category = await prisma.category.update({
        where: { id, userId: user.id },
        data,
    });

    revalidatePath("/dashboard/finance");
    return category;
}

/**
 * Отримати всі клієнти
 */
export async function getClients() {
    const user = await requireUser();
    return prisma.client.findMany({
        where: { userId: user.id },
        orderBy: { name: "asc" },
    });
}

// ========================
// TAG MANAGEMENT
// ========================

/**
 * Отримати всі теги
 */
export async function getTags() {
    const user = await requireUser();

    const tags = await prisma.financeTag.findMany({
        where: { userId: user.id },
        orderBy: { name: "asc" },
    });

    return tags;
}

/**
 * Створити тег
 */
export async function createTag(name: string, color?: string) {
    const user = await requireUser();

    const tag = await prisma.financeTag.create({
        data: {
            userId: user.id,
            name,
            color,
        },
    });

    revalidatePath("/dashboard/finance");
    return tag;
}

/**
 * Видалити тег
 */
export async function deleteTag(id: string) {
    const user = await requireUser();

    await prisma.financeTag.delete({
        where: { id, userId: user.id },
    });

    revalidatePath("/dashboard/finance");
    return { success: true };
}

// ========================
// ENHANCED TRANSACTIONS
// ========================

/**
 * Створити транзакцію з тегами
 */
export async function createTransactionWithTags(data: {
    accountId: string;
    categoryId: string;
    type: "income" | "expense";
    amount: number;
    date: Date;
    description?: string;
    projectId?: string;
    clientId?: string;
    tagIds?: string[];
    note?: string;
    isRecurring?: boolean;
    recurringFrequency?: "weekly" | "monthly" | "yearly";
}) {
    const user = await requireUser();

    const account = await prisma.financeAccount.findFirst({
        where: { id: data.accountId, userId: user.id },
    });
    if (!account) throw new Error("Account not found or access denied");

    // Validate categoryId belongs to user
    const category = await prisma.category.findFirst({
        where: { id: data.categoryId, userId: user.id },
    });
    if (!category) throw new Error("Category not found or access denied");

    // Validate projectId belongs to user
    if (data.projectId && data.projectId !== "none") {
        const proj = await prisma.project.findFirst({
            where: { id: data.projectId, userId: user.id },
        });
        if (!proj) throw new Error("Project not found or access denied");
    }

    const transaction = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
        // Створюємо транзакцію
        const newTx = await tx.transaction.create({
            data: {
                userId: user.id,
                accountId: data.accountId,
                categoryId: data.categoryId,
                type: data.type,
                amount: data.amount,
                date: data.date,
                description: data.description,
                projectId: data.projectId !== "none" ? data.projectId : null,
                clientId: data.clientId !== "none" && data.clientId !== "" ? data.clientId : null,
                tagIds: data.tagIds || [],
                note: data.note,
                isRecurring: data.isRecurring || false,
            },
        });

        // Якщо це рекурентний платіж, створюємо і його
        if (data.isRecurring && data.recurringFrequency) {
            const nextDate = new Date(data.date);
            if (data.recurringFrequency === "weekly") nextDate.setDate(nextDate.getDate() + 7);
            else if (data.recurringFrequency === "monthly") nextDate.setMonth(nextDate.getMonth() + 1);
            else if (data.recurringFrequency === "yearly") nextDate.setFullYear(nextDate.getFullYear() + 1);

            await tx.recurringPayment.create({
                data: {
                    userId: user.id,
                    name: data.description || "Рекурентний платіж",
                    amount: data.amount,
                    type: data.type,
                    frequency: data.recurringFrequency,
                    nextPaymentDate: nextDate,
                    categoryId: data.categoryId,
                    accountId: data.accountId,
                    autoCreate: true,
                },
            });
        }

        // Оновлюємо баланс рахунку
        const balanceChange =
            data.type === "income" ? data.amount : -data.amount;

        await tx.financeAccount.update({
            where: { id: data.accountId },
            data: {
                balance: {
                    increment: balanceChange,
                },
            },
        });

        return newTx;
    });

    revalidatePath("/dashboard/finance");
    return {
        ...transaction,
        amount: Number(transaction.amount),
    };
}

/**
 * Створити розділену транзакцію (Split)
 */
export async function createFullSplitTransaction(data: {
    accountId: string;
    type: "income" | "expense";
    amount: number;
    date: Date;
    description: string;
    splits: Array<{ categoryId: string; amount: number; note?: string }>;
    tagIds?: string[];
    clientId?: string;
    projectId?: string;
}) {
    const user = await requireUser();

    const account = await prisma.financeAccount.findFirst({
        where: { id: data.accountId, userId: user.id },
    });
    if (!account) throw new Error("Account not found or access denied");

    // Validate all split categoryIds belong to user
    const splitCategoryIds = [...new Set(data.splits.map(s => s.categoryId))];
    const validCategories = await prisma.category.findMany({
        where: { id: { in: splitCategoryIds }, userId: user.id },
        select: { id: true },
    });
    const validCatIds = new Set(validCategories.map(c => c.id));
    for (const cid of splitCategoryIds) {
        if (!validCatIds.has(cid)) throw new Error("Category not found or access denied");
    }

    const splitsTotal = data.splits.reduce((sum, s) => sum + s.amount, 0);

    const transaction = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
        // 1. Створюємо головну транзакцію (батьківську) з сумою 0 — вона лише групує split
        const parentTx = await tx.transaction.create({
            data: {
                userId: user.id,
                accountId: data.accountId,
                categoryId: data.splits[0].categoryId,
                type: data.type,
                amount: 0,
                date: data.date,
                description: data.description,
                tagIds: data.tagIds || [],
                note: "[SPLIT]",
                clientId: data.clientId !== "none" && data.clientId !== "" ? data.clientId : null,
                projectId: data.projectId || null,
            },
        });

        // 2. Створюємо дочірні транзакції (кожна з реальною сумою)
        for (const split of data.splits) {
            await tx.transaction.create({
                data: {
                    userId: user.id,
                    accountId: data.accountId,
                    categoryId: split.categoryId,
                    type: data.type,
                    amount: split.amount,
                    date: data.date,
                    description: data.description,
                    note: split.note,
                    tagIds: data.tagIds || [],
                    splitParentId: parentTx.id,
                    clientId: data.clientId !== "none" && data.clientId !== "" ? data.clientId : null,
                    projectId: data.projectId || null,
                },
            });
        }

        // 3. Оновлюємо баланс на суму всіх split-ів
        const balanceChange = data.type === "income" ? splitsTotal : -splitsTotal;
        await tx.financeAccount.update({
            where: { id: data.accountId },
            data: {
                balance: {
                    increment: balanceChange,
                },
            },
        });

        return parentTx;
    });

    revalidatePath("/dashboard/finance");
    return {
        ...transaction,
        amount: Number(transaction.amount),
    };
}

/**
 * Оновити транзакцію
 */
export async function updateTransaction(data: {
    id: string;
    accountId: string;
    categoryId: string;
    type: "income" | "expense";
    amount: number;
    date: Date;
    description?: string;
    projectId?: string;
    clientId?: string;
    tagIds?: string[];
    note?: string;
}) {
    const user = await requireUser();

    const transaction = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
        const oldTx = await tx.transaction.findUnique({
            where: { id: data.id, userId: user.id },
        });
        if (!oldTx) throw new Error("Transaction not found");

        // Validate new accountId belongs to user
        if (data.accountId !== oldTx.accountId) {
            const newAcc = await tx.financeAccount.findFirst({
                where: { id: data.accountId, userId: user.id },
            });
            if (!newAcc) throw new Error("Target account not found or access denied");
        }

        // Validate categoryId belongs to user
        if (data.categoryId) {
            const cat = await tx.category.findFirst({
                where: { id: data.categoryId, userId: user.id },
            });
            if (!cat) throw new Error("Category not found or access denied");
        }

        // Validate projectId belongs to user
        if (data.projectId && data.projectId !== "none") {
            const proj = await tx.project.findFirst({
                where: { id: data.projectId, userId: user.id },
            });
            if (!proj) throw new Error("Project not found or access denied");
        }

        // 1. Повертаємо баланс назад
        const oldBalanceChange = oldTx.type === "income" ? -Number(oldTx.amount) : Number(oldTx.amount);
        await tx.financeAccount.update({
            where: { id: oldTx.accountId },
            data: { balance: { increment: oldBalanceChange } },
        });

        // 2. Оновлюємо транзакцію
        const updated = await tx.transaction.update({
            where: { id: data.id },
            data: {
                accountId: data.accountId,
                categoryId: data.categoryId,
                type: data.type,
                amount: data.amount,
                date: data.date,
                description: data.description,
                projectId: data.projectId !== "none" ? data.projectId : null,
                clientId: data.clientId !== "none" && data.clientId !== "" ? data.clientId : null,
                tagIds: data.tagIds || [],
                note: data.note,
            },
        });

        // 3. Застосовуємо новий баланс
        const newBalanceChange = data.type === "income" ? data.amount : -data.amount;
        await tx.financeAccount.update({
            where: { id: data.accountId },
            data: { balance: { increment: newBalanceChange } },
        });

        return updated;
    });

    revalidatePath("/dashboard/finance");
    return {
        ...transaction,
        amount: Number(transaction.amount),
    };
}

/**
 * Видалити транзакцію
 */
export async function deleteTransaction(id: string) {
    const user = await requireUser();

    await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
        const transaction = await tx.transaction.findUnique({
            where: { id, userId: user.id },
        });

        if (!transaction) throw new Error("Transaction not found");

        // Коригуємо баланс
        const balanceChange = transaction.type === "income" ? -Number(transaction.amount) : Number(transaction.amount);
        await tx.financeAccount.update({
            where: { id: transaction.accountId },
            data: { balance: { increment: balanceChange } },
        });

        // Видаляємо
        await tx.transaction.delete({
            where: { id },
        });
    });

    revalidatePath("/dashboard/finance");
    return { success: true };
}

/**
 * Генерувати рекурентні платежі (автоматично)
 */
export async function processRecurringPayments() {
    const user = await requireUser();
    const now = new Date();

    const pending = await prisma.recurringPayment.findMany({
        where: {
            userId: user.id,
            autoCreate: true,
            nextPaymentDate: { lte: now },
            OR: [
                { endDate: null },
                { endDate: { gte: now } }
            ]
        }
    });

    for (const payment of pending) {
        if (!payment.accountId || !payment.categoryId) continue;

        const pAccountId = payment.accountId;
        const pCategoryId = payment.categoryId;

        await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
            const fresh = await tx.recurringPayment.findUnique({
                where: { id: payment.id },
                select: { nextPaymentDate: true, lastGenerated: true },
            });
            if (!fresh) return;
            // Optimistic lock: if nextPaymentDate changed or already generated this cycle, skip
            if (fresh.nextPaymentDate.getTime() !== payment.nextPaymentDate.getTime()) return;
            if (fresh.lastGenerated && fresh.lastGenerated.getTime() >= now.getTime() - 60000) return;

            // Check for duplicate: if a transaction already exists for this recurring payment at this date
            const existing = await tx.transaction.findFirst({
                where: {
                    userId: user.id,
                    accountId: pAccountId,
                    date: payment.nextPaymentDate,
                    description: `[Auto] ${payment.name}`,
                }
            });
            if (existing) return;

            await tx.transaction.create({
                data: {
                    userId: user.id,
                    accountId: pAccountId,
                    categoryId: pCategoryId,
                    type: payment.type,
                    amount: payment.amount,
                    date: payment.nextPaymentDate,
                    description: `[Auto] ${payment.name}`,
                    note: "Автоматичний рекурентний платіж",
                }
            });

            // Оновлюємо баланс
            const balanceChange = payment.type === "income" ? Number(payment.amount) : -Number(payment.amount);
            await tx.financeAccount.update({
                where: { id: pAccountId },
                data: { balance: { increment: balanceChange } }
            });

            // Оновлюємо дату наступного платежу або вимикаємо автотворення для "once"
            const nextDate = new Date(payment.nextPaymentDate);
            let autoCreate = payment.autoCreate;

            if (payment.frequency === "weekly") nextDate.setDate(nextDate.getDate() + 7);
            else if (payment.frequency === "monthly") nextDate.setMonth(nextDate.getMonth() + 1);
            else if (payment.frequency === "yearly") nextDate.setFullYear(nextDate.getFullYear() + 1);
            else if (payment.frequency === "once") autoCreate = false;

            await tx.recurringPayment.update({
                where: { id: payment.id },
                data: {
                    nextPaymentDate: nextDate,
                    autoCreate: autoCreate,
                    lastGenerated: now
                }
            });
        });
    }

    revalidatePath("/dashboard/finance");
}
