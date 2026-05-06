// ─── bank.repository.ts ──────────────────────────────────────────────────────
// All Prisma interactions for the bank domain.

import { prisma } from "@/lib/prisma";
import type { BankAccountRecord } from "./bank.types";
import type { Prisma } from "@prisma/client";

// ─── BankAccount ─────────────────────────────────────────────────────────────

export async function findBankAccounts(userId: string): Promise<BankAccountRecord[]> {
    return prisma.bankAccount.findMany({
        where: { userId },
        select: {
            id: true,
            userId: true,
            monoAccountId: true,
            name: true,
            type: true,
            currencyCode: true,
            balance: true,
            creditLimit: true,
            iban: true,
            maskedPan: true,
            lastSyncAt: true,
            importDoneAt: true,
            createdAt: true,
            updatedAt: true,
            // monoToken intentionally omitted
        },
    });
}

/**
 * Find a single BankAccount with encrypted token for internal use only.
 */
export async function findBankAccountWithToken(accountId: string): Promise<{
    id: string;
    userId: string;
    monoAccountId: string;
    monoToken: string;
    lastSyncAt: Date | null;
    importDoneAt: Date | null;
}> {
    return prisma.bankAccount.findUniqueOrThrow({
        where: { id: accountId },
        select: {
            id: true,
            userId: true,
            monoAccountId: true,
            monoToken: true,    // encrypted — decrypt only before use
            lastSyncAt: true,
            importDoneAt: true,
        },
    });
}

/**
 * Find all BankAccounts ready for incremental sync:
 * - importDoneAt is set (initial import completed)
 * - lastSyncAt is older than `olderThanMs` milliseconds
 */
export async function findAccountsDueForSync(olderThanMs: number): Promise<{
    id: string;
    userId: string;
    monoAccountId: string;
    monoToken: string;
    lastSyncAt: Date | null;
}[]> {
    const cutoff = new Date(Date.now() - olderThanMs);
    return prisma.bankAccount.findMany({
        where: {
            importDoneAt: { not: null },
            OR: [
                { lastSyncAt: null },
                { lastSyncAt: { lt: cutoff } },
            ],
        },
        select: {
            id: true,
            userId: true,
            monoAccountId: true,
            monoToken: true,    // encrypted
            lastSyncAt: true,
        },
    });
}

/**
 * Upsert a BankAccount — create if new, update balance/meta if existing.
 * Never overwrites monoToken on update (token changes must be explicit).
 */
export async function upsertBankAccount(
    userId: string,
    data: {
        monoAccountId: string;
        monoToken: string;      // AES-256-GCM encrypted
        name: string;
        type: string;
        currencyCode: number;
        balance: bigint;
        creditLimit: bigint;
        iban: string | null;
        maskedPan: string[];
    }
) {
    return prisma.bankAccount.upsert({
        where: {
            userId_monoAccountId: {
                userId,
                monoAccountId: data.monoAccountId,
            },
        },
        create: { userId, ...data },
        update: {
            balance: data.balance,
            creditLimit: data.creditLimit,
            iban: data.iban,
            maskedPan: data.maskedPan,
            // monoToken not updated — prevents accidental token replacement
        },
    });
}

/**
 * Update lastSyncAt = now after a successful incremental sync.
 */
export async function markSyncComplete(accountId: string): Promise<void> {
    await prisma.bankAccount.update({
        where: { id: accountId },
        data: { lastSyncAt: new Date() },
    });
}

/**
 * Mark initial import as complete.
 * Sets both importDoneAt and lastSyncAt so incremental sync can start.
 */
export async function markImportComplete(accountId: string): Promise<void> {
    const now = new Date();
    await prisma.bankAccount.update({
        where: { id: accountId },
        data: { importDoneAt: now, lastSyncAt: now },
    });
}

// ─── BankTransaction ─────────────────────────────────────────────────────────

export interface BankTransactionRow {
    bankAccountId: string;
    monoTransactionId: string;
    time: Date;
    amount: number;
    operationAmount: number;
    currencyCode: number;
    mcc: number;
    description: string;
    comment: string | null;
    cashbackAmount: number;
    commissionRate: number;
    hold: boolean;
    receiptId: string | null;
    counterEdrpou: string | null;
    counterIban: string | null;
    raw: Prisma.InputJsonValue;
}

/**
 * Bulk-insert transactions, silently skipping duplicates.
 * monoTransactionId is the unique key — this is the primary dedup mechanism.
 * Returns the number of actually inserted rows.
 */
export async function insertTransactions(rows: BankTransactionRow[]): Promise<number> {
    if (rows.length === 0) return 0;
    const result = await prisma.bankTransaction.createMany({
        data: rows,
        skipDuplicates: true,
    });
    return result.count;
}

/**
 * Count transactions for an account within an optional time range.
 */
export async function countTransactions(
    bankAccountId: string,
    from?: Date,
    to?: Date
): Promise<number> {
    return prisma.bankTransaction.count({
        where: {
            bankAccountId,
            time: {
                ...(from ? { gte: from } : {}),
                ...(to ? { lte: to } : {}),
            },
        },
    });
}

/**
 * Fetch recent transactions for UI display (no raw field — lighter response).
 */
export async function findRecentTransactions(
    bankAccountId: string,
    limit = 50,
    offset = 0
) {
    return prisma.bankTransaction.findMany({
        where: { bankAccountId },
        orderBy: { time: "desc" },
        take: limit,
        skip: offset,
        select: {
            id: true,
            monoTransactionId: true,
            time: true,
            amount: true,
            currencyCode: true,
            description: true,
            comment: true,
            mcc: true,
            hold: true,
            cashbackAmount: true,
        },
    });
}
