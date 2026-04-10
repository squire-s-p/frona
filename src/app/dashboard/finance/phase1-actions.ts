"use server";

import { prisma } from "@/lib/prisma";
import { getAuthSession } from "@/lib/auth-session";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

async function requireUser() {
    const session = await getAuthSession();
    if (!session?.user) redirect("/login");
    return session.user;
}

// ========================
// ACCOUNT MANAGEMENT
// ========================

/**
 * Створити новий фінансовий рахунок
 */
export async function createAccount(data: {
    name: string;
    type: string;
    currency: string;
    balance: number;
    color?: string;
    includeInTotal?: boolean;
    role?: string;
}) {
    const user = await requireUser();

    const account = await prisma.financeAccount.create({
        data: {
            userId: user.id,
            name: data.name,
            type: data.type,
            currency: data.currency,
            balance: data.balance,
            color: data.color,
            includeInTotal: data.includeInTotal ?? true,
            role: data.role || "liquid",
        } as any
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
export async function createTransfer(data: {
    fromAccountId: string;
    toAccountId: string;
    amount: number;
    fee?: number;
    exchangeRate?: number;
    note?: string;
    date: Date;
}) {
    const user = await requireUser();

    // Перевіряємо рахунки
    const [fromAccount, toAccount] = await Promise.all([
        prisma.financeAccount.findFirst({
            where: { id: data.fromAccountId, userId: user.id },
        }),
        prisma.financeAccount.findFirst({
            where: { id: data.toAccountId, userId: user.id },
        }),
    ]);

    if (!fromAccount || !toAccount) {
        throw new Error("Account not found");
    }

    // Створюємо переказ
    const transfer = await prisma.$transaction(async (tx) => {
        // Створюємо запис трансферу
        const newTransfer = await (tx as any).transfer.create({
            data: {
                userId: user.id,
                fromAccountId: data.fromAccountId,
                toAccountId: data.toAccountId,
                amount: data.amount,
                fee: data.fee || 0,
                exchangeRate: data.exchangeRate,
                note: data.note,
                date: data.date || new Date(),
            },
        });

        // Оновлюємо баланси
        const totalDebit = data.amount + (data.fee || 0);
        const creditAmount = data.exchangeRate
            ? data.amount * data.exchangeRate
            : data.amount;

        await tx.financeAccount.update({
            where: { id: data.fromAccountId },
            data: {
                balance: {
                    decrement: totalDebit,
                },
            },
        });

        await tx.financeAccount.update({
            where: { id: data.toAccountId },
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

    const where: any = { userId: user.id };
    if (filters?.from || filters?.to) {
        where.date = {};
        if (filters.from) where.date.gte = filters.from;
        if (filters.to) where.date.lte = filters.to;
    }

    const transfers = await (prisma as any).transfer.findMany({
        where,
        include: {
            fromAccount: true,
            toAccount: true,
        },
        orderBy: { date: "desc" },
    });

    return transfers.map((t: any) => ({
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

    const category = await prisma.category.create({
        data: {
            userId: user.id,
            name: data.name,
            type: data.type,
            isTaxable: data.isTaxable ?? false,
        } as any,
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

    const tag = await (prisma as any).financeTag.create({
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

    const transaction = await prisma.$transaction(async (tx) => {
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
            } as any,
        });

        // Якщо це рекурентний платіж, створюємо і його
        if (data.isRecurring && data.recurringFrequency) {
            const nextDate = new Date(data.date);
            if (data.recurringFrequency === "weekly") nextDate.setDate(nextDate.getDate() + 7);
            else if (data.recurringFrequency === "monthly") nextDate.setMonth(nextDate.getMonth() + 1);
            else if (data.recurringFrequency === "yearly") nextDate.setFullYear(nextDate.getFullYear() + 1);

            await (tx as any).recurringPayment.create({
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
                } as any,
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

    const transaction = await prisma.$transaction(async (tx) => {
        // 1. Створюємо головну транзакцію (батьківську)
        const parentTx = await tx.transaction.create({
            data: {
                userId: user.id,
                accountId: data.accountId,
                categoryId: data.splits[0].categoryId, // Використовуємо першу категорію як дефолт
                type: data.type,
                amount: data.amount,
                date: data.date,
                description: data.description,
                tagIds: data.tagIds || [],
                note: "[PARENT] " + (data.splits[0].note || ""),
                clientId: data.clientId !== "none" && data.clientId !== "" ? data.clientId : null,
                projectId: data.projectId || null,
            } as any,
        });

        // 2. Створюємо дочірні транзакції
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
                } as any,
            });
        }

        // 3. Оновлюємо баланс (тільки на суму головної транзакції)
        const balanceChange = data.type === "income" ? data.amount : -data.amount;
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

    // Отримуємо стару транзакцію для корекції балансу
    const oldTx = await prisma.transaction.findUnique({
        where: { id: data.id, userId: user.id },
    });

    if (!oldTx) throw new Error("Transaction not found");

    const transaction = await prisma.$transaction(async (tx) => {
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
                clientId: (data as any).clientId !== "none" && (data as any).clientId !== "" ? (data as any).clientId : null,
                tagIds: (data as any).tagIds || [],
                note: (data as any).note,
            } as any,
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

    const transaction = await prisma.transaction.findUnique({
        where: { id, userId: user.id },
    });

    if (!transaction) throw new Error("Transaction not found");

    await prisma.$transaction(async (tx) => {
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

    const pending = await (prisma as any).recurringPayment.findMany({
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
        await prisma.$transaction(async (tx) => {
            // Створюємо транзакцію
            await tx.transaction.create({
                data: {
                    userId: user.id,
                    accountId: payment.accountId,
                    categoryId: payment.categoryId,
                    type: payment.type,
                    amount: payment.amount,
                    date: payment.nextPaymentDate,
                    description: `[Auto] ${payment.name}`,
                    note: "Автоматичний рекурентний платіж",
                } as any
            });

            // Оновлюємо баланс
            const balanceChange = payment.type === "income" ? Number(payment.amount) : -Number(payment.amount);
            await tx.financeAccount.update({
                where: { id: payment.accountId },
                data: { balance: { increment: balanceChange } }
            });

            // Оновлюємо дату наступного платежу або вимикаємо автотворення для "once"
            let nextDate = new Date(payment.nextPaymentDate);
            let autoCreate = payment.autoCreate;

            if (payment.frequency === "weekly") nextDate.setDate(nextDate.getDate() + 7);
            else if (payment.frequency === "monthly") nextDate.setMonth(nextDate.getMonth() + 1);
            else if (payment.frequency === "yearly") nextDate.setFullYear(nextDate.getFullYear() + 1);
            else if (payment.frequency === "once") autoCreate = false;

            await (tx as any).recurringPayment.update({
                where: { id: payment.id },
                data: {
                    nextPaymentDate: nextDate,
                    autoCreate: autoCreate,
                    lastGenerated: now
                } as any
            });
        });
    }

    revalidatePath("/dashboard/finance");
}
