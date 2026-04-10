
import { prisma } from "@/lib/prisma";

export async function checkSyncStats() {
    const bankAccounts = await (prisma as any).bankAccount.findMany();

    const stats = await Promise.all(bankAccounts.map(async (acc: any) => {
        const totalBankTx = await (prisma as any).bankTransaction.count({
            where: { bankAccountId: acc.id }
        });

        const oldestTx = await (prisma as any).bankTransaction.findFirst({
            where: { bankAccountId: acc.id },
            orderBy: { time: 'asc' },
            select: { time: true }
        });

        const newestTx = await (prisma as any).bankTransaction.findFirst({
            where: { bankAccountId: acc.id },
            orderBy: { time: 'desc' },
            select: { time: true }
        });

        const bridgedCount = await (prisma as any).transaction.count({
            where: { accountId: acc.monoAccountId }
        });

        return {
            account: acc.name,
            id: acc.monoAccountId,
            inBankModule: totalBankTx,
            bridgedToFinance: bridgedCount,
            oldest: oldestTx?.time,
            newest: newestTx?.time,
            importDone: !!acc.importDoneAt
        };
    }));

    console.table(stats);
    return stats;
}
