"use client";

import * as React from "react";
import { format, subDays, startOfMonth, endOfMonth, startOfWeek, endOfWeek, subMonths, addDays } from "date-fns";
import { uk } from "date-fns/locale";
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DateRange } from "react-day-picker";

import { ProjectSummaryItem } from "@/app/dashboard/reports/actions";

function formatDuration(seconds: number) {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    return `${h}г ${m}хв`;
}

export default function ReportHeader({
    dateRange,
    setDateRangeAction,
    data,
    loading = false,
}: {
    dateRange: DateRange | undefined;
    setDateRangeAction: (range: DateRange | undefined) => void;
    data: ProjectSummaryItem[];
    loading?: boolean;
}) {
    const summary = React.useMemo(() => {
        const total = data.reduce((acc, curr) => acc + curr.totalDuration, 0);
        const prevTotal = data.reduce((acc, curr) => acc + (curr.previousDuration || 0), 0);
        let growth: number | undefined = undefined;
        if (prevTotal > 0) {
            growth = ((total - prevTotal) / prevTotal) * 100;
        }

        return {
            totalSeconds: total,
            growth,
            projectCount: data.length,
        };
    }, [data]);
    const clientCount = new Set(data.filter(d => d.clientName).map(d => d.clientName)).size;

    const handlePresetChange = (value: string) => {
        const today = new Date();
        switch (value) {
            case "today":
                setDateRangeAction({ from: today, to: today });
                break;
            case "yesterday":
                const y = subDays(today, 1);
                setDateRangeAction({ from: y, to: y });
                break;
            case "thisWeek":
                setDateRangeAction({ from: startOfWeek(today, { weekStartsOn: 1 }), to: endOfWeek(today, { weekStartsOn: 1 }) });
                break;
            case "lastWeek":
                const lastWeek = subDays(today, 7);
                setDateRangeAction({ from: startOfWeek(lastWeek, { weekStartsOn: 1 }), to: endOfWeek(lastWeek, { weekStartsOn: 1 }) });
                break;
            case "thisMonth":
                setDateRangeAction({ from: startOfMonth(today), to: endOfMonth(today) });
                break;
            case "lastMonth":
                const lastMonth = subMonths(today, 1);
                setDateRangeAction({ from: startOfMonth(lastMonth), to: endOfMonth(lastMonth) });
                break;
            case "allTime":
                // Hacky "All Time" - 10 years back
                setDateRangeAction({ from: subDays(today, 3650), to: today });
                break;
        }
    }

    return (
        <div className="space-y-6 mb-6">
            <div className="flex flex-col gap-1">
                <Link href="/dashboard/time">
                    <Button variant="ghost" size="sm" className="gap-2 -ml-2 h-8 px-2 text-muted-foreground hover:text-foreground">
                        <ArrowLeft className="h-4 w-4" />
                        Назад до трекінгу
                    </Button>
                </Link>
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <h1 className="text-2xl font-semibold">Звіт по проєктам</h1>

                    <div className="flex items-center gap-2">
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button
                                    id="date"
                                    variant={"outline"}
                                    className={cn(
                                        "justify-start text-left font-normal h-9",
                                        !dateRange && "text-muted-foreground w-[260px]"
                                    )}
                                >
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    {dateRange?.from ? (
                                        dateRange.to ? (
                                            <>
                                                {format(dateRange.from, "LLL dd, y", { locale: uk })} -{" "}
                                                {format(dateRange.to, "LLL dd, y", { locale: uk })}
                                            </>
                                        ) : (
                                            format(dateRange.from, "LLL dd, y", { locale: uk })
                                        )
                                    ) : (
                                        <span>Виберіть дату</span>
                                    )}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0 overflow-hidden" align="end">
                                <div className="flex bg-card">
                                    <div className="border-r p-2 flex flex-col gap-1 w-[160px]">
                                        <div className="text-[11px] font-semibold text-muted-foreground px-2 py-1 mb-1">ШВИДКИЙ ВИБІР</div>
                                        {[
                                            { label: "Сьогодні", value: "today" },
                                            { label: "Вчора", value: "yesterday" },
                                            { label: "Цей тиждень", value: "thisWeek" },
                                            { label: "Минулий тиждень", value: "lastWeek" },
                                            { label: "Цей місяць", value: "thisMonth" },
                                            { label: "Минулий місяць", value: "lastMonth" },
                                            { label: "За весь час", value: "allTime" },
                                        ].map((preset) => (
                                            <Button
                                                key={preset.value}
                                                variant="ghost"
                                                size="sm"
                                                className="justify-start font-normal h-8 text-xs"
                                                onClick={() => handlePresetChange(preset.value)}
                                            >
                                                {preset.label}
                                            </Button>
                                        ))}
                                        <div className="mt-auto pt-2 border-t">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="justify-start font-normal h-8 text-xs w-full text-destructive hover:text-destructive hover:bg-destructive/10"
                                                onClick={() => setDateRangeAction(undefined)}
                                            >
                                                Очистити
                                            </Button>
                                        </div>
                                    </div>
                                    <div className="p-2">
                                        <Calendar
                                            initialFocus
                                            mode="range"
                                            defaultMonth={dateRange?.from}
                                            selected={dateRange}
                                            onSelect={setDateRangeAction}
                                            numberOfMonths={2}
                                            locale={uk}
                                        />
                                    </div>
                                </div>
                            </PopoverContent>
                        </Popover>

                        <div className="flex items-center">
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => {
                                if (dateRange?.from && dateRange?.to) {
                                    const diff = Math.ceil((dateRange.to.getTime() - dateRange.from.getTime()) / (1000 * 60 * 60 * 24)) + 1;
                                    setDateRangeAction({ from: subDays(dateRange.from, diff), to: subDays(dateRange.to, diff) });
                                }
                            }}>
                                <ChevronLeft className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => {
                                if (dateRange?.from && dateRange?.to) {
                                    const diff = Math.ceil((dateRange.to.getTime() - dateRange.from.getTime()) / (1000 * 60 * 60 * 24)) + 1;
                                    setDateRangeAction({ from: addDays(dateRange.from, diff), to: addDays(dateRange.to, diff) });
                                }
                            }}>
                                <ChevronRight className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Card className="rounded-xl border bg-card p-4 shadow-sm">
                    <div className="text-sm text-muted-foreground">Загальний час</div>
                    <div className="text-2xl font-bold mt-1">
                        {loading && data.length === 0 ? "..." : formatDuration(summary.totalSeconds)}
                    </div>
                    {!loading && summary.growth !== undefined && (
                        <div className={cn(
                            "text-xs mt-1 font-medium",
                            summary.growth >= 0 ? "text-green-500" : "text-destructive"
                        )}>
                            {summary.growth >= 0 ? "+" : ""}{summary.growth.toFixed(1)}%
                            <span className="text-muted-foreground font-normal ml-1">порівняно з минулим</span>
                        </div>
                    )}
                </Card>
                <Card className="rounded-xl border bg-card p-4 shadow-sm">
                    <div className="text-sm text-muted-foreground">Проєкти</div>
                    <div className="text-2xl font-bold mt-1">
                        {loading && data.length === 0 ? "—" : summary.projectCount}
                    </div>
                </Card>
                <Card className="rounded-xl border bg-card p-4 shadow-sm">
                    <div className="text-sm text-muted-foreground">Клієнти</div>
                    <div className="text-2xl font-bold mt-1">
                        {loading && data.length === 0 ? "—" : clientCount}
                    </div>
                </Card>
            </div>
        </div>
    );
}
