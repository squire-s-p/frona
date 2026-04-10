// ─── bank.actions.ts ─────────────────────────────────────────────────────────
// Server Actions for bank module. These are the ONLY functions callable from UI.
// UI never calls Monobank API directly. UI never receives monoToken.

"use server";

import { revalidatePath } from "next/cache";
import { encryptToken, decryptToken } from "./bank.crypto";
import { MonoBankService } from "./bank.service";
import { importMonthChunk, syncAccountIncremental, autoInitBankAccounts } from "./bank.sync";
import {
    findBankAccounts,
    findBankAccountWithToken,
    upsertBankAccount,
} from "./bank.repository";
import { mapMonoAccountMeta, buildAccountName } from "./bank.mapper";
import { getAuthSession } from "@/lib/auth-session";
import { redirect } from "next/navigation";
import type { BankAccountRecord } from "./bank.types";
import { ensureFinanceAccount } from "./bank.bridge";

async function requireUser() {
    const session = await getAuthSession();
    if (!session?.user) redirect("/login");
    return session.user as { id: string; email: string; name?: string | null };
}

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// ─── Auto-initialize from env (single-user setup) ────────────────────────────

/**
 * Initialize BankAccounts from MONOBANK_API_TOKEN env variable.
 * No token input needed — reads directly from server env.
 * Safe to call multiple times (idempotent).
 */
export async function autoInitFromEnv(): Promise<{
    success: boolean;
    created: number;
    error?: string;
}> {
    const user = await requireUser();
    try {
        const created = await autoInitBankAccounts(user.id);
        revalidatePath("/dashboard/finance");
        return { success: true, created };
    } catch (err) {
        return { success: false, created: 0, error: err instanceof Error ? err.message : String(err) };
    }
}

// ─── Connect Monobank ─────────────────────────────────────────────────────────

/**
 * Connect Monobank by providing a personal API token.
 * Fetches client info to validate token, then stores all accounts.
 * Does NOT start initial import — that's triggered separately.
 */
export async function connectMonobank(plainToken: string): Promise<{
    success: boolean;
    accountsCreated: number;
    error?: string;
}> {
    const user = await requireUser();

    try {
        const service = new MonoBankService(plainToken);
        const clientInfo = await service.getClientInfo();

        const encryptedToken = encryptToken(plainToken);
        let created = 0;

        for (const monoAccount of clientInfo.accounts) {
            const meta = mapMonoAccountMeta(monoAccount);
            await upsertBankAccount(user.id, {
                ...meta,
                monoToken: encryptedToken,
                name: buildAccountName(monoAccount),
            });
            created++;
        }

        revalidatePath("/dashboard/finance");
        return { success: true, accountsCreated: created };
    } catch (err) {
        const message = err instanceof Error ? err.message : "Unknown error";
        console.error("[bank.actions] connectMonobank failed:", message);
        return { success: false, accountsCreated: 0, error: message };
    }
}

// ─── Get Accounts (safe) ──────────────────────────────────────────────────────

/**
 * Return all BankAccounts for the current user.
 * monoToken is never included in the response.
 */
export async function getBankAccounts(): Promise<BankAccountRecord[]> {
    const user = await requireUser();
    return findBankAccounts(user.id);
}

// ─── Disconnect Monobank ──────────────────────────────────────────────────────

/**
 * Remove all Monobank integrations for the current user.
 * This deletes BankAccount and cascades to BankTransaction.
 */
export async function disconnectMonobankAccounts(): Promise<{ success: boolean; error?: string }> {
    const user = await requireUser();
    try {
        const { prisma } = await import("@/lib/prisma");
        await prisma.bankAccount.deleteMany({
            where: { userId: user.id }
        });
        revalidatePath("/dashboard/finance");
        revalidatePath("/dashboard/settings");
        return { success: true };
    } catch (err) {
        return { success: false, error: err instanceof Error ? err.message : String(err) };
    }
}

// ─── Initial Import ───────────────────────────────────────────────────────────

/**
 * Import one 31-day chunk for an account.
 * The UI calls this in a loop with 62-second delays between calls.
 *
 * @param accountId   Internal BankAccount.id (from getBankAccounts)
 * @param monthIndex  0 = current month, 1 = previous, ..., 11 = 12 months ago
 */
export async function importBankChunk(
    accountId: string,
    monthIndex: number
): Promise<
    | { ok: true; inserted: number; done: boolean }
    | { ok: false; rateLimited: true }
    | { ok: false; error: string }
> {
    const user = await requireUser();

    // Ownership check — user can only import their own accounts
    const account = await findBankAccountWithToken(accountId);
    if (account.userId !== user.id) {
        return { ok: false, error: "Unauthorized" };
    }

    const result = await importMonthChunk(accountId, monthIndex);

    if (result.ok) {
        revalidatePath("/dashboard/finance");
    }

    return result;
}

// ─── Manual Sync (UI "Refresh" button) ───────────────────────────────────────

/**
 * Trigger an incremental sync for a specific account.
 * Server checks rate limit automatically — safe to call from UI button.
 * Returns: number of new transactions inserted, or rate-limit indicator.
 */
export async function refreshBankAccount(accountId: string): Promise<{
    success: boolean;
    inserted?: number;
    rateLimited?: boolean;
    lastSyncAt?: string;
    error?: string;
}> {
    const user = await requireUser();

    const account = await findBankAccountWithToken(accountId);
    if (account.userId !== user.id) {
        return { success: false, error: "Unauthorized" };
    }


    const result = await syncAccountIncremental(accountId);

    if (!result.ok && "rateLimited" in result) {
        return { success: false, rateLimited: true };
    }

    if (!result.ok) {
        return { success: false, error: result.error };
    }

    revalidatePath("/dashboard/finance");

    // Return updated lastSyncAt for UI display
    const updated = await findBankAccountWithToken(accountId);
    return {
        success: true,
        inserted: result.inserted,
        lastSyncAt: updated.lastSyncAt?.toISOString(),
    };
}

/**
 * Trigger incremental sync for ALL bank accounts of the current user.
 * Skips accounts that are rate-limited or not yet initialized.
 */
export async function refreshAllBankAccounts(): Promise<{
    success: boolean;
    totalInserted: number;
    errors: string[];
}> {
    const user = await requireUser();
    const accounts = await findBankAccounts(user.id);

    let totalInserted = 0;
    const errors: string[] = [];

    // Optional: Refresh balances first (client info)
    // We only do this if there's at least one token available
    if (accounts.length > 0) {
        try {
            const firstAccount = await findBankAccountWithToken(accounts[0].id);
            let token: string;
            try {
                token = decryptToken(firstAccount.monoToken);
            } catch {
                token = Buffer.from(firstAccount.monoToken, "base64").toString("utf8");
            }
            const service = new MonoBankService(token);
            const clientInfo = await service.getClientInfo();

            for (const monoAcc of clientInfo.accounts) {
                const currency = monoAcc.currencyCode === 980 ? "UAH"
                    : monoAcc.currencyCode === 840 ? "USD"
                        : monoAcc.currencyCode === 978 ? "EUR" : "UAH";

                await ensureFinanceAccount(user.id, monoAcc.id, {
                    name: buildAccountName(monoAcc),
                    currency,
                    balance: Number(monoAcc.balance) / 100,
                    type: monoAcc.type,
                });
            }
        } catch (err) {
            console.warn("[refreshAllBankAccounts] Balance refresh failed:", err);
            // Non-fatal, we still try to get transactions
        }
    }

    for (const [index, account] of accounts.entries()) {
        try {
            // Add a small delay between accounts to avoid hitting global limits
            if (index > 0) await sleep(2000);

            const result = await syncAccountIncremental(account.id);
            if (result.ok) {
                totalInserted += result.inserted;
            } else if ("rateLimited" in result) {
                errors.push(`${account.name}: Ліміт запитів (зачекайте 1 хв)`);
                // If one account is rate limited, others likely will be too
                break;
            } else {
                errors.push(`${account.name}: ${result.error}`);
            }
        } catch (err) {
            errors.push(`${account.name}: ${err instanceof Error ? err.message : String(err)}`);
        }
    }

    revalidatePath("/dashboard/finance");
    return {
        success: true,
        totalInserted,
        errors
    };
}

// ─── Validate Token ───────────────────────────────────────────────────────────

/**
 * Validate a Monobank token without storing it.
 * Used by the connect dialog before showing the account list.
 */
export async function validateMonobankToken(
    token: string
): Promise<{ valid: boolean; name?: string; accountCount?: number; error?: string }> {
    try {
        const service = new MonoBankService(token);
        const info = await service.getClientInfo();
        return {
            valid: true,
            name: info.name,
            accountCount: info.accounts.length,
        };
    } catch (err) {
        return {
            valid: false,
            error: err instanceof Error ? err.message : "Invalid token",
        };
    }
}
