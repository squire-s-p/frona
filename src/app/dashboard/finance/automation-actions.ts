"use server";

import { prisma } from "@/lib/prisma";
import { getAuthSession } from "@/lib/auth-session";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

async function requireUser() {
    const session = await getAuthSession();
    if (!session?.user) redirect("/login");
    return session.user;
}

export async function getAutomationRules() {
    const user = await requireUser();
    const rules = await prisma.automationRule.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: "desc" }
    });

    return rules.map((r: any) => ({
        ...r,
        minAmount: r.minAmount ? Number(r.minAmount) : null,
        maxAmount: r.maxAmount ? Number(r.maxAmount) : null,
    }));
}

export async function createAutomationRule(data: {
    name: string;
    pattern: string;
    type: "category" | "project";
    targetId: string;
    minAmount?: number;
    maxAmount?: number;
    currency?: string;
}) {
    const user = await requireUser();
    const rule = await prisma.automationRule.create({
        data: {
            userId: user.id,
            name: data.name,
            pattern: data.pattern,
            type: data.type,
            targetId: data.targetId,
            minAmount: data.minAmount,
            maxAmount: data.maxAmount,
            currency: data.currency
        } as any
    });
    revalidatePath("/dashboard/finance");
    return rule;
}

export async function deleteAutomationRule(id: string) {
    const user = await requireUser();
    await prisma.automationRule.delete({
        where: { id, userId: user.id }
    });
    revalidatePath("/dashboard/finance");
}

export async function toggleAutomationRule(id: string, isActive: boolean) {
    const user = await requireUser();
    await prisma.automationRule.update({
        where: { id, userId: user.id },
        data: { isActive }
    });
    revalidatePath("/dashboard/finance");
}

/**
 * Застосовує правила до транзакції
 */
export async function applyRulesToTransaction(transactionId: string) {
    const user = await requireUser();
    const transaction = await prisma.transaction.findUnique({
        where: { id: transactionId, userId: user.id }
    });

    if (!transaction || !transaction.description) return;

    const rules = await prisma.automationRule.findMany({
        where: { userId: user.id, isActive: true }
    }) as any[];

    for (const rule of rules) {
        // 1. Опис (pattern)
        const pattern = rule.pattern.toLowerCase();
        const description = transaction.description?.toLowerCase() || "";
        if (!description.includes(pattern)) continue;

        // 2. Валюта (якщо вказана в правилі)
        if (rule.currency && (transaction as any).currency !== rule.currency) continue;

        // 3. Сума (якщо вказані пороги)
        const amount = Math.abs(Number(transaction.amount));
        if (rule.minAmount !== null && amount < Number(rule.minAmount)) continue;
        if (rule.maxAmount !== null && amount > Number(rule.maxAmount)) continue;

        // Якщо всі умови пройдені - застосовуємо
        if (rule.type === "category") {
            await prisma.transaction.update({
                where: { id: transactionId },
                data: { categoryId: rule.targetId }
            });
        } else if (rule.type === "project") {
            await prisma.transaction.update({
                where: { id: transactionId },
                data: { projectId: rule.targetId }
            });
        }
        break;
    }
}
