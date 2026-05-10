import { config } from "dotenv";
config();
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL_DIRECT ?? process.env.DATABASE_URL ?? "" });
const prisma = new PrismaClient({ adapter, log: ["error"] });

function toKyivStr(d: Date): string {
  const kyivStr = d.toLocaleString("sv-SE", {
    timeZone: "Europe/Kyiv",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
  return kyivStr.replace(",", "");
}

async function main() {
  const user = await prisma.user.findFirst({
    where: { email: { contains: "oleksandr" } },
  });
  if (!user) {
    console.log("no user");
    await prisma.$disconnect();
    return;
  }

  const entries = await prisma.timeEntry.findMany({
    where: { userId: user.id },
    select: {
      startAt: true,
      endAt: true,
      durationSec: true,
      note: true,
      project: { select: { name: true } },
    },
    orderBy: { startAt: "asc" },
  });

  const crossing = entries.filter((e) => {
    if (!e.endAt) return false;
    const sDate = toKyivStr(e.startAt).slice(0, 10);
    const eDate = toKyivStr(e.endAt).slice(0, 10);
    return sDate !== eDate;
  });

  console.log("Total:", entries.length, "Crossing midnight (Kyiv):", crossing.length);
  console.log("\nMidnight-crossing entries:");
  crossing.forEach((e) => {
    const durMin = Math.round(e.durationSec! / 60);
    console.log(
      toKyivStr(e.startAt) +
        " -> " +
        toKyivStr(e.endAt!) +
        "  " +
        durMin +
        "m  " +
        (e.project?.name || "-") +
        "  " +
        (e.note || "-")
    );
  });

  const wrongDur = entries.filter((e) => {
    if (!e.endAt || !e.durationSec) return false;
    const actual = Math.round((e.endAt.getTime() - e.startAt.getTime()) / 1000);
    return Math.abs(actual - e.durationSec) > 60;
  });
  console.log("\nDuration mismatch >60s:", wrongDur.length);
  wrongDur.slice(0, 10).forEach((e) => {
    const actual = Math.round((e.endAt!.getTime() - e.startAt.getTime()) / 1000);
    console.log(
      "stored=" + e.durationSec + "s actual=" + actual + "s diff=" + (actual - e.durationSec) + "s  " + e.startAt.toISOString()
    );
  });

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
