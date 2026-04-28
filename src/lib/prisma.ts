import { config } from "dotenv";
config();

import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

function createPrismaClient() {
  const connectionString =
    process.env.DATABASE_URL_DIRECT ?? process.env.DATABASE_URL;

  // Під час збірки на Vercel або в CI адреса може бути відсутня.
  // Ми не кидаємо помилку одразу, а дозволяємо створити клієнт.
  // Помилка виникне лише при спробі реального запиту до БД.
  
  if (!connectionString) {
    console.warn("⚠️ Warning: No DATABASE_URL found. Prisma might fail at runtime.");
    // Повертаємо звичайний клієнт без адаптера (або з пустим рядком), 
    // щоб не ламати процес збірки Next.js.
    return new PrismaClient();
  }

  try {
    const adapter = new PrismaPg({ connectionString });
    return new PrismaClient({
      adapter,
      log: process.env.NODE_ENV === "development" ? ["error"] : ["error"],
    });
  } catch (error) {
    console.error("❌ Failed to initialize Prisma with adapter:", error);
    return new PrismaClient();
  }
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
