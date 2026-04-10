// ─── bank.service.ts ─────────────────────────────────────────────────────────
// Monobank API interactions. Pure fetch layer — no DB, no business logic.
// All methods are server-only (no "use client").

import type { MonoClientInfo, MonoStatementItem } from "./bank.types";

const MONO_BASE = "https://api.monobank.ua";

/** Maximum period per single statement request (Monobank allows ≤31 days + 1h) */
export const MONO_MAX_PERIOD_S = 31 * 24 * 3600 + 3600; // 31d + 1h in seconds

/**
 * Monobank API client.
 * Token is passed in (already decrypted by the caller) — never stored inside.
 */
export class MonoBankService {
    constructor(private readonly token: string) { }

    private async request<T>(path: string): Promise<T> {
        const response = await fetch(`${MONO_BASE}${path}`, {
            method: "GET",
            headers: {
                "X-Token": this.token,
                "Content-Type": "application/json",
            },
            // No cache — every sync call must hit the live API
            cache: "no-store",
        });

        if (response.status === 429) {
            throw new RateLimitError("Monobank API rate limit exceeded");
        }

        if (!response.ok) {
            const body = await response.json().catch(() => ({}));
            throw new Error(
                `Monobank API [${response.status}]: ${body?.errorDescription ?? response.statusText}`
            );
        }

        return response.json() as Promise<T>;
    }

    /**
     * Fetch client info + list of accounts.
     * Rate limit: not specified (safe to call once per connect).
     */
    async getClientInfo(): Promise<MonoClientInfo> {
        return this.request<MonoClientInfo>("/personal/client-info");
    }

    /**
     * Fetch statement for a specific account and time range.
     * Rate limit: 1 request per minute per account.
     * Period: max 31 days + 1 hour per call.
     *
     * @param monoAccountId  Monobank account ID (e.g. "HUsh7f…") or "0" for default
     * @param fromUnix       Unix timestamp (seconds) — start of period
     * @param toUnix         Unix timestamp (seconds) — end of period (default: now)
     */
    async getStatement(
        monoAccountId: string,
        fromUnix: number,
        toUnix?: number
    ): Promise<MonoStatementItem[]> {
        const to = toUnix ?? Math.floor(Date.now() / 1000);
        return this.request<MonoStatementItem[]>(
            `/personal/statement/${monoAccountId}/${fromUnix}/${to}`
        );
    }
}

/**
 * Sentinel error — thrown when Monobank returns 429.
 * Caller should catch this separately (do NOT retry, do NOT update lastSyncAt).
 */
export class RateLimitError extends Error {
    readonly isRateLimit = true as const;
    constructor(message: string) {
        super(message);
        this.name = "RateLimitError";
    }
}

export function isRateLimitError(err: unknown): err is RateLimitError {
    return err instanceof RateLimitError;
}
