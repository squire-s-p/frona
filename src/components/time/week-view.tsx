"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { formatDurationUa } from "@/lib/time/format-duration";
import { Card } from "@/components/ui/card";

type WeekDayData = {
  dateISO: string;
  dayName: string;
  workSec: number;
  breakSec: number;
  projects: Record<string, number>;
};

type Props = {
  data: WeekDayData[] | null;
};

function fmtHours(sec: number) {
  if (sec === 0) return "0 год";
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  if (h > 0 && m === 0) return `${h} год`;
  if (h > 0) return `${h} год ${m} хв`;
  return `${m} хв`;
}

export default function WeekView({ data }: Props) {
  const router = useRouter();

  if (!data) {
    return (
      <Card className="p-8 text-center text-muted-foreground">
        Завантаження...
      </Card>
    );
  }

  const totalWork = data.reduce((s, d) => s + d.workSec, 0);
  const totalBreak = data.reduce((s, d) => s + d.breakSec, 0);

  return (
    <Card className="overflow-hidden border shadow-none">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/40 text-muted-foreground">
              <th className="px-4 py-2.5 text-left font-medium w-[120px]">День</th>
              <th className="px-4 py-2.5 text-right font-medium w-[120px]">Робота</th>
              <th className="px-4 py-2.5 text-right font-medium w-[120px]">Перерва</th>
              <th className="px-4 py-2.5 text-left font-medium">Проєкти</th>
            </tr>
          </thead>
          <tbody>
            {data.map((day) => (
              <tr
                key={day.dateISO}
                className="border-b last:border-b-0 hover:bg-muted/20 transition-colors cursor-pointer"
                role="link"
                tabIndex={0}
                aria-label={`${day.dayName} ${day.dateISO} — ${fmtHours(day.workSec)}`}
                onClick={() => router.push(`/dashboard/time?date=${day.dateISO}`)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    router.push(`/dashboard/time?date=${day.dateISO}`);
                  }
                }}
              >
                <td className="px-4 py-2.5">
                  <div className="font-medium">{day.dayName}</div>
                  <div className="text-xs text-muted-foreground">{day.dateISO}</div>
                </td>
                <td className="px-4 py-2.5 text-right tabular-nums font-medium">
                  {fmtHours(day.workSec)}
                </td>
                <td className="px-4 py-2.5 text-right tabular-nums text-muted-foreground">
                  {fmtHours(day.breakSec)}
                </td>
                <td className="px-4 py-2.5">
                  {Object.keys(day.projects).length === 0 ? (
                    <span className="text-muted-foreground italic text-xs">—</span>
                  ) : (
                    <div className="flex flex-wrap gap-1.5">
                      {Object.entries(day.projects).map(([name, sec]) => (
                        <span
                          key={name}
                          className="inline-flex items-center gap-1 rounded-md bg-muted px-2 py-0.5 text-xs"
                        >
                          {name}
                          <span className="text-muted-foreground">{formatDurationUa(sec)}</span>
                        </span>
                      ))}
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t bg-muted/30 font-semibold">
              <td className="px-4 py-2.5">Разом</td>
              <td className="px-4 py-2.5 text-right tabular-nums">{fmtHours(totalWork)}</td>
              <td className="px-4 py-2.5 text-right tabular-nums text-muted-foreground">{fmtHours(totalBreak)}</td>
              <td className="px-4 py-2.5" />
            </tr>
          </tfoot>
        </table>
      </div>
    </Card>
  );
}
