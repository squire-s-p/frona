import TimePageClient from "@/components/time/time-page-client";
import { getTimeDayData, getRelevantTasks } from "./actions";

function isoTodayInTZ(timeZone: string) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());

  const map: Record<string, string> = {};
  for (const p of parts) map[p.type] = p.value;

  return `${map.year}-${map.month}-${map.day}`;
}

function normalizeDateISO(input: unknown): string | null {
  const raw = Array.isArray(input) ? input[0] : input;
  if (typeof raw !== "string") return null;
  const s = raw.trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return null;
  return s;
}

export default async function TimePage({
  searchParams,
}: {
  searchParams: any;
}) {
  const sp = await searchParams;

  // Спочатку тягнемо дані сьогодні (для timezone), потім якщо date передали — перезавантажимо
  const todayData = await getTimeDayData("2000-01-01");
  const todayISO = isoTodayInTZ(todayData.timezone);

  const normalized = normalizeDateISO(sp?.date);
  const dateISO = normalized ?? todayISO;

  const [data, relevantTasks] = await Promise.all([
    dateISO === "2000-01-01" ? todayData : getTimeDayData(dateISO),
    getRelevantTasks(),
  ]);

  return (
    <TimePageClient
      dateISO={dateISO}
      timezone={data.timezone}
      activeTimer={data.activeTimer}
      entries={data.entries}
      projects={data.projects}
      tags={data.tags}
      relevantTasks={relevantTasks}
    />
  );
}
