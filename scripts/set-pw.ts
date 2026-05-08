import { config } from "dotenv";
config();
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";

const connectionString = process.env.DATABASE_URL_DIRECT ?? process.env.DATABASE_URL ?? "";
const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter, log: ["error"] });

async function main() {
  const email = process.argv[2];
  const password = process.argv[3];
  if (!email || !password) {
    console.log("Usage: npx tsx scripts/set-pw.ts <email> <password>");
    process.exit(1);
  }

  const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() }, select: { id: true } });
  if (!user) { console.log("User not found"); process.exit(1); }

  const hash = await bcrypt.hash(password, 12);
  await prisma.userPassword.upsert({
    where: { userId: user.id },
    update: { passwordHash: hash },
    create: { userId: user.id, passwordHash: hash },
  });

  console.log(`Password set for ${email}`);
  await prisma.$disconnect();
}

main().catch((e) => { console.error(e); process.exit(1); });
