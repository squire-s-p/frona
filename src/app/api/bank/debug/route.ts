
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { checkSyncStats } from "@/modules/bank/debug-stats";
import { getAuthSession } from "@/lib/auth-session";

export async function GET() {
    const session = await getAuthSession();
    if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const stats = await checkSyncStats();
        return NextResponse.json({
            success: true,
            summary: "Якщо 'oldest' датується лютим-березнем 2025 року, значить історія за рік завантажена повністю.",
            stats
        });
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "Unknown error";
        return NextResponse.json({ success: false, error: message });
    }
}
