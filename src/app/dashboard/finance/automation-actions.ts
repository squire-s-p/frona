"use server";

import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/require-user";
import { z } from "zod";

const idSchema = z.string().cuid();

const createAutomationRuleSchema = z.object({
    name: z.string().min(1).max(100),
    pattern: z.string().min(1).max(200),
    type: z.enum(["category", "project"]),
    targetId: z.string().cuid(),
    minAmount: z.number().min(0).optional().nullable(),
    maxAmount: z.number().min(0).optional().nullable(),
    currency: z.string().max(3).optional().nullable(),
});

export async function getAutomationRules() {
    const user = await requireUser();
    const rules = await prisma.automationRule.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: "desc" }
    });

    return rules.map((r) => ({
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
    const validated = createAutomationRuleSchema.parse(data);

    if (validated.type === "category") {
        const cat = await prisma.category.findFirst({ where: { id: data.targetId, userId: user.id } });
        if (!cat) throw new Error("Категорію не знайдено");
    } else {
        const proj = await prisma.project.findFirst({ where: { id: data.targetId, userId: user.id } });
        if (!proj) throw new Error("Проєкт не знайдено");
    }

    const rule = await prisma.automationRule.create({
        data: {
            userId: user.id,
            name: validated.name,
            pattern: validated.pattern,
            type: validated.type,
            targetId: validated.targetId,
            minAmount: validated.minAmount,
            maxAmount: validated.maxAmount,
            currency: validated.currency
        }
    });
    revalidatePath("/dashboard/finance");
    return rule;
}

export async function deleteAutomationRule(id: string) {
    const user = await requireUser();
    idSchema.parse(id);
    await prisma.automationRule.delete({
        where: { id, userId: user.id }
    });
    revalidatePath("/dashboard/finance");
}

export async function toggleAutomationRule(id: string, isActive: boolean) {
    const user = await requireUser();
    idSchema.parse(id);
    z.boolean().parse(isActive);
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
    idSchema.parse(transactionId);
    const transaction = await prisma.transaction.findUnique({
        where: { id: transactionId, userId: user.id },
        include: { account: { select: { currency: true } } }
    });

    if (!transaction || !transaction.description) return;
    if (transaction.type === "transfer") return;

    const rules = await prisma.automationRule.findMany({
        where: { userId: user.id, isActive: true }
    }) as { pattern: string; type: string; targetId: string; minAmount: Prisma.Decimal | null; maxAmount: Prisma.Decimal | null; currency: string | null; isActive: boolean }[];

    const updates: Record<string, string> = {};

    for (const rule of rules) {
        const pattern = rule.pattern.toLowerCase();
        const description = transaction.description?.toLowerCase() || "";
        if (!description.includes(pattern)) continue;

        if (rule.currency && transaction.account.currency !== rule.currency) continue;

        const amount = Math.abs(Number(transaction.amount));
        if (rule.minAmount !== null && amount < Number(rule.minAmount)) continue;
        if (rule.maxAmount !== null && amount > Number(rule.maxAmount)) continue;

        if (rule.type === "category") {
            updates.categoryId = rule.targetId;
        } else if (rule.type === "project") {
            updates.projectId = rule.targetId;
        }
    }

    if (Object.keys(updates).length > 0) {
        await prisma.transaction.update({
            where: { id: transactionId },
            data: updates
        });
        revalidatePath("/dashboard/finance");
    }
}
