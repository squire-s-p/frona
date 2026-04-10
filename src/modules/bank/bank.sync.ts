// ─── bank.sync.ts ────────────────────────────────────────────────────────────
// Core sync orchestration logic.
// Called by: server actions (initial import) and API route (incremental sync).

import { MonoBankService, RateLimitError, isRateLimitError, MONO_MAX_PERIOD_S } from "./bank.service";
import { encryptToken, decryptToken } from "./bank.crypto";
import {
    findBankAccounts,
    findAccountsDueForSync,
    findBankAccountWithToken,
    insertTransactions,
    markSyncComplete,
    markImportComplete,
    upsertBankAccount,
} from "./bank.repository";
import { mapStatementToDb, mapMonoAccountMeta, buildAccountName } from "./bank.mapper";
import { bridgeAccountTransactions, ensureFinanceAccount } from "./bank.bridge";
import type { SyncStatus, ImportProgress } from "./bank.types";
import { prisma } from "@/lib/prisma";

// ─── Constants ────────────────────────────────────────────────────────────────

const INCREMENTAL_BUFFER_S = 10 * 60;          // 10 min buffer for missed txns
const MIN_SYNC_INTERVAL_MS = 2 * 60 * 1000;    // 2 min between syncs
const INITIAL_IMPORT_MONTHS = 12;

// ─── Auto-initialization ──────────────────────────────────────────────────────

/**
 * Auto-initialize BankAccount records from MONOBANK_API_TOKEN env variable.
 * Called transparently before sync if no BankAccounts exist for the user.
 * Requires no UI interaction for single-user setups.
 */
export async function autoInitBankAccounts(userId: string): Promise<number> {
    const token = process.env.MONOBANK_API_TOKEN;
    if (!token) {
        throw new Error("MONOBANK_API_TOKEN is not set in environment");
    }

    const existing = await findBankAccounts(userId);
    if (existing.length > 0) {
        return existing.length; // Already initialized
    }

    const service = new MonoBankService(token);
    const clientInfo = await service.getClientInfo();

    let encrypted: string;
    try {
        encrypted = encryptToken(token);
    } catch {
        // If BANK_TOKEN_SECRET not set, use a base64 fallback (less secure, dev-only)
        encrypted = Buffer.from(token).toString("base64");
        console.warn("[bank.sync] BANK_TOKEN_SECRET not set — token stored with base64 only (dev mode)");
    }

    const db = prisma as any;
    let created = 0;
    for (const monoAccount of clientInfo.accounts) {
        const meta = mapMonoAccountMeta(monoAccount);
        const currency = monoAccount.currencyCode === 980 ? "UAH"
            : monoAccount.currencyCode === 840 ? "USD"
                : monoAccount.currencyCode === 978 ? "EUR" : "UAH";

        await upsertBankAccount(userId, {
            ...meta,
            monoToken: encrypted,
            name: buildAccountName(monoAccount),
        });

        // Ensure corresponding FinanceAccount exists (finance domain reads from this)
        await ensureFinanceAccount(userId, monoAccount.id, {
            name: buildAccountName(monoAccount),
            currency,
            balance: Number(monoAccount.balance) / 100,
            type: monoAccount.type,
        });

        created++;
    }

    console.log(`[bank.sync] auto-initialized ${created} BankAccount(s) for user ${userId}`);
    return created;
}

// ─── Initial Import ───────────────────────────────────────────────────────────

/**
 * Import ONE 31-day chunk for a single account.
 * UI calls this in a loop with 62-second delays (Monobank rate limit: 1 req/min).
 *
 * @param accountId   Internal BankAccount.id
 * @param monthIndex  0 = latest month, 11 = oldest
 */
export async function importMonthChunk(
    accountId: string,
    monthIndex: number,
    onProgress?: (p: ImportProgress) => void
): Promise<
    | { ok: true; inserted: number; bridged: number; done: boolean }
    | { ok: false; rateLimited: true }
    | { ok: false; error: string }
> {
    const account = await findBankAccountWithToken(accountId);
    let token: string;
    try {
        token = decryptToken(account.monoToken);
    } catch {
        token = Buffer.from(account.monoToken, "base64").toString("utf8");
    }
    const service = new MonoBankService(token);

    const nowS = Math.floor(Date.now() / 1000);
    const toS = nowS - monthIndex * MONO_MAX_PERIOD_S;
    const fromS = toS - MONO_MAX_PERIOD_S;

    try {
        const statements = await service.getStatement(account.monoAccountId, fromS, toS);
        const rows = statements.map(s => mapStatementToDb(s, accountId));
        const inserted = await insertTransactions(rows);

        // Bridge to Finance domain
        const since = new Date(fromS * 1000);
        const bridged = await bridgeAccountTransactions(
            accountId,
            account.monoAccountId,
            account.userId,
            since
        );

        onProgress?.({
            accountId,
            monthIndex,
            totalMonths: INITIAL_IMPORT_MONTHS,
            inserted,
        });

        const isLastChunk = monthIndex >= INITIAL_IMPORT_MONTHS - 1;
        if (isLastChunk) {
            await markImportComplete(accountId);
        }

        return { ok: true, inserted, bridged, done: isLastChunk };
    } catch (err) {
        if (isRateLimitError(err)) {
            return { ok: false, rateLimited: true };
        }
        const message = err instanceof Error ? err.message : String(err);
        console.error(`[bank.sync] importMonthChunk failed (accountId=${accountId}, month=${monthIndex}):`, message);
        return { ok: false, error: message };
    }
}

// ─── Incremental Sync ─────────────────────────────────────────────────────────

/**
 * Incremental sync for a single account: lastSyncAt - buffer → now.
 * Rate limit guard: skips if synced < 2 minutes ago.
 */
export async function syncAccountIncremental(accountId: string): Promise<SyncStatus> {
    const account = await findBankAccountWithToken(accountId);

    // If import not fully done, we still allow incremental sync from lastSyncAt or last 7 days.
    // This helps users who stopped the long 12-month import early but still want current data.

    if (account.lastSyncAt) {
        const elapsed = Date.now() - account.lastSyncAt.getTime();
        if (elapsed < MIN_SYNC_INTERVAL_MS) {
            return { ok: true, inserted: 0, accountId };
        }
    }

    let token: string;
    try {
        token = decryptToken(account.monoToken);
    } catch {
        token = Buffer.from(account.monoToken, "base64").toString("utf8");
    }
    const service = new MonoBankService(token);

    const fromS = account.lastSyncAt
        ? Math.floor(account.lastSyncAt.getTime() / 1000) - INCREMENTAL_BUFFER_S
        : Math.floor(Date.now() / 1000) - 7 * 24 * 3600;

    const toS = Math.floor(Date.now() / 1000);

    try {
        const statements = await service.getStatement(account.monoAccountId, fromS, toS);
        const rows = statements.map(s => mapStatementToDb(s, accountId));
        const inserted = await insertTransactions(rows);

        // Bridge new transactions to Finance domain
        const since = new Date(fromS * 1000);
        await bridgeAccountTransactions(
            accountId,
            account.monoAccountId,
            account.userId,
            since
        );

        await markSyncComplete(accountId);
        console.log(`[bank.sync] synced ${accountId}: ${inserted} new`);
        return { ok: true, inserted, accountId };
    } catch (err) {
        if (isRateLimitError(err)) {
            return { ok: false, rateLimited: true, accountId };
        }
        const message = err instanceof Error ? err.message : String(err);
        console.error(`[bank.sync] error for ${accountId}:`, message);
        return { ok: false, error: message, accountId };
    }
}

/**
 * Sync all accounts due for incremental sync.
 * Called by /api/bank/sync cron route every 5 minutes.
 */
export async function syncAllAccountsIncremental(): Promise<SyncStatus[]> {
    const accounts = await findAccountsDueForSync(MIN_SYNC_INTERVAL_MS);

    if (accounts.length === 0) {
        return [];
    }

    const results: SyncStatus[] = [];
    for (const account of accounts) {
        const result = await syncAccountIncremental(account.id);
        results.push(result);

        if (!result.ok && "rateLimited" in result) {
            console.warn("[bank.sync] rate limited — stopping batch");
            break;
        }
    }

    return results;
}
