
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { checkSyncStats } from "@/modules/bank/debug-stats";

export async function GET() {
    try {
        const stats = await checkSyncStats();
        return NextResponse.json({
            success: true,
            summary: "Якщо 'oldest' датується лютим-березнем 2025 року, значить історія за рік завантажена повністю.",
            stats
        });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message });
    }
}
