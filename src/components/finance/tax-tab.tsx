"use client";

import React from "react";
import { toast } from "sonner";
import { moveToTaxReserve } from "@/app/dashboard/finance/tax-actions";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription
} from "@/components/ui/card";
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip as RechartsTooltip,
    ResponsiveContainer,
    Legend
} from "recharts";
import {
    Calendar,
    Receipt,
    TrendingUp,
    AlertCircle,
    Coins,
    ShieldCheck,
    ArrowRightLeft,
    Wallet
} from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "@/components/ui/select";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface TaxStats {
    yearly: {
        income: number;
        taxableIncome: number;
        tax5: number;
        tax1: number;
        esv: number;
        totalTax: number;
        paid: number;
    };
    quarterly: {
        income: number;
        taxableIncome: number;
        tax5: number;
        tax1: number;
        esv: number;
        totalTax: number;
        paid: number;
    };
    limit: {
        total: number;
        current: number;
        percentage: number;
    };
    reserve: {
        balance: number;
        gap: number;
        accountId: string | null;
    };
    paidByQuarter: number[];
    payments: {
        id: string;
        amount: number;
        date: Date;
        description: string;
        note: string | null;
        quarter: number;
        year: number;
    }[];
    previousQuarter: {
        quarter: number;
        year: number;
        taxableIncome: number;
        totalTax: number;
        paid: number;
        debt: number;
    };
    chartData: Array<{ quarter: string; tax: number; paid: number }>;
}

interface TaxTabProps {
    data: TaxStats | null;
    accounts: Array<{ id: string; name: string; currency: string; balance: number; role?: string }>;
    onSuccess?: () => void;
}

export function TaxTab({ data, accounts, onSuccess }: TaxTabProps) {
    const [isMoveDialogOpen, setIsMoveDialogOpen] = React.useState(false);
    const [moveAmount, setMoveAmount] = React.useState("");
    const [sourceAccountId, setSourceAccountId] = React.useState("");
    const [isMoving, setIsMoving] = React.useState(false);

    if (!data) return (
        <div className="h-[400px] flex items-center justify-center text-zinc-500">
            Завантаження податкових даних...
        </div>
    );

    const { yearly, quarterly, limit, reserve, chartData } = data;

    const handleMoveToReserve = async () => {
        if (!sourceAccountId || !moveAmount) {
            toast.error("Будь ласка, виберіть рахунок та введіть суму");
            return;
        }

        setIsMoving(true);
        try {
            await moveToTaxReserve(Number(moveAmount), sourceAccountId);
            toast.success("Кошти переказано у резерв");
            setIsMoveDialogOpen(false);
            setMoveAmount("");
            if (onSuccess) onSuccess();
        } catch (error: unknown) {
            toast.error(error instanceof Error ? error.message : "Помилка при переказі");
        } finally {
            setIsMoving(false);
        }
    };

    const openMoveDialog = (amount?: number) => {
        if (amount) setMoveAmount(amount.toString());
        setIsMoveDialogOpen(true);
    };

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-zinc-500 flex items-center gap-2">
                            <Receipt className="h-4 w-4" />
                            Податки (Квартал)
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center justify-between">
                            <div>
                                <div className="text-2xl font-bold">{new Intl.NumberFormat('uk-UA').format(Math.round(quarterly.tax5 + quarterly.tax1))} ₴</div>
                                <p className="text-xs text-zinc-500 mt-1">5% ({Math.round(quarterly.tax5)} ₴) + 1% ({Math.round(quarterly.tax1)} ₴)</p>
                            </div>
                            <div className="text-right">
                                <div className={cn("text-xs font-medium", quarterly.paid >= (quarterly.tax5 + quarterly.tax1) ? "text-green-600" : "text-zinc-500")}>
                                    Сплачено: {new Intl.NumberFormat('uk-UA').format(Math.round(quarterly.paid))} ₴
                                </div>
                                {quarterly.paid < (quarterly.tax5 + quarterly.tax1) && (
                                    <div className="text-[10px] text-red-600">
                                        Залишок: {new Intl.NumberFormat('uk-UA').format(Math.round(quarterly.tax5 + quarterly.tax1 - quarterly.paid))} ₴
                                    </div>
                                )}
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-zinc-500 flex items-center gap-2">
                            <ShieldCheck className="h-4 w-4" />
                            Всього за рік
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center justify-between">
                            <div>
                                <div className="text-2xl font-bold">{new Intl.NumberFormat('uk-UA').format(Math.round(yearly.totalTax))} ₴</div>
                                <p className="text-xs text-zinc-500 mt-1">Податки ({Math.round(yearly.tax5 + yearly.tax1)} ₴) + ЄСВ ({yearly.esv} ₴)</p>
                            </div>
                            <div className="text-right text-xs font-medium text-zinc-500">
                                Всього сплачено: {new Intl.NumberFormat('uk-UA').format(Math.round(yearly.paid))} ₴
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-zinc-500 flex items-center gap-2">
                            <Wallet className="h-4 w-4" />
                            Податковий резерв
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center justify-between">
                            <div>
                                <div className="text-2xl font-bold">{new Intl.NumberFormat('uk-UA').format(Math.round(reserve.balance))} ₴</div>
                                {reserve.gap > 0 ? (
                                    <p className="text-xs text-red-600 mt-1 flex items-center gap-1 font-medium">
                                        <AlertCircle className="h-3 w-3" />
                                        Дефіцит: {new Intl.NumberFormat('uk-UA').format(Math.round(reserve.gap))} ₴
                                    </p>
                                ) : (
                                    <p className="text-xs text-green-600 mt-1 flex items-center gap-1 font-medium">
                                        <ShieldCheck className="h-3 w-3" />
                                        Покриває квартал
                                    </p>
                                )}
                            </div>
                            <Button
                                size="sm"
                                variant="outline"
                                className="h-8 text-xs gap-1.5"
                                onClick={() => openMoveDialog(reserve.gap > 0 ? Math.round(reserve.gap) : 0)}
                            >
                                <ArrowRightLeft className="h-3 w-3" />
                                Поповнити
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {data.previousQuarter?.debt > 0 && (
                <Card className="border-red-200 dark:border-red-900/50 bg-red-50/50 dark:bg-red-900/10">
                    <CardContent className="py-4 flex flex-col md:flex-row items-center justify-between gap-4">
                        <div className="flex items-start gap-3">
                            <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
                            <div>
                                <h3 className="text-sm font-bold text-red-900 dark:text-red-400">
                                    У вас є заборгованість за {data.previousQuarter.quarter} квартал {data.previousQuarter.year} року
                                </h3>
                                <p className="text-xs text-red-700 dark:text-red-500 mt-1">
                                    Нараховано: {new Intl.NumberFormat('uk-UA').format(Math.round(data.previousQuarter.totalTax))} ₴.
                                    Сплачено: {new Intl.NumberFormat('uk-UA').format(Math.round(data.previousQuarter.paid))} ₴.
                                    Залишок до сплати: <span className="font-bold underline">{new Intl.NumberFormat('uk-UA').format(Math.round(data.previousQuarter.debt))} ₴</span>.
                                </p>
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <p className="text-[10px] text-zinc-500 max-w-[200px] text-center md:text-left">
                                *Якщо ви вже оплатили цей податок, призначте транзакції категорію &quot;Податки&quot; та вкажіть у нотатці &quot;{data.previousQuarter.quarter} кв {data.previousQuarter.year}&quot;.
                            </p>
                        </div>
                    </CardContent>
                </Card>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card className="lg:col-span-2 border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50">
                    <CardHeader>
                        <CardTitle className="text-lg font-medium">Динаміка доходів та податків</CardTitle>
                        <CardDescription>Розподіл нарахованих податків по місяцях</CardDescription>
                    </CardHeader>
                    <CardContent className="h-[350px] pt-4">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={chartData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e4e4e7" opacity={0.5} />
                                <XAxis
                                    dataKey="name"
                                    axisLine={false}
                                    tickLine={false}
                                    stroke="#71717a"
                                    fontSize={12}
                                />
                                <YAxis
                                    axisLine={false}
                                    tickLine={false}
                                    stroke="#71717a"
                                    fontSize={12}
                                    tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
                                />
                                <RechartsTooltip
                                    cursor={{ fill: '#f4f4f5', opacity: 0.1 }}
                                    contentStyle={{ backgroundColor: '#18181b', border: 'none', borderRadius: '8px', color: '#f4f4f5' }}
                                    itemStyle={{ color: '#f4f4f5' }}
                                />
                                <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px' }} />
                                <Bar dataKey="income" name="Дохід" fill="#18181b" radius={[4, 4, 0, 0]} />
                                <Bar dataKey="tax" name="Податки (6%)" fill="#71717a" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                <div className="space-y-6">
                    <Card className="border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-zinc-500 flex items-center gap-2">
                                <Calendar className="h-4 w-4" />
                                Ліміт ФОП 3 групи
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center justify-between mb-2">
                                <div className="text-lg font-bold">{limit.percentage.toFixed(1)}%</div>
                                <div className="text-xs text-zinc-500">ліміт: {new Intl.NumberFormat('uk-UA').format(limit.total)} ₴</div>
                            </div>
                            <Progress value={limit.percentage} className="h-2 bg-zinc-100 dark:bg-zinc-800" />
                        </CardContent>
                    </Card>

                    <Card className="border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50">
                        <CardHeader>
                            <CardTitle className="text-md font-medium">Пам&apos;ятка платника</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="p-3 rounded-lg bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-100 dark:border-zinc-700">
                                <h4 className="text-sm font-bold flex items-center gap-2 mb-1">
                                    <Coins className="h-4 w-4 text-zinc-900 dark:text-zinc-50" />
                                    ЄП 5% та ВЗ 1%
                                </h4>
                                <p className="text-xs text-zinc-500">
                                    Сплачуються щоквартально протягом 40 днів після закінчення кварталу (разом 6% від доходу).
                                </p>
                            </div>
                            <div className="p-3 rounded-lg bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-100 dark:border-zinc-700">
                                <h4 className="text-sm font-bold flex items-center gap-2 mb-1">
                                    <TrendingUp className="h-4 w-4 text-zinc-900 dark:text-zinc-50" />
                                    ЄСВ (5280 ₴)
                                </h4>
                                <p className="text-xs text-zinc-500">
                                    Фіксована сума 5280 ₴ за квартал. Сплачується до 20 числа місяця після завершення кварталу.
                                </p>
                            </div>
                            <div className="p-4 rounded-lg bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/30 flex gap-3 mt-4">
                                <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
                                <div>
                                    <h4 className="text-xs font-bold text-red-900 dark:text-red-400 mb-1">Нагадування</h4>
                                    <p className="text-[10px] text-red-600 dark:text-red-500">
                                        Наступний термін звітування: 1-10 число наступного місяця після завершення кварталу.
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-6">
                <Card className="border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <div>
                            <CardTitle className="text-lg font-medium">Історія податкових платежів</CardTitle>
                            <CardDescription>Всі транзакції з категорією &quot;Податки&quot;</CardDescription>
                        </div>
                        <div className="flex gap-2 text-xs font-medium">
                            {data.paidByQuarter.map((amount, idx) => (
                                <div key={idx} className="bg-zinc-100 dark:bg-zinc-800 px-2 py-1 rounded">
                                    {idx + 1}кв: {new Intl.NumberFormat('uk-UA').format(Math.round(amount))} ₴
                                </div>
                            ))}
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="relative w-full overflow-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="w-[100px]">Дата</TableHead>
                                        <TableHead>Опис</TableHead>
                                        <TableHead>За період</TableHead>
                                        <TableHead className="text-right">Сума</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {data.payments.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={4} className="h-24 text-center text-zinc-500">
                                                Жодних платежів не знайдено. Призначте категорію &quot;Податки&quot; транзакції в історії.
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        data.payments.map((p) => (
                                            <TableRow key={p.id}>
                                                <TableCell>{new Date(p.date).toLocaleDateString('uk-UA')}</TableCell>
                                                <TableCell>
                                                    <div className="font-medium text-zinc-900 dark:text-zinc-50">{p.description}</div>
                                                    {p.note && <div className="text-xs text-zinc-500">{p.note}</div>}
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant="secondary" className="font-medium">
                                                        {p.quarter} квартал {p.year}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-right font-bold">
                                                    {new Intl.NumberFormat('uk-UA').format(p.amount)} ₴
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Dialog open={isMoveDialogOpen} onOpenChange={setIsMoveDialogOpen}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>Поповнити податковий резерв</DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="source">Джерело коштів</Label>
                            <Select onValueChange={setSourceAccountId} value={sourceAccountId}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Виберіть рахунок" />
                                </SelectTrigger>
                                <SelectContent>
                                    {accounts
                                        ?.filter(acc => acc.id !== reserve.accountId)
                                        .map(acc => (
                                            <SelectItem key={acc.id} value={acc.id}>
                                                {acc.name} ({new Intl.NumberFormat('uk-UA').format(acc.balance)} ₴)
                                            </SelectItem>
                                        ))
                                    }
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="amount">Сума (₴)</Label>
                            <Input
                                id="amount"
                                type="number"
                                value={moveAmount}
                                onChange={(e) => setMoveAmount(e.target.value)}
                                placeholder="0.00"
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsMoveDialogOpen(false)}>
                            Скасувати
                        </Button>
                        <Button
                            onClick={handleMoveToReserve}
                            disabled={isMoving || !moveAmount || !sourceAccountId}
                            className="bg-zinc-900 text-zinc-50 dark:bg-zinc-50 dark:text-zinc-900"
                        >
                            {isMoving ? "Переказ..." : "Підтвердити переказ"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
