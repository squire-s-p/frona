"use client";

import React from "react";
import { format } from "date-fns";
import { uk } from "date-fns/locale";
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip as RechartsTooltip,
    ResponsiveContainer,
    ReferenceLine
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { TrendingUp, TrendingDown, Wallet, Calendar, AlertCircle, Plus, Trash2, Info } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface ForecastTabProps {
    data: {
        daily: any[];
        monthly: any[];
        cashGaps: { date: Date; balance: number }[];
        currentBalance: number;
        currentLiquidBalance: number;
    } | null;
    whatIfs: any[];
    onWhatIfChange: (whatIfs: any[]) => void;
}

export function ForecastTab({ data, whatIfs, onWhatIfChange }: ForecastTabProps) {
    const [newWhatIf, setNewWhatIf] = React.useState({
        name: "",
        amount: "",
        date: new Date(),
        type: "expense" as "income" | "expense"
    });

    if (!data) return (
        <div className="h-[400px] flex items-center justify-center text-zinc-500">
            Завантаження даних прогнозу...
        </div>
    );

    const { daily, monthly, cashGaps, currentLiquidBalance } = data;
    const lastMonth = monthly[monthly.length - 1];

    return (
        <div className="space-y-6">
            {/* Cash Gap Alert */}
            {cashGaps.length > 0 && (
                <Card className="border-red-200 bg-red-50 dark:bg-red-950/20 dark:border-red-900/50">
                    <CardContent className="pt-6">
                        <div className="flex items-start gap-3">
                            <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
                            <div>
                                <h4 className="text-red-900 dark:text-red-400 font-bold">Виявлено касовий розрив!</h4>
                                <p className="text-sm text-red-700 dark:text-red-500 mt-1">
                                    Ваш ліквідний баланс опуститься нижче нуля {format(new Date(cashGaps[0].date), "d MMMM", { locale: uk })}.
                                    Очікуваний мінімум: {new Intl.NumberFormat('uk-UA').format(Math.min(...cashGaps.map(g => g.balance)))} ₴
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card className="lg:col-span-2 border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50">
                    <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle className="text-lg font-medium flex items-center gap-2">
                            <Wallet className="h-4 w-4" />
                            Симулятор балансу ({daily.length > 0 ? format(new Date(daily[daily.length - 1].date), "MMM yyyy", { locale: uk }) : ""})
                        </CardTitle>
                        <div className="flex items-center gap-4 text-xs">
                            <div className="flex items-center gap-1.5 cursor-help" title="Гроші на банківських картках та готівка">
                                <div className="w-3 h-3 rounded-full bg-zinc-900" />
                                <span>Ліквідний</span>
                            </div>
                            <div className="flex items-center gap-1.5 cursor-help" title="Всі рахунки включно з накопиченнями">
                                <div className="w-3 h-3 rounded-full bg-zinc-400" />
                                <span>Загальний</span>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="h-[400px] pt-4">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={daily}>
                                <defs>
                                    <linearGradient id="colorLiquid" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#18181b" stopOpacity={0.1} />
                                        <stop offset="95%" stopColor="#18181b" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e4e4e7" opacity={0.5} />
                                <XAxis
                                    dataKey="date"
                                    axisLine={false}
                                    tickLine={false}
                                    tickFormatter={(value) => format(new Date(value), "MMM", { locale: uk })}
                                    stroke="#71717a"
                                    fontSize={12}
                                    dy={10}
                                    interval={30}
                                />
                                <YAxis
                                    axisLine={false}
                                    tickLine={false}
                                    stroke="#71717a"
                                    fontSize={12}
                                    tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
                                />
                                <RechartsTooltip
                                    contentStyle={{ backgroundColor: '#18181b', border: 'none', borderRadius: '8px', color: '#f4f4f5' }}
                                    itemStyle={{ color: '#f4f4f5' }}
                                    formatter={(value: any, name: any) => [
                                        value !== undefined ? `${new Intl.NumberFormat('uk-UA').format(Math.round(value))} ₴` : '0 ₴',
                                        name === "liquidBalance" ? "Ліквідний" : "Загальний"
                                    ]}
                                    labelFormatter={(label) => format(new Date(label), "d MMMM yyyy", { locale: uk })}
                                />
                                <ReferenceLine y={currentLiquidBalance} stroke="#71717a" strokeDasharray="3 3" label={{ position: 'right', value: 'Сьогодні', fill: '#71717a', fontSize: 10 }} />
                                <ReferenceLine y={0} stroke="#ef4444" strokeWidth={1} />

                                <Area
                                    type="monotone"
                                    dataKey="totalBalance"
                                    stroke="#a1a1aa"
                                    strokeWidth={1}
                                    fill="none"
                                />
                                <Area
                                    type="monotone"
                                    dataKey="liquidBalance"
                                    stroke="#18181b"
                                    strokeWidth={3}
                                    fillOpacity={1}
                                    fill="url(#colorLiquid)"
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                <div className="space-y-6">
                    <Card className="border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-zinc-500">Прогноз ліквідного залишку</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold">
                                {new Intl.NumberFormat('uk-UA', { maximumFractionDigits: 0 }).format(lastMonth?.endLiquidBalance || 0)} ₴
                            </div>
                            <p className={cn(
                                "text-xs mt-2 flex items-center gap-1",
                                (lastMonth?.endLiquidBalance > currentLiquidBalance) ? "text-green-600" : "text-red-600"
                            )}>
                                {lastMonth?.endLiquidBalance > currentLiquidBalance ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                                <span>
                                    {Math.abs(((lastMonth?.endLiquidBalance - currentLiquidBalance) / (currentLiquidBalance || 1)) * 100).toFixed(1)}% до поточного
                                </span>
                            </p>
                        </CardContent>
                    </Card>

                    <Card className="border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50">
                        <CardHeader className="pb-2 flex flex-row items-center justify-between">
                            <CardTitle className="text-sm font-medium text-zinc-500 flex items-center gap-1.5">
                                Гіпотетичні сценарії
                                <TooltipProvider>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <Info className="h-3 w-3 opacity-50 cursor-help" />
                                        </TooltipTrigger>
                                        <TooltipContent>
                                            <p className="max-w-xs text-[10px]">Тимчасові транзакції для симуляції. Не зберігаються в базі.</p>
                                        </TooltipContent>
                                    </Tooltip>
                                </TooltipProvider>
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {/* Add What-if Form */}
                            <div className="space-y-2 p-3 rounded-md bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-100 dark:border-zinc-800">
                                <Input
                                    placeholder="Назва (н-д: Новий проект)"
                                    value={newWhatIf.name}
                                    onChange={(e) => setNewWhatIf(prev => ({ ...prev, name: e.target.value }))}
                                    className="h-8 text-xs font-mono"
                                />
                                <div className="flex gap-2">
                                    <Input
                                        type="number"
                                        placeholder="Сума"
                                        value={newWhatIf.amount}
                                        onChange={(e) => setNewWhatIf(prev => ({ ...prev, amount: e.target.value }))}
                                        className="h-8 text-xs font-mono"
                                    />
                                    <Select
                                        value={newWhatIf.type}
                                        onValueChange={(v: any) => setNewWhatIf(prev => ({ ...prev, type: v }))}
                                    >
                                        <SelectTrigger className="h-8 text-xs w-[100px]">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="income">Дохід</SelectItem>
                                            <SelectItem value="expense">Витрата</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="flex gap-2">
                                    <Popover>
                                        <PopoverTrigger asChild>
                                            <Button variant="outline" size="sm" className="h-8 text-xs flex-1 justify-start">
                                                <Calendar className="mr-2 h-3 w-3" />
                                                {format(newWhatIf.date, "d MMM", { locale: uk })}
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-auto p-0" align="start">
                                            <CalendarComponent
                                                mode="single"
                                                selected={newWhatIf.date}
                                                onSelect={(d) => d && setNewWhatIf(prev => ({ ...prev, date: d }))}
                                                disabled={(d) => d < new Date()}
                                            />
                                        </PopoverContent>
                                    </Popover>
                                    <Button
                                        size="sm"
                                        className="h-8 px-2"
                                        onClick={() => {
                                            if (!newWhatIf.name || !newWhatIf.amount) return;
                                            onWhatIfChange([...whatIfs, { ...newWhatIf, amount: Number(newWhatIf.amount), id: Math.random().toString() }]);
                                            setNewWhatIf({ name: "", amount: "", date: new Date(), type: "expense" });
                                        }}
                                    >
                                        <Plus className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>

                            {/* List of What-ifs */}
                            <div className="space-y-2 max-h-[150px] overflow-y-auto pr-1">
                                {whatIfs.map((w) => (
                                    <div key={w.id} className="flex items-center justify-between p-2 rounded border border-zinc-100 dark:border-zinc-800 text-xs">
                                        <div className="flex-1 min-w-0 mr-2">
                                            <div className="font-medium truncate">{w.name}</div>
                                            <div className="text-[10px] text-zinc-500">
                                                {format(new Date(w.date), "d MMM", { locale: uk })} • {w.type === "income" ? "+" : "-"}{new Intl.NumberFormat('uk-UA').format(w.amount)} ₴
                                            </div>
                                        </div>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="h-6 w-6 p-0 text-zinc-400 hover:text-red-500"
                                            onClick={() => onWhatIfChange(whatIfs.filter(i => i.id !== w.id))}
                                        >
                                            <Trash2 className="h-3 w-3" />
                                        </Button>
                                    </div>
                                ))}
                                {whatIfs.length === 0 && (
                                    <div className="text-[10px] text-center text-zinc-400 py-2 italic">
                                        Додайте гіпотетичну подію
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-zinc-500">Середній потік (міс)</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center justify-between">
                                <div className="text-xs text-zinc-500">Очікуваний дохід</div>
                                <div className="text-sm font-bold text-green-600">
                                    +{new Intl.NumberFormat('uk-UA').format(Math.round(monthly.reduce((ac: number, m: any) => ac + m.income, 0) / monthly.length))} ₴
                                </div>
                            </div>
                            <div className="flex items-center justify-between">
                                <div className="text-xs text-zinc-500">Постійні витрати</div>
                                <div className="text-sm font-bold text-red-600">
                                    -{new Intl.NumberFormat('uk-UA').format(Math.round(monthly.reduce((ac: number, m: any) => ac + m.expense, 0) / monthly.length))} ₴
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>

            <Card className="border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50">
                <CardHeader>
                    <CardTitle className="text-lg font-medium flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        Деталізація симуляції
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Місяць</TableHead>
                                <TableHead className="text-right">Дохід</TableHead>
                                <TableHead className="text-right">Витрати</TableHead>
                                <TableHead className="text-right">Чистий потік</TableHead>
                                <TableHead className="text-right">Ліквідний баланс</TableHead>
                                <TableHead className="text-right">Загальний капітал</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {monthly.map((m, i) => (
                                <TableRow key={i}>
                                    <TableCell className="font-medium capitalize">{m.month}</TableCell>
                                    <TableCell className="text-right text-green-600">+{new Intl.NumberFormat('uk-UA').format(m.income)} ₴</TableCell>
                                    <TableCell className="text-right text-red-600">-{new Intl.NumberFormat('uk-UA').format(m.expense)} ₴</TableCell>
                                    <TableCell className={cn(
                                        "text-right font-bold",
                                        (m.income - m.expense) >= 0 ? "text-zinc-900 dark:text-zinc-50" : "text-red-500"
                                    )}>
                                        {new Intl.NumberFormat('uk-UA').format(m.income - m.expense)} ₴
                                    </TableCell>
                                    <TableCell className={cn(
                                        "text-right font-mono font-bold",
                                        m.endLiquidBalance < 0 ? "text-red-600" : ""
                                    )}>
                                        {new Intl.NumberFormat('uk-UA').format(m.endLiquidBalance)} ₴
                                    </TableCell>
                                    <TableCell className="text-right font-mono text-zinc-500">{new Intl.NumberFormat('uk-UA').format(m.endBalance)} ₴</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}

function cn(...classes: any[]) {
    return classes.filter(Boolean).join(" ");
}
