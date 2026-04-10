// ─── bank.bridge.ts ──────────────────────────────────────────────────────────
// Maps BankTransaction (raw Monobank data) → Transaction (Finance domain).
//
// Key insight: the old finance module uses Monobank's IDs as primary keys:
//   FinanceAccount.id   = Monobank account ID (e.g. "HUsh7f...")
//   Transaction.id      = Monobank transaction ID
//
// This means the bridge is lossless and naturally deduplication-proof.
// Coupling note: this file intentionally reads from both bank and finance tables.
// It is the ONLY place where bank ↔ finance coupling is allowed.

import { prisma } from "@/lib/prisma";
import type { BankTransactionRow } from "./bank.repository";
import { findBankAccounts } from "./bank.repository";

// ─── MCC → Category mapping (mirrors finance/actions.ts) ─────────────────────

const MCC_GROUPS: Record<number, { name: string; type: "income" | "expense" }> = {
    0: { name: "Інше", type: "expense" },
    5411: { name: "Супермаркети та Продукти", type: "expense" },
    5412: { name: "Супермаркети та Продукти", type: "expense" },
    5811: { name: "Кафе та Ресторани", type: "expense" },
    5812: { name: "Кафе та Ресторани", type: "expense" },
    5814: { name: "Кафе та Ресторани", type: "expense" },
    5541: { name: "Автомобіль та Паливо", type: "expense" },
    5542: { name: "Автомобіль та Паливо", type: "expense" },
    7011: { name: "Готелі та Подорожі", type: "expense" },
    4722: { name: "Готелі та Подорожі", type: "expense" },
    5999: { name: "Покупки", type: "expense" },
    7399: { name: "Послуги", type: "expense" },
    4111: { name: "Транспорт та Таксі", type: "expense" },
    4121: { name: "Транспорт та Таксі", type: "expense" },
    4812: { name: "Зв'язок та Інтернет", type: "expense" },
    4814: { name: "Зв'язок та Інтернет", type: "expense" },
    5912: { name: "Аптеки та Здоров'я", type: "expense" },
    6011: { name: "Готівка", type: "expense" },
    6010: { name: "Банківські послуги", type: "expense" },
    4900: { name: "Комунальні платежі", type: "expense" },
    5977: { name: "Косметика та Краса", type: "expense" },
    7230: { name: "Косметика та Краса", type: "expense" },
    5691: { name: "Одяг та Взуття", type: "expense" },
    5311: { name: "Одяг та Взуття", type: "expense" },
};

/** Cache to avoid N+1 category lookups within a single bridge call */
const categoryCache = new Map<string, string>();

async function getOrCreateCategory(
    userId: string,
    type: "income" | "expense",
    mcc: number,
    isInternalTransfer = false
): Promise<string> {
    const mccInfo = MCC_GROUPS[mcc];
    let name = mccInfo?.name ?? (type === "income" ? "Дохід" : "Інше");

    if (isInternalTransfer) {
        name = "Внутрішній переказ";
    }

    const cacheKey = `${userId}:${type}:${name}`;

    if (categoryCache.has(cacheKey)) {
        return categoryCache.get(cacheKey)!;
    }

    let category = await prisma.category.findFirst({
        where: { userId, name, type },
    });

    if (!category) {
        category = await prisma.category.create({
            data: { userId, name, type },
        });
    }

    categoryCache.set(cacheKey, category.id);
    return category.id;
}

// ─── Bridge ───────────────────────────────────────────────────────────────────

/**
 * Bridge a single BankTransaction row into the Finance Transaction table.
 *
 * Uses monoTransactionId as Transaction.id — so this is idempotent and safe to
 * call multiple times for the same transaction (no duplicates ever created).
 *
 * @param row              The raw BankTransaction
 * @param userId           The user's ID
 * @param monoAccountId    The Monobank account ID — used as FinanceAccount.id
 * @param internalIbans    Optional set of IBANs belonging to the user
 */
export async function bridgeTransaction(
    row: BankTransactionRow,
    userId: string,
    monoAccountId: string,   // = FinanceAccount.id in the old finance module
    internalIbans?: Set<string>
): Promise<boolean> {
    // Already bridged? Skip (idempotent)
    const existing = await (prisma as any).transaction.findUnique({
        where: { id: row.monoTransactionId },
        select: { id: true },
    });
    if (existing) return false;

    const amount = Math.abs(row.amount) / 100;          // kopecks → hryvnias
    const type: "income" | "expense" = row.amount > 0 ? "income" : "expense";
    const description = row.description + (row.comment ? `: ${row.comment}` : "");

    // Internal Transfer Detection
    let isInternal = false;
    if (internalIbans && row.counterIban && internalIbans.has(row.counterIban)) {
        isInternal = true;
    } else {
        // Fallback to keyword detection for Monobank specific internal labels
        const lowerDesc = description.toLowerCase();
        if (lowerDesc.includes("своєї карти") || lowerDesc.includes("своєї картки") || lowerDesc.includes("свій рахунок")) {
            // But only if it's a transfer MCC or similar
            if (row.mcc === 4829 || row.mcc === 6538 || row.mcc === 6012) {
                isInternal = true;
            }
        }
    }

    const categoryId = await getOrCreateCategory(userId, type, row.mcc, isInternal);

    await (prisma as any).transaction.create({
        data: {
            id: row.monoTransactionId,  // Monobank ID as PK = guaranteed dedup
            userId,
            accountId: monoAccountId,   // FinanceAccount.id = Monobank account ID
            categoryId,
            amount,
            type,
            date: row.time,
            description,
        },
    });

    return true;
}

/**
 * Bridge all BankTransactions for a given BankAccount that haven't been bridged yet.
 * Called after each sync to keep Finance table in sync.
 *
 * @param bankAccountId    Internal BankAccount.id
 * @param monoAccountId    Monobank account ID (= FinanceAccount.id)
 * @param userId           User's ID
 * @param since            Only bridge transactions after this date (incremental)
 */
export async function bridgeAccountTransactions(
    bankAccountId: string,
    monoAccountId: string,
    userId: string,
    since?: Date
): Promise<number> {
    categoryCache.clear(); // Reset per-call cache

    const rows: BankTransactionRow[] = await (prisma as any).bankTransaction.findMany({
        where: {
            bankAccountId,
            ...(since ? { time: { gte: since } } : {}),
        },
        orderBy: { time: "asc" },
    });

    // Fetch all internal IBANs for this user to detect transfers
    const accounts = await findBankAccounts(userId);
    const internalIbans = new Set(accounts.map(a => a.iban).filter((iban): iban is string => !!iban));

    let bridged = 0;
    for (const row of rows) {
        const wasNew = await bridgeTransaction(row, userId, monoAccountId, internalIbans);
        if (wasNew) bridged++;
    }

    console.log(`[bank.bridge] bridged ${bridged}/${rows.length} transactions for account ${monoAccountId}`);
    return bridged;
}

/**
 * Ensure a FinanceAccount exists for the given Monobank account.
 * Creates it if missing (e.g., new user or new account added).
 */
export async function ensureFinanceAccount(
    userId: string,
    monoAccountId: string,
    meta: {
        name: string;
        currency: string;
        balance: number;    // in hryvnias (already converted)
        type: string;       // white, black, fop, etc.
    }
): Promise<void> {
    const existing = await (prisma as any).financeAccount.findUnique({
        where: { id: monoAccountId },
        select: { id: true },
    });

    if (!existing) {
        const role = meta.type === "fop" ? "tax" : "liquid";
        await (prisma as any).financeAccount.create({
            data: {
                id: monoAccountId,
                userId,
                name: meta.name,
                currency: meta.currency,
                balance: meta.balance,
                role,
                lastSyncedAt: new Date(),
            },
        });
        console.log(`[bank.bridge] created FinanceAccount for ${monoAccountId}`);
    } else {
        // Update balance
        await (prisma as any).financeAccount.update({
            where: { id: monoAccountId },
            data: { balance: meta.balance, lastSyncedAt: new Date() },
        });
    }
}
