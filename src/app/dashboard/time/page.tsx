import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Час",
};

import TimePageClient from "@/components/time/time-page-client";
import { getTimeDayData, getRelevantTasks, getTimezone } from "./actions";
import { DashboardPage } from "@/components/layout/dashboard-page";

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
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const sp = await searchParams;

  const timezone = await getTimezone();
  const todayISO = isoTodayInTZ(timezone);

  const normalized = normalizeDateISO(sp?.date);
  const dateISO = normalized ?? todayISO;

  const [data, relevantTasks] = await Promise.all([
    getTimeDayData(dateISO),
    getRelevantTasks(),
  ]);

  return (
    <DashboardPage className="h-full">
      <TimePageClient
        dateISO={dateISO}
        timezone={data.timezone}
        activeTimer={data.activeTimer}
        entries={data.entries}
        projects={data.projects}
        tags={data.tags}
        relevantTasks={relevantTasks}
        dailyTargetHours={data.dailyTargetHours}
      />
    </DashboardPage>
  );
}

