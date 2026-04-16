import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const bankAccounts = await (prisma as any).bankAccount.findMany();
    let fixed = 0;
    
    for (const b of bankAccounts) {
      const existing = await (prisma as any).financeAccount.findUnique({ 
        where: { id: b.monoAccountId } 
      });
      
      if (!existing) {
        await (prisma as any).financeAccount.create({
          data: {
            id: b.monoAccountId,
            userId: b.userId,
            name: b.name || "Рахунок",
            currency: "UAH",
            balance: 0,
            role: "liquid",
            lastSyncedAt: new Date()
          }
        });
        fixed++;
      }
    }
    return NextResponse.json({ success: true, fixed });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message });
  }
}
