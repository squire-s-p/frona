"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Activity, Zap, TrendingUp, Wallet, Calendar, ShieldCheck, TrendingDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface FinancialHealthCardsProps {
    data: {
        burnRate: number;
        runway: number;
        liquidRunway: number;
        savingsRate: number;
        stabilityScore: number;
        totalBalance: number;
        liquidBalance: number;
        projections: {
            d30: number;
            d60: number;
            d90: number;
        };
    };
}

export function FinancialHealthCards({ data }: FinancialHealthCardsProps) {
    const runwayText = data.runway === Infinity ? "∞" : data.runway.toFixed(1);
    const liquidRunwayText = data.liquidRunway === Infinity ? "∞" : data.liquidRunway.toFixed(1);

    const formatCurrency = (val: number) =>
        new Intl.NumberFormat('uk-UA').format(Math.round(val)) + " ₴";

    return (
        <div className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card className="border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-zinc-500">Запас міцності (Runway)</CardTitle>
                        <Zap className="h-4 w-4 text-amber-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-baseline gap-2">
                            <div className="text-2xl font-bold">{liquidRunwayText}</div>
                            <div className="text-xs text-zinc-400">міс. (ліквідний)</div>
                        </div>
                        <p className="text-xs text-zinc-500 mt-1">
                            Повний: <span className="font-medium text-zinc-700 dark:text-zinc-300">{runwayText} міс.</span>
                        </p>
                    </CardContent>
                </Card>

                <Card className="border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-zinc-500">Ефективність (Savings)</CardTitle>
                        <TrendingUp className="h-4 w-4 text-emerald-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{data.savingsRate.toFixed(1)}%</div>
                        <p className="text-xs text-zinc-500 mt-1 flex items-center gap-1">
                            Стабільність доходу:
                            <span className={cn(
                                "font-medium",
                                data.stabilityScore > 70 ? "text-emerald-600" :
                                    data.stabilityScore > 40 ? "text-amber-600" : "text-red-600"
                            )}>
                                {data.stabilityScore.toFixed(0)}%
                            </span>
                        </p>
                    </CardContent>
                </Card>

                <Card className="border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-zinc-500">Burn Rate (Витрати)</CardTitle>
                        <Activity className="h-4 w-4 text-red-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{formatCurrency(data.burnRate)}</div>
                        <p className="text-xs text-zinc-500 mt-1">Середнє за останні 30 днів</p>
                    </CardContent>
                </Card>

                <Card className="border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-zinc-500">Загальний капітал</CardTitle>
                        <Wallet className="h-4 w-4 text-blue-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{formatCurrency(data.totalBalance)}</div>
                        <p className="text-xs text-zinc-500 mt-1 flex items-center justify-between">
                            <span>Ліквідно:</span>
                            <span className="font-semibold text-zinc-700 dark:text-zinc-300">{formatCurrency(data.liquidBalance)}</span>
                        </p>
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
                <Card className="border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/30">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-xs font-semibold uppercase tracking-wider text-zinc-500 flex items-center gap-2">
                            <Calendar className="h-3.5 w-3.5" />
                            Прогноз 30 днів
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-xl font-bold">{formatCurrency(data.projections.d30)}</div>
                        <div className={cn(
                            "text-[10px] mt-1 flex items-center gap-1",
                            data.projections.d30 >= data.totalBalance ? "text-emerald-600" : "text-red-600"
                        )}>
                            {data.projections.d30 >= data.totalBalance ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                            {formatCurrency(Math.abs(data.projections.d30 - data.totalBalance))} до поточного
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/30">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-xs font-semibold uppercase tracking-wider text-zinc-500 flex items-center gap-2">
                            <Calendar className="h-3.5 w-3.5" />
                            Прогноз 60 днів
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-xl font-bold">{formatCurrency(data.projections.d60)}</div>
                        <div className={cn(
                            "text-[10px] mt-1 flex items-center gap-1",
                            data.projections.d60 >= data.totalBalance ? "text-emerald-600" : "text-red-600"
                        )}>
                            {data.projections.d60 >= data.totalBalance ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                            {formatCurrency(Math.abs(data.projections.d60 - data.totalBalance))} до поточного
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/30">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-xs font-semibold uppercase tracking-wider text-zinc-500 flex items-center gap-2">
                            <Calendar className="h-3.5 w-3.5" />
                            Прогноз 90 днів
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-xl font-bold">{formatCurrency(data.projections.d90)}</div>
                        <div className={cn(
                            "text-[10px] mt-1 flex items-center gap-1",
                            data.projections.d90 >= data.totalBalance ? "text-emerald-600" : "text-red-600"
                        )}>
                            {data.projections.d90 >= data.totalBalance ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                            {formatCurrency(Math.abs(data.projections.d90 - data.totalBalance))} до поточного
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
