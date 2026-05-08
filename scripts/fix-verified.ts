import { config } from "dotenv";
config();
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const connectionString = process.env.DATABASE_URL_DIRECT ?? process.env.DATABASE_URL ?? "";
const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter, log: ["error"] });

async function main() {
  const users = await prisma.user.findMany({
    select: { id: true, email: true, emailVerified: true, name: true },
  });
  for (const u of users) {
    if (!u.emailVerified) {
      await prisma.user.update({
        where: { id: u.id },
        data: { emailVerified: new Date() },
      });
      console.log(`emailVerified set for: ${u.email}`);
    } else {
      console.log(`Already verified: ${u.email}`);
    }
  }
  await prisma.$disconnect();
}

main().catch((e) => { console.error(e); process.exit(1); });
