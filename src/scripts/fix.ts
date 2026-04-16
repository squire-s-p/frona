import { prisma } from "../lib/prisma";

async function main() {
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
      console.log(`Created FinanceAccount for ${b.name}`);
    }
  }
  console.log(`Finished. Fixed accounts: ${fixed}`);
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
