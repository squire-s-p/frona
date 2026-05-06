// ─── bank.mapper.ts ──────────────────────────────────────────────────────────
// Converts raw Monobank API data → DB-ready shapes.
// All conversion logic is isolated here — nothing else should transform API data.

import type { MonoStatementItem, MonoAccount } from "./bank.types";
import type { BankTransactionRow } from "./bank.repository";
import type { Prisma } from "@prisma/client";

/**
 * Maps a Monobank statement item to a Prisma BankTransaction createMany input.
 * Amount stays in kopecks (integer) — no floating-point conversion.
 */
export function mapStatementToDb(
    item: MonoStatementItem,
    bankAccountId: string
): BankTransactionRow {
    return {
        bankAccountId,
        monoTransactionId: item.id,
        time: new Date(item.time * 1000),       // unix → JS Date
        amount: item.amount,                    // kopecks, negative = expense
        operationAmount: item.operationAmount,
        currencyCode: item.currencyCode,
        mcc: item.mcc ?? 0,
        description: item.description ?? "",
        comment: item.comment ?? null,
        cashbackAmount: item.cashbackAmount ?? 0,
        commissionRate: item.commissionRate ?? 0,
        hold: item.hold ?? false,
        receiptId: item.receiptId ?? null,
        counterEdrpou: item.counterEdrpou ?? null,
        counterIban: item.counterIban ?? null,
        raw: item as unknown as Prisma.InputJsonValue,
    };
}

/**
 * Maps Monobank account data to the display-safe fields (no token).
 * Used when creating / updating BankAccount records.
 */
export function mapMonoAccountMeta(account: MonoAccount) {
    return {
        monoAccountId: account.id,
        type: account.type,
        currencyCode: account.currencyCode,
        balance: BigInt(account.balance),
        creditLimit: BigInt(account.creditLimit),
        iban: account.iban ?? null,
        maskedPan: account.maskedPan ?? [],
    };
}

/**
 * Human-readable account name derived from Monobank account data.
 * Uses masked PAN if available, otherwise falls back to type + currency.
 */
export function buildAccountName(account: MonoAccount): string {
    if (account.maskedPan?.length) {
        return `Mono ${account.maskedPan[0]}`;
    }
    const currency = currencyLabel(account.currencyCode);
    return `Mono ${account.type} ${currency}`.trim();
}

function currencyLabel(code: number): string {
    const map: Record<number, string> = {
        980: "₴",
        840: "$",
        978: "€",
        826: "£",
    };
    return map[code] ?? `(${code})`;
}

/**
 * Convert kopecks (integer) to major currency unit as string.
 * Kept here as the single source of truth for amount display.
 */
export function kopecksToMajor(kopecks: number): string {
    return (kopecks / 100).toFixed(2);
}
