import { config } from "dotenv";
config();
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { readFileSync } from "fs";
import { join } from "path";

const connectionString = process.env.DATABASE_URL_DIRECT ?? process.env.DATABASE_URL ?? "";
const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter, log: ["error"] });

interface CsvRow {
  date: string;
  description: string;
  project: string;
  projectCode: string;
  client: string;
  tags: string;
  workType: string;
  startTime: string;
  endTime: string;
  duration: string;
}

function parseCsv(filePath: string): CsvRow[] {
  const raw = readFileSync(filePath, "utf-8");
  const lines = raw.split(/\r?\n/).filter((l) => l.trim());
  const header = lines[0];
  const dataLines = lines.slice(1);

  const rows: CsvRow[] = [];
  for (const line of dataLines) {
    const parts = line.split(",");
    if (parts.length < 11) continue;
    rows.push({
      date: parts[0].trim(),
      description: parts[2].trim(),
      project: parts[3].trim(),
      projectCode: parts[4].trim(),
      client: parts[5].trim(),
      tags: parts[6].trim(),
      workType: parts[7].trim(),
      startTime: parts[8].trim(),
      endTime: parts[9].trim(),
      duration: parts[10].trim(),
    });
  }
  return rows;
}

function parseDurationSec(d: string): number {
  const parts = d.split(":");
  if (parts.length === 3) {
    return parseInt(parts[0]) * 3600 + parseInt(parts[1]) * 60 + parseInt(parts[2]);
  }
  if (parts.length === 2) {
    return parseInt(parts[0]) * 60 + parseInt(parts[1]);
  }
  return 0;
}

function getKyivOffsetMinutes(utcMs: number): number {
  const d = new Date(utcMs);
  const kyivStr = d.toLocaleString("sv-SE", { timeZone: "Europe/Kyiv" });
  const utcStr = d.toLocaleString("sv-SE", { timeZone: "UTC" });
  const parseSvSe = (s: string) => {
    const [dp, tp] = s.split(" ");
    const [y, mo, da] = dp.split("-").map(Number);
    const [h, mi] = tp.split(":").map(Number);
    return Date.UTC(y, mo - 1, da, h, mi, 0);
  };
  return (parseSvSe(kyivStr) - parseSvSe(utcStr)) / 60000;
}

function localToUtc(dateStr: string, timeStr: string): Date {
  const [year, month, day] = dateStr.split("-").map(Number);
  const [hours, minutes] = timeStr.split(":").map(Number);
  const pretendUtc = Date.UTC(year, month - 1, day, hours, minutes, 0);
  const offsetMin = getKyivOffsetMinutes(pretendUtc);
  return new Date(pretendUtc - offsetMin * 60000);
}

async function main() {
  const email = process.argv[2];
  if (!email) {
    console.log("Usage: npx tsx scripts/import-time-csv.ts <email>");
    process.exit(1);
  }

  const user = await prisma.user.findUnique({
    where: { email: email.toLowerCase() },
    select: { id: true },
  });
  if (!user) {
    console.log("User not found:", email);
    process.exit(1);
  }
  const userId = user.id;

  const csvPath = join(process.cwd(), "detailed_report_20250501_20260511.csv");
  const rows = parseCsv(csvPath);
  console.log(`Parsed ${rows.length} rows from CSV`);

  const uniqueProjects = [
    ...new Set(rows.filter((r) => r.project).map((r) => r.project)),
  ];
  console.log(`Found ${uniqueProjects.length} unique projects:`, uniqueProjects);

  const existingProjects = await prisma.project.findMany({
    where: { userId, name: { in: uniqueProjects } },
    select: { id: true, name: true },
  });
  const projectMap = new Map(existingProjects.map((p) => [p.name, p.id]));
  console.log(`Already exist in DB: ${existingProjects.length}`);

  const missingProjects = uniqueProjects.filter((n) => !projectMap.has(n));
  console.log(`To create: ${missingProjects.length}`, missingProjects);

  for (const name of missingProjects) {
    const project = await prisma.project.create({
      data: { userId, name },
    });
    projectMap.set(name, project.id);
    console.log(`  Created project: ${name} (${project.id})`);
  }

  const deleted = await prisma.timeEntry.deleteMany({ where: { userId } });
  console.log(`Deleted ${deleted.count} existing entries for clean re-import`);
  const existingKeys = new Set<string>();

  let imported = 0;
  let skipped = 0;

  for (const row of rows) {
    const durationSec = parseDurationSec(row.duration);
    if (durationSec <= 0) {
      skipped++;
      continue;
    }

    const startUtc = localToUtc(row.date, row.startTime);

    let endUtc: Date;
    const startParts = row.startTime.split(":").map(Number);
    const endParts = row.endTime.split(":").map(Number);
    const startMinutes = startParts[0] * 60 + startParts[1];
    const endMinutes = endParts[0] * 60 + endParts[1];

    if (endMinutes <= startMinutes) {
      const [y, m, d] = row.date.split("-").map(Number);
      const nextDay = new Date(Date.UTC(y, m - 1, d + 1));
      const nextDayStr = nextDay.toISOString().slice(0, 10);
      endUtc = localToUtc(nextDayStr, row.endTime);
    } else {
      endUtc = localToUtc(row.date, row.endTime);
    }

    const projectId = row.project ? projectMap.get(row.project) ?? null : null;
    const key = `${startUtc.toISOString()}|${endUtc.toISOString()}|${projectId ?? "null"}`;
    if (existingKeys.has(key)) {
      skipped++;
      continue;
    }

    await prisma.timeEntry.create({
      data: {
        userId,
        type: "work",
        projectId,
        startAt: startUtc,
        endAt: endUtc,
        durationSec,
        billable: true,
        note: row.description || null,
      },
    });
    existingKeys.add(key);
    imported++;
  }

  console.log(`\nDone: imported ${imported}, skipped ${skipped}`);
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
