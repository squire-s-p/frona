"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { format, parseISO } from "date-fns";
import { uk } from "date-fns/locale";

type DayData = {
    dateISO: string;
    workSec: number;
};

type Props = {
    data: DayData[];
    maxSeconds?: number;
    className?: string;
};

export function WeeklySparkline({ data, maxSeconds = 8 * 3600, className }: Props) {
    const limit = Math.max(maxSeconds, ...data.map((d) => d.workSec), 1);

    return (
        <div className={cn("flex items-end gap-3 px-2", className)}>
            {data.map((day, i) => {
                const heightPct = Math.min(100, (day.workSec / limit) * 100);
                const isToday = i === data.length - 1;
                const dateObj = parseISO(day.dateISO);

                const hours = (day.workSec / 3600).toFixed(1);

                return (
                    <div key={day.dateISO} className="flex flex-col items-center gap-1 group">
                        {/* Value Label */}
                        <span className={cn(
                            "text-[9px] font-bold tabular-nums transition-opacity",
                            day.workSec > 0 ? "opacity-100" : "opacity-0 group-hover:opacity-40",
                            isToday ? "text-primary" : "text-muted-foreground/60"
                        )}>
                            {hours}г
                        </span>

                        <div
                            className={cn(
                                "w-3 rounded-[3px] transition-all duration-500",
                                isToday
                                    ? "bg-primary shadow-[0_0_12px_rgba(var(--primary-rgb),0.3)]"
                                    : "bg-muted-foreground/15 group-hover:bg-muted-foreground/25"
                            )}
                            style={{ height: `${Math.max(6, (heightPct * 24) / 100)}px` }}
                        />
                    </div>
                );
            })}
        </div>
    );
}
