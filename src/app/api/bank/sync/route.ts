// ─── /app/api/bank/sync/route.ts ─────────────────────────────────────────────
// Cron endpoint for incremental Monobank sync.
// Schedule: every 5 minutes via Vercel Cron (vercel.json)
//
// vercel.json:
// { "crons": [{ "path": "/api/bank/sync", "schedule": "*/5 * * * *" }] }

import { NextRequest, NextResponse } from "next/server";
import { syncAllAccountsIncremental, autoInitBankAccounts } from "@/modules/bank/bank.sync";
import { getAuthSession } from "@/lib/auth-session";

const CRON_SECRET = process.env.CRON_SECRET;

export async function GET(request: NextRequest) {
    const auth = request.headers.get("authorization");
    const isVercelCron = request.headers.get("x-vercel-cron") === "1";
    const hasSecret = CRON_SECRET && auth === `Bearer ${CRON_SECRET}`;

    if (!isVercelCron && !hasSecret) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const startedAt = Date.now();

    try {
        // Get current user for auto-init
        const session = await getAuthSession();
        if (session?.user?.id) {
            // Auto-init BankAccounts if none exist (first run)
            await autoInitBankAccounts(session.user.id);
        }

        const results = await syncAllAccountsIncremental();

        const summary = {
            processed: results.length,
            ok: results.filter(r => r.ok).length,
            rateLimited: results.filter(r => !r.ok && "rateLimited" in r).length,
            errors: results.filter(r => !r.ok && !("rateLimited" in r)).length,
            totalInserted: results
                .filter((r): r is Extract<typeof r, { ok: true }> => r.ok)
                .reduce((sum, r) => sum + r.inserted, 0),
            durationMs: Date.now() - startedAt,
        };

        console.log("[/api/bank/sync]", summary);
        return NextResponse.json({ success: true, ...summary });
    } catch (err) {
        const message = err instanceof Error ? err.message : "Unknown error";
        console.error("[/api/bank/sync] fatal error:", message);
        return NextResponse.json({ success: false, error: message }, { status: 500 });
    }
}

export const dynamic = "force-dynamic";
export const maxDuration = 60;
