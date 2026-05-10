"use server";

import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireUser } from "@/lib/require-user";
import { applyRulesToTransaction } from "./automation-actions";

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

const accountIdSchema = z.string().cuid();
const categoryIdSchema = z.string().cuid();
const tagIdSchema = z.string().cuid();
const idSchema = z.string().cuid();

const createCategorySchema = z.object({
    name: z.string().min(1).max(100),
    type: z.enum(["income", "expense"]),
    isTaxable: z.boolean().optional(),
});

const updateCategorySchema = z.object({
    name: z.string().min(1).max(100).optional(),
    isTaxable: z.boolean().optional(),
});

const createTagSchema = z.object({
    name: z.string().min(1).max(50),
    color: z.string().max(7).optional(),
});

const getAccountHistorySchema = z.object({
    accountId: z.string().cuid(),
    from: z.coerce.date(),
    to: z.coerce.date(),
});

const updateAccountSchema = z.object({
    name: z.string().min(1).max(100).optional(),
    type: z.enum(["checking", "savings", "cash", "credit", "investment", "tax_reserve"]).optional(),
    color: z.string().max(7).optional(),
    includeInTotal: z.boolean().optional(),
    isArchived: z.boolean().optional(),
    role: z.enum(["liquid", "savings", "tax_reserve", "investment"]).optional(),
});

const createTransactionWithTagsSchema = z.object({
    accountId: z.string().cuid(),
    categoryId: z.string().cuid(),
    type: z.enum(["income", "expense"]),
    amount: z.number().positive(),
    date: z.coerce.date(),
    description: z.string().max(500).optional(),
    projectId: z.string().optional(),
    clientId: z.string().optional(),
    tagIds: z.array(z.string()).optional(),
    note: z.string().max(500).optional(),
    isRecurring: z.boolean().optional(),
    recurringFrequency: z.enum(["weekly", "monthly", "yearly"]).optional(),
});

const createFullSplitTransactionSchema = z.object({
    accountId: z.string().cuid(),
    type: z.enum(["income", "expense"]),
    amount: z.number().positive(),
    date: z.coerce.date(),
    description: z.string().min(1).max(500),
    splits: z.array(z.object({
        categoryId: z.string().cuid(),
        amount: z.number().positive(),
        note: z.string().max(500).optional(),
    })).min(1),
    tagIds: z.array(z.string()).optional(),
    clientId: z.string().optional(),
    projectId: z.string().optional(),
});

const updateTransactionSchema = z.object({
    id: z.string().cuid(),
    accountId: z.string().cuid(),
    categoryId: z.string().cuid(),
    type: z.enum(["income", "expense"]),
    amount: z.number().positive(),
    date: z.coerce.date(),
    description: z.string().max(500).optional(),
    projectId: z.string().optional(),
    clientId: z.string().optional(),
    tagIds: z.array(z.string()).optional(),
    note: z.string().max(500).optional(),
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

    const validated = updateAccountSchema.parse(data);
    accountIdSchema.parse(id);

    const account = await prisma.financeAccount.update({
        where: { id, userId: user.id },
        data: validated,
    });

    revalidatePath("/dashboard/finance");
    return {
        ...account,
        balance: Number(account.balance),
    };
}

export async function deleteAccount(id: string) {
    const user = await requireUser();
    idSchema.parse(id);

    await prisma.financeAccount.update({
        where: { id, userId: user.id },
        data: { isArchived: true },
    });

    revalidatePath("/dashboard/finance");
    return { success: true };
}

export async function getCategories() {
    const user = await requireUser();
    return prisma.category.findMany({
        where: { userId: user.id },
        orderBy: { name: "asc" },
    });
}

export async function createCategory(data: {
    name: string;
    type: "income" | "expense";
    isTaxable?: boolean;
}) {
    const user = await requireUser();
    const validated = createCategorySchema.parse(data);

    const existing = await prisma.category.findFirst({
        where: { userId: user.id, name: validated.name, type: validated.type },
    });
    if (existing) {
        return { ...existing, alreadyExists: true };
    }

    const category = await prisma.category.create({
        data: {
            userId: user.id,
            name: validated.name,
            type: validated.type,
            isTaxable: validated.isTaxable ?? false,
        },
    });

    revalidatePath("/dashboard/finance");
    return category;
}

export async function updateCategory(
    id: string,
    data: {
        name?: string;
        isTaxable?: boolean;
    }
) {
    const user = await requireUser();
    idSchema.parse(id);
    const validated = updateCategorySchema.parse(data);

    const category = await prisma.category.update({
        where: { id, userId: user.id },
        data: validated,
    });

    revalidatePath("/dashboard/finance");
    return category;
}

export async function getClients() {
    const user = await requireUser();
    return prisma.client.findMany({
        where: { userId: user.id },
        orderBy: { name: "asc" },
    });
}

export async function getTags() {
    const user = await requireUser();
    return prisma.financeTag.findMany({
        where: { userId: user.id },
        orderBy: { name: "asc" },
    });
}

export async function createTag(name: string, color?: string) {
    const user = await requireUser();
    const validated = createTagSchema.parse({ name, color });

    const tag = await prisma.financeTag.create({
        data: {
            userId: user.id,
            name: validated.name,
            color: validated.color,
        },
    });

    revalidatePath("/dashboard/finance");
    return tag;
}

export async function deleteTag(id: string) {
    const user = await requireUser();
    idSchema.parse(id);

    await prisma.financeTag.delete({
        where: { id, userId: user.id },
    });

    revalidatePath("/dashboard/finance");
    return { success: true };
}

export async function createTransfer(data: z.infer<typeof createTransferSchema>) {
    const user = await requireUser();
    const validated = createTransferSchema.parse(data);

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

    const transfer = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
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
    const validated = createTransactionWithTagsSchema.parse(data);

    const account = await prisma.financeAccount.findFirst({
        where: { id: validated.accountId, userId: user.id },
    });
    if (!account) throw new Error("Account not found or access denied");

    const category = await prisma.category.findFirst({
        where: { id: validated.categoryId, userId: user.id },
    });
    if (!category) throw new Error("Category not found or access denied");

    if (validated.projectId && validated.projectId !== "none") {
        const proj = await prisma.project.findFirst({
            where: { id: validated.projectId, userId: user.id },
        });
        if (!proj) throw new Error("Project not found or access denied");
    }

    if (validated.clientId && validated.clientId !== "none" && validated.clientId !== "") {
        const cl = await prisma.client.findFirst({
            where: { id: validated.clientId, userId: user.id },
        });
        if (!cl) throw new Error("Client not found or access denied");
    }

    const transaction = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
        const newTx = await tx.transaction.create({
            data: {
                userId: user.id,
                accountId: validated.accountId,
                categoryId: validated.categoryId,
                type: validated.type,
                amount: validated.amount,
                date: validated.date,
                description: validated.description,
                projectId: validated.projectId !== "none" ? validated.projectId : null,
                clientId: validated.clientId !== "none" && validated.clientId !== "" ? validated.clientId : null,
                tagIds: validated.tagIds || [],
                note: validated.note,
                isRecurring: validated.isRecurring || false,
            },
        });

        if (validated.isRecurring && validated.recurringFrequency) {
            const nextDate = new Date(validated.date);
            if (validated.recurringFrequency === "weekly") nextDate.setDate(nextDate.getDate() + 7);
            else if (validated.recurringFrequency === "monthly") nextDate.setMonth(nextDate.getMonth() + 1);
            else if (validated.recurringFrequency === "yearly") nextDate.setFullYear(nextDate.getFullYear() + 1);

            await tx.recurringPayment.create({
                data: {
                    userId: user.id,
                    name: validated.description || "Рекурентний платіж",
                    amount: validated.amount,
                    type: validated.type,
                    frequency: validated.recurringFrequency,
                    nextPaymentDate: nextDate,
                    categoryId: validated.categoryId,
                    accountId: validated.accountId,
                    autoCreate: true,
                },
            });
        }

        const balanceChange =
            validated.type === "income" ? validated.amount : -validated.amount;

        await tx.financeAccount.update({
            where: { id: validated.accountId },
            data: {
                balance: {
                    increment: balanceChange,
                },
            },
        });

        return newTx;
    });

    revalidatePath("/dashboard/finance");

    if (transaction.id) {
        try { await applyRulesToTransaction(transaction.id); } catch {}
    }

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
    const validated = createFullSplitTransactionSchema.parse(data);

    const account = await prisma.financeAccount.findFirst({
        where: { id: validated.accountId, userId: user.id },
    });
    if (!account) throw new Error("Account not found or access denied");

    const splitCategoryIds = [...new Set(validated.splits.map(s => s.categoryId))];
    const validCategories = await prisma.category.findMany({
        where: { id: { in: splitCategoryIds }, userId: user.id },
        select: { id: true },
    });
    const validCatIds = new Set(validCategories.map(c => c.id));
    for (const cid of splitCategoryIds) {
        if (!validCatIds.has(cid)) throw new Error("Category not found or access denied");
    }

    if (data.projectId && data.projectId !== "none") {
        const proj = await prisma.project.findFirst({ where: { id: validated.projectId, userId: user.id } });
        if (!proj) throw new Error("Project not found or access denied");
    }

    if (validated.clientId && validated.clientId !== "none" && validated.clientId !== "") {
        const cl = await prisma.client.findFirst({ where: { id: validated.clientId, userId: user.id } });
        if (!cl) throw new Error("Client not found or access denied");
    }

    const splitsTotal = validated.splits.reduce((sum, s) => sum + s.amount, 0);

    if (Math.abs(splitsTotal - validated.amount) > 0.01) {
        throw new Error(`Сума частин (${splitsTotal.toFixed(2)}) не дорівнює загальній сумі (${validated.amount.toFixed(2)})`);
    }

    const transaction = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
        const parentTx = await tx.transaction.create({
            data: {
                userId: user.id,
                accountId: validated.accountId,
                categoryId: validated.splits[0].categoryId,
                type: validated.type,
                amount: 0,
                date: validated.date,
                description: validated.description,
                tagIds: validated.tagIds || [],
                note: "[SPLIT]",
                clientId: validated.clientId !== "none" && validated.clientId !== "" ? validated.clientId : null,
                projectId: validated.projectId || null,
            },
        });

        for (const split of validated.splits) {
            await tx.transaction.create({
                data: {
                    userId: user.id,
                    accountId: validated.accountId,
                    categoryId: split.categoryId,
                    type: validated.type,
                    amount: split.amount,
                    date: validated.date,
                    description: validated.description,
                    note: split.note,
                    tagIds: validated.tagIds || [],
                    splitParentId: parentTx.id,
                    clientId: validated.clientId !== "none" && validated.clientId !== "" ? validated.clientId : null,
                    projectId: validated.projectId || null,
                },
            });
        }

        const balanceChange = validated.type === "income" ? splitsTotal : -splitsTotal;
        await tx.financeAccount.update({
            where: { id: validated.accountId },
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
    const validated = updateTransactionSchema.parse(data);

    const transaction = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
        const oldTx = await tx.transaction.findUnique({
            where: { id: validated.id, userId: user.id },
        });
        if (!oldTx) throw new Error("Transaction not found");

        if (oldTx.type === "transfer") {
            throw new Error("Трансферні транзакції не можна редагувати окремо.");
        }

        if (validated.accountId !== oldTx.accountId) {
            const newAcc = await tx.financeAccount.findFirst({
                where: { id: validated.accountId, userId: user.id },
            });
            if (!newAcc) throw new Error("Target account not found or access denied");
        }

        if (validated.categoryId) {
            const cat = await tx.category.findFirst({
                where: { id: validated.categoryId, userId: user.id },
            });
            if (!cat) throw new Error("Category not found or access denied");
        }

        if (validated.projectId && validated.projectId !== "none") {
            const proj = await tx.project.findFirst({
                where: { id: validated.projectId, userId: user.id },
            });
            if (!proj) throw new Error("Project not found or access denied");
        }

        const oldBalanceChange = oldTx.type === "income" ? -Number(oldTx.amount) : Number(oldTx.amount);
        await tx.financeAccount.update({
            where: { id: oldTx.accountId },
            data: { balance: { increment: oldBalanceChange } },
        });

        const updated = await tx.transaction.update({
            where: { id: validated.id },
            data: {
                accountId: validated.accountId,
                categoryId: validated.categoryId,
                type: validated.type,
                amount: validated.amount,
                date: validated.date,
                description: validated.description,
                projectId: validated.projectId !== "none" ? validated.projectId : null,
                clientId: validated.clientId !== "none" && validated.clientId !== "" ? validated.clientId : null,
                tagIds: validated.tagIds || [],
                note: validated.note,
            },
        });

        const newBalanceChange = validated.type === "income" ? validated.amount : -validated.amount;
        await tx.financeAccount.update({
            where: { id: validated.accountId },
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

        if (transaction.type === "transfer") {
            throw new Error("Трансферні транзакції не можна видаляти окремо. Використовуйте управління переказами.");
        }

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
            if (fresh.nextPaymentDate.getTime() !== payment.nextPaymentDate.getTime()) return;
            if (fresh.lastGenerated && fresh.lastGenerated.getTime() >= now.getTime() - 60000) return;

            const account = await tx.financeAccount.findFirst({
                where: { id: pAccountId, userId: user.id },
                select: { id: true },
            });
            if (!account) return;

            const category = await tx.category.findFirst({
                where: { id: pCategoryId, userId: user.id },
                select: { id: true },
            });
            if (!category) return;

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
