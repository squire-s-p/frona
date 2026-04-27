"use client";

import * as React from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { TimeBucket } from "@/lib/time-entries";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

function formatHMFromMinutes(totalMinutes: number) {
  const m = Math.max(0, Math.round(totalMinutes));
  const h = Math.floor(m / 60);
  const min = m % 60;

  if (h <= 0) return `${min}хв`;
  if (min <= 0) return `${h}г`;
  return `${h}г\u00A0${min}хв`;
}

function formatHMFromHours(hours: number) {
  const minutes = Math.round(Number(hours) * 60);
  return formatHMFromMinutes(minutes);
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-xl border border-border/50 bg-neutral-200 dark:bg-neutral-800 p-3 shadow-none">
        <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider mb-1">
          {formatLabel(String(label))}
        </p>
        <p className="text-sm font-bold text-foreground">
          {formatHMFromHours(payload[0].value)}
        </p>
      </div>
    );
  }
  return null;
};

function formatTick(ymd: string) {
  const [, m, d] = ymd.split("-");
  return `${d}.${m}`;
}

function formatLabel(ymd: string) {
  const [y, m, d] = ymd.split("-");
  return `${d}.${m}.${y}`;
}

type RangeKey = "all" | "90" | "30" | "7";

export default function ProjectTimeChart({ buckets }: { buckets: TimeBucket[] }) {
  const [range, setRange] = React.useState<RangeKey>("7");

  const data = React.useMemo(() => {
    let sliced = buckets;

    if (range === "all") {
      // Find first and last indices with actual time entries
      const firstIndex = buckets.findIndex((b) => b.minutes > 0);
      const lastIndex = buckets.findLastIndex ? buckets.findLastIndex((b) => b.minutes > 0) : buckets.map(b => b.minutes > 0).lastIndexOf(true);

      if (firstIndex !== -1 && lastIndex !== -1) {
        sliced = buckets.slice(firstIndex, lastIndex + 1);
      }
    } else {
      sliced = buckets.slice(-Number(range as "90" | "30" | "7"));
    }

    return sliced.map((b: any) => ({
      ...b,
      hours: b.minutes / 60,
    }));
  }, [buckets, range]);

  const totalMinutes = React.useMemo(
    () => data.reduce((acc: number, x: any) => acc + (x.minutes ?? 0), 0),
    [data]
  );

  const rangeLabel = range === "all" ? "Весь період" : `Останні ${range} днів`;

  return (
    <div className="space-y-4">
      {/* Compact summary + period selector row */}
      <div className="flex items-center justify-between gap-3">
        <div className="text-[11px] text-muted-foreground">
          Сумарно:{" "}
          <span className="font-bold text-foreground">
            {formatHMFromMinutes(totalMinutes)}
          </span>
        </div>

        <Select value={range} onValueChange={(v) => setRange(v as RangeKey)}>
          <SelectTrigger className="h-8 w-[140px] rounded-xl bg-neutral-200 dark:bg-neutral-800 border-border/40 text-xs font-medium">
            <SelectValue placeholder="Період" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7">7 днів</SelectItem>
            <SelectItem value="30">30 днів</SelectItem>
            <SelectItem value="90">90 днів</SelectItem>
            <SelectItem value="all">Весь період</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Chart */}
      <div className="h-[260px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ left: -10, right: 0, top: 10, bottom: 0 }}>
            <CartesianGrid vertical={false} strokeDasharray="3 3" strokeOpacity={0.05} />

            <XAxis
              dataKey="date"
              tickFormatter={formatTick}
              tick={{ fontSize: 10, fill: "currentColor", opacity: 0.4 }}
              tickMargin={12}
              minTickGap={20}
              axisLine={false}
              tickLine={false}
            />

            <YAxis
              tickFormatter={(v) => formatHMFromHours(Number(v))}
              tick={{ fontSize: 10, fill: "currentColor", opacity: 0.4 }}
              axisLine={false}
              tickLine={false}
            />

            <Tooltip content={<CustomTooltip />} />

            <Area
              type="monotone"
              dataKey="hours"
              strokeWidth={2.5}
              stroke="currentColor"
              className="text-foreground/40"
              fill="url(#colorMono)"
              fillOpacity={0.1}
              animationDuration={1000}
            />
            <defs>
              <linearGradient id="colorMono" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="currentColor" stopOpacity={0.2} />
                <stop offset="95%" stopColor="currentColor" stopOpacity={0} />
              </linearGradient>
            </defs>
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
