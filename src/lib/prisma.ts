import { config } from "dotenv";
config();

import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

function createPrismaClient() {
  // Використовуємо реальну адресу, або "фейкову" для успішної збірки (build)
  const connectionString =
    process.env.DATABASE_URL_DIRECT ?? 
    process.env.DATABASE_URL ?? 
    "postgresql://dummy:dummy@localhost:5432/dummy";

  try {
    const adapter = new PrismaPg({ connectionString });
    
    return new PrismaClient({
      adapter,
      log: process.env.NODE_ENV === "development" ? ["error"] : ["error"],
    });
  } catch {
    // Якщо навіть адаптер не створився, повертаємо стандартний клієнт
    return new PrismaClient();
  }
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
