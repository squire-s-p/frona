"use client";

import React, { useState } from "react";
import { format, differenceInMonths, addMonths } from "date-fns";
import { uk } from "date-fns/locale";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    PiggyBank,
    Target,
    ShieldCheck,
    Palmtree,
    ShoppingBag,
    TrendingUp,
    Coins,
    Calendar,
    Plus,
    MoreHorizontal,
    Trash2,
    Edit2,
    ArrowUpRight,
    AlertCircle,
    CheckCircle2
} from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { createSavingsGoal, updateSavingsGoal, deleteSavingsGoal } from "@/app/dashboard/finance/actions";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface SavingsGoal {
    id: string;
    name: string;
    targetAmount: number;
    currentAmount: number;
    monthlyContribution?: number;
    goalType: string;
    status: string;
    deadline?: Date;
    color?: string;
    accountId?: string;
}

interface GoalsTabProps {
    goals: SavingsGoal[];
    accounts: any[];
    onRefresh: () => void;
}

const GOAL_TYPES = [
    { value: "emergency", label: "Подушка безпеки", icon: ShieldCheck, color: "text-blue-500", bg: "bg-blue-50 dark:bg-blue-900/20" },
    { value: "vacation", label: "Відпустка", icon: Palmtree, color: "text-orange-500", bg: "bg-orange-50 dark:bg-orange-900/20" },
    { value: "purchase", label: "Покупка", icon: ShoppingBag, color: "text-purple-500", bg: "bg-purple-50 dark:bg-purple-900/20" },
    { value: "investment", label: "Інвестиції", icon: TrendingUp, color: "text-emerald-500", bg: "bg-emerald-50 dark:bg-emerald-900/20" },
    { value: "crypto", label: "Крипто", icon: Coins, color: "text-yellow-500", bg: "bg-yellow-50 dark:bg-yellow-900/20" },
    { value: "general", label: "Інше", icon: Target, color: "text-zinc-500", bg: "bg-zinc-50 dark:bg-zinc-900/20" },
];

export function GoalsTab({ goals, accounts, onRefresh }: GoalsTabProps) {
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingGoal, setEditingGoal] = useState<SavingsGoal | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Form State
    const [formData, setFormData] = useState({
        name: "",
        targetAmount: "",
        currentAmount: "0",
        monthlyContribution: "",
        goalType: "general",
        accountId: "none",
        deadline: "",
    });

    const resetForm = () => {
        setFormData({
            name: "",
            targetAmount: "",
            currentAmount: "0",
            monthlyContribution: "",
            goalType: "general",
            accountId: "none",
            deadline: "",
        });
        setEditingGoal(null);
    };

    const handleEdit = (goal: SavingsGoal) => {
        setEditingGoal(goal);
        setFormData({
            name: goal.name,
            targetAmount: goal.targetAmount.toString(),
            currentAmount: goal.currentAmount.toString(),
            monthlyContribution: goal.monthlyContribution?.toString() || "",
            goalType: goal.goalType,
            accountId: goal.accountId || "none",
            deadline: goal.deadline ? format(new Date(goal.deadline), "yyyy-MM-dd") : "",
        });
        setIsDialogOpen(true);
    };

    const handleSubmit = async () => {
        if (!formData.name || !formData.targetAmount) {
            return toast.error("Заповніть обов'язкові поля");
        }

        setIsSubmitting(true);
        const data = {
            name: formData.name,
            targetAmount: Number(formData.targetAmount),
            currentAmount: Number(formData.currentAmount),
            monthlyContribution: formData.monthlyContribution ? Number(formData.monthlyContribution) : undefined,
            goalType: formData.goalType,
            accountId: formData.accountId === "none" ? undefined : formData.accountId,
            deadline: formData.deadline ? new Date(formData.deadline) : undefined,
        };

        try {
            if (editingGoal) {
                await updateSavingsGoal(editingGoal.id, data);
                toast.success("Ціль оновлено");
            } else {
                await createSavingsGoal(data);
                toast.success("Ціль створено");
            }
            setIsDialogOpen(false);
            resetForm();
            onRefresh();
        } catch (error) {
            toast.error("Помилка при збереженні");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Ви впевнені, що хочете видалити цю ціль?")) return;
        try {
            await deleteSavingsGoal(id);
            toast.success("Видалено");
            onRefresh();
        } catch (error) {
            toast.error("Помилка при видаленні");
        }
    };

    const calculateTimeToGoal = (goal: SavingsGoal) => {
        const remaining = goal.targetAmount - goal.currentAmount;
        if (remaining <= 0) return "Досягнуто";

        const monthly = goal.monthlyContribution || 0;
        if (monthly <= 0) return "Встановіть щомісячний внесок";

        const months = Math.ceil(remaining / monthly);
        if (months > 120) return "> 10 років";

        const years = Math.floor(months / 12);
        const remMonths = months % 12;

        let result = "";
        if (years > 0) result += `${years} р. `;
        if (remMonths > 0) result += `${remMonths} міс.`;
        return result || "Менше місяця";
    };

    const getGoalTypeIcon = (type: string) => {
        const goalType = GOAL_TYPES.find(t => t.value === type) || GOAL_TYPES[GOAL_TYPES.length - 1];
        const Icon = goalType.icon;
        return <Icon className={cn("h-4 w-4", goalType.color)} />;
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">Фінансові Цілі</h2>
                    <p className="text-muted-foreground">Керуйте своїми заощадженнями та мріями</p>
                </div>
                <Dialog open={isDialogOpen} onOpenChange={(open) => {
                    setIsDialogOpen(open);
                    if (!open) resetForm();
                }}>
                    <DialogTrigger asChild>
                        <Button className="bg-zinc-900 text-zinc-50 hover:bg-zinc-800 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200">
                            <Plus className="mr-2 h-4 w-4" /> Додати ціль
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[500px]">
                        <DialogHeader>
                            <DialogTitle>{editingGoal ? "Редагувати ціль" : "Створити нову ціль"}</DialogTitle>
                            <DialogDescription>
                                Вкажіть параметри вашої фінансової цілі для відстеження прогресу.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="name" className="text-right text-xs">Назва</Label>
                                <Input id="name" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} className="col-span-3" placeholder="Наприклад: Новий MacBook" />
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="target" className="text-right text-xs">Цільова сума</Label>
                                <Input id="target" type="number" value={formData.targetAmount} onChange={e => setFormData({ ...formData, targetAmount: e.target.value })} className="col-span-3" placeholder="0.00 ₴" />
                            </div>
                            {!formData.accountId || formData.accountId === "none" ? (
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label htmlFor="current" className="text-right text-xs">Вже є</Label>
                                    <Input id="current" type="number" value={formData.currentAmount} onChange={e => setFormData({ ...formData, currentAmount: e.target.value })} className="col-span-3" placeholder="0.00 ₴" />
                                </div>
                            ) : null}
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="monthly" className="text-right text-xs">Внесок/міс</Label>
                                <Input id="monthly" type="number" value={formData.monthlyContribution} onChange={e => setFormData({ ...formData, monthlyContribution: e.target.value })} className="col-span-3" placeholder="Опціонально" />
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label className="text-right text-xs">Тип цілі</Label>
                                <Select value={formData.goalType} onValueChange={v => setFormData({ ...formData, goalType: v })}>
                                    <SelectTrigger className="col-span-3">
                                        <SelectValue placeholder="Оберіть тип" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {GOAL_TYPES.map(t => (
                                            <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label className="text-right text-xs">Рахунок</Label>
                                <Select value={formData.accountId} onValueChange={v => setFormData({ ...formData, accountId: v })}>
                                    <SelectTrigger className="col-span-3">
                                        <SelectValue placeholder="Прив'язати рахунок" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="none">Без прив'язки (ручне керування)</SelectItem>
                                        {accounts.filter(a => a.role !== 'liquid' || a.type === 'savings').map(a => (
                                            <SelectItem key={a.id} value={a.id}>{a.name} ({a.balance.toFixed(0)} {a.currency})</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="deadline" className="text-right text-xs">Дедлайн</Label>
                                <Input id="deadline" type="date" value={formData.deadline} onChange={e => setFormData({ ...formData, deadline: e.target.value })} className="col-span-3" />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Скасувати</Button>
                            <Button onClick={handleSubmit} disabled={isSubmitting} className="bg-zinc-900 text-zinc-50 dark:bg-zinc-50 dark:text-zinc-900">
                                {editingGoal ? "Оновити" : "Створити"}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {goals.map((goal) => {
                    const progress = Math.min((goal.currentAmount / goal.targetAmount) * 100, 100);
                    const isCompleted = progress >= 100;
                    const timeToTarget = calculateTimeToGoal(goal);
                    const typeInfo = GOAL_TYPES.find(t => t.value === goal.goalType) || GOAL_TYPES[GOAL_TYPES.length - 1];

                    return (
                        <Card key={goal.id} className="overflow-hidden border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 group hover:border-zinc-400 dark:hover:border-zinc-600 transition-all">
                            <CardHeader className="pb-2">
                                <div className="flex items-center justify-between mb-2">
                                    <div className={cn("p-2 rounded-lg", typeInfo.bg)}>
                                        <typeInfo.icon className={cn("h-5 w-5", typeInfo.color)} />
                                    </div>
                                    <div className="flex items-center gap-1">
                                        {goal.accountId && (
                                            <Badge variant="outline" className="text-[10px] font-normal border-zinc-200 text-zinc-500">
                                                <ArrowUpRight className="h-2 w-2 mr-1" /> Linked
                                            </Badge>
                                        )}
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                                    <MoreHorizontal className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem onClick={() => handleEdit(goal)}>
                                                    <Edit2 className="h-4 w-4 mr-2" /> Редагувати
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => handleDelete(goal.id)} className="text-red-500">
                                                    <Trash2 className="h-4 w-4 mr-2" /> Видалити
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <CardTitle className="text-lg">{goal.name}</CardTitle>
                                    <CardDescription>{typeInfo.label}</CardDescription>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <div className="flex justify-between text-sm">
                                        <span className="font-bold text-lg">
                                            {new Intl.NumberFormat('uk-UA').format(goal.currentAmount)} ₴
                                        </span>
                                        <span className="text-zinc-400 text-xs self-end pb-1">
                                            з {new Intl.NumberFormat('uk-UA').format(goal.targetAmount)} ₴
                                        </span>
                                    </div>
                                    <Progress
                                        value={progress}
                                        className={cn(
                                            "h-2 bg-zinc-100 dark:bg-zinc-800",
                                            isCompleted ? "[&>div]:bg-green-500" : "[&>div]:bg-zinc-900 dark:[&>div]:bg-zinc-50"
                                        )}
                                    />
                                    <div className="flex justify-between text-[10px] text-zinc-500">
                                        <span>Прогрес: {progress.toFixed(0)}%</span>
                                        {isCompleted ? (
                                            <span className="text-green-600 flex items-center font-bold">
                                                <CheckCircle2 className="h-3 w-3 mr-1" /> Досягнуто!
                                            </span>
                                        ) : (
                                            <span>Залишилось: {new Intl.NumberFormat('uk-UA').format(goal.targetAmount - goal.currentAmount)} ₴</span>
                                        )}
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4 pt-2">
                                    <div className="bg-zinc-50 dark:bg-zinc-800/50 p-2 rounded-md border border-zinc-100 dark:border-zinc-800">
                                        <div className="flex items-center gap-1 text-[10px] text-zinc-500 mb-1">
                                            <Calendar className="h-3 w-3" /> Термін
                                        </div>
                                        <div className="text-xs font-medium">
                                            {goal.deadline ? format(new Date(goal.deadline), "d MMM yyyy", { locale: uk }) : "Не вказано"}
                                        </div>
                                    </div>
                                    <div className="bg-zinc-50 dark:bg-zinc-800/50 p-2 rounded-md border border-zinc-100 dark:border-zinc-800">
                                        <div className="flex items-center gap-1 text-[10px] text-zinc-500 mb-1">
                                            <AlertCircle className="h-3 w-3" /> Прогноз
                                        </div>
                                        <div className="text-xs font-medium">
                                            {isCompleted ? "Готово" : timeToTarget}
                                        </div>
                                    </div>
                                </div>

                                {goal.monthlyContribution && !isCompleted && (
                                    <div className="text-[11px] text-zinc-500 italic text-center">
                                        При внеску {goal.monthlyContribution} ₴/міс
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    );
                })}

                {goals.length === 0 && (
                    <div className="col-span-full h-[300px] flex flex-col items-center justify-center border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-xl space-y-4">
                        <PiggyBank className="h-12 w-12 text-zinc-200 dark:text-zinc-800" />
                        <div className="text-center">
                            <h3 className="font-medium">Ще немає цілей</h3>
                            <p className="text-xs text-zinc-500 max-w-[200px] mx-auto">Додайте свою першу фінансову ціль, щоб почати накопичувати</p>
                        </div>
                        <Button variant="outline" size="sm" onClick={() => setIsDialogOpen(true)}>
                            Створити ціль
                        </Button>
                    </div>
                )}
            </div>
        </div>
    );
}
