import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthSession } from "@/lib/auth-session";

export async function GET() {
  const session = await getAuthSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const bankAccounts = await prisma.bankAccount.findMany();
    let fixed = 0;
    
    for (const b of bankAccounts) {
      const existing = await prisma.financeAccount.findUnique({ 
        where: { id: b.monoAccountId } 
      });
      
      if (!existing) {
        await prisma.financeAccount.create({
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
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ success: false, error: message });
  }
}
