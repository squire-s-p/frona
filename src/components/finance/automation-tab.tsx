"use client";

import React from "react";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "@/components/ui/select";
import {
    Plus,
    Trash2,
    Bot,
    Activity,
    Tag as TagIcon,
    Briefcase,
    Search
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
    createAutomationRule,
    deleteAutomationRule,
    toggleAutomationRule
} from "@/app/dashboard/finance/automation-actions";
import { toast } from "sonner";

interface AutomationRule {
    id: string;
    name: string;
    pattern: string;
    type: string;
    targetId: string;
    isActive: boolean;
    minAmount?: number | null;
    maxAmount?: number | null;
    currency?: string | null;
}

interface AutomationTabProps {
    rules: AutomationRule[];
    categories: any[];
    projects: any[];
    onRefresh: () => void;
}

export function AutomationTab({ rules, categories, projects, onRefresh }: AutomationTabProps) {
    const [newName, setNewName] = React.useState("");
    const [newPattern, setNewPattern] = React.useState("");
    const [newType, setNewType] = React.useState<"category" | "project">("category");
    const [newTargetId, setNewTargetId] = React.useState("");
    const [minAmount, setMinAmount] = React.useState("");
    const [maxAmount, setMaxAmount] = React.useState("");
    const [currency, setCurrency] = React.useState("all");
    const [isSubmitting, setIsSubmitting] = React.useState(false);

    const handleCreate = async () => {
        if (!newName || !newPattern || !newTargetId) {
            toast.error("Будь ласка, заповніть обов'язкові поля (Назва, Ключове слово, Призначення)");
            return;
        }

        setIsSubmitting(true);
        try {
            await createAutomationRule({
                name: newName,
                pattern: newPattern,
                type: newType,
                targetId: newTargetId,
                minAmount: minAmount ? parseFloat(minAmount) : undefined,
                maxAmount: maxAmount ? parseFloat(maxAmount) : undefined,
                currency: currency === "all" ? undefined : currency,
            });
            toast.success("Правило створено");
            setNewName("");
            setNewPattern("");
            setNewTargetId("");
            setMinAmount("");
            setMaxAmount("");
            setCurrency("all");
            onRefresh();
        } catch (error: any) {
            toast.error(`Помилка: ${error.message}`);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async (id: string) => {
        try {
            await deleteAutomationRule(id);
            toast.success("Правило видалено");
            onRefresh();
        } catch (error: any) {
            toast.error(`Помилка: ${error.message}`);
        }
    };

    const handleToggle = async (id: string, current: boolean) => {
        try {
            await toggleAutomationRule(id, !current);
            onRefresh();
        } catch (error: any) {
            toast.error(`Помилка: ${error.message}`);
        }
    };

    return (
        <div className="space-y-6">
            <Card className="border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50">
                <CardHeader>
                    <CardTitle className="text-lg font-medium flex items-center gap-2">
                        <Plus className="h-5 w-5" />
                        Нове правило автоматизації
                    </CardTitle>
                    <CardDescription>Призначити категорію або проект автоматично на основі опису, суми чи валюти транзакції</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="space-y-2">
                            <label className="text-xs font-medium text-zinc-500">Назва *</label>
                            <Input
                                placeholder="Напр: Сільпо"
                                value={newName}
                                onChange={(e) => setNewName(e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-medium text-zinc-500">Ключове слово *</label>
                            <div className="relative">
                                <Search className="absolute left-3 top-2.5 h-4 w-4 text-zinc-400" />
                                <Input
                                    className="pl-9"
                                    placeholder="Що шукаємо в описі?"
                                    value={newPattern}
                                    onChange={(e) => setNewPattern(e.target.value)}
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-medium text-zinc-500">Призначити *</label>
                            <div className="flex gap-2">
                                <Select value={newType} onValueChange={(v: any) => setNewType(v)}>
                                    <SelectTrigger className="w-[120px]">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="category">Категорія</SelectItem>
                                        <SelectItem value="project">Проект</SelectItem>
                                    </SelectContent>
                                </Select>
                                <Select value={newTargetId} onValueChange={setNewTargetId}>
                                    <SelectTrigger className="flex-1">
                                        <SelectValue placeholder="Виберіть..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {newType === "category" ? (
                                            categories.map(c => (
                                                <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                                            ))
                                        ) : (
                                            projects.map(p => (
                                                <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                                            ))
                                        )}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <div className="flex items-end">
                            <Button className="w-full" onClick={handleCreate} disabled={isSubmitting}>
                                <Bot className="h-4 w-4 mr-2" />
                                Додати
                            </Button>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-2 border-t border-zinc-100 dark:border-zinc-800">
                        <div className="space-y-2">
                            <label className="text-xs font-medium text-zinc-500">Мін. сума</label>
                            <Input
                                type="number"
                                placeholder="0"
                                value={minAmount}
                                onChange={(e) => setMinAmount(e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-medium text-zinc-500">Макс. сума</label>
                            <Input
                                type="number"
                                placeholder="необмежено"
                                value={maxAmount}
                                onChange={(e) => setMaxAmount(e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-medium text-zinc-500">Валюта</label>
                            <Select value={currency} onValueChange={setCurrency}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Будь-яка</SelectItem>
                                    <SelectItem value="UAH">UAH</SelectItem>
                                    <SelectItem value="USD">USD</SelectItem>
                                    <SelectItem value="EUR">EUR</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="flex items-end text-[10px] text-zinc-400 italic pb-2">
                            * Додаткові умови дозволяють точніше налаштувати правила.
                        </div>
                    </div>
                </CardContent>
            </Card>

            <div className="space-y-4">
                <h3 className="text-sm font-medium text-zinc-500 flex items-center gap-2">
                    <Activity className="h-4 w-4" />
                    Активні правила ({rules.length})
                </h3>

                {rules.length === 0 ? (
                    <div className="text-center py-12 border border-dashed rounded-lg text-zinc-500">
                        У вас поки немає правил автоматизації
                    </div>
                ) : (
                    rules.map((rule) => {
                        const targetName = rule.type === "category"
                            ? categories.find(c => c.id === rule.targetId)?.name
                            : projects.find(p => p.id === rule.targetId)?.name;

                        return (
                            <Card key={rule.id} className="border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50">
                                <CardContent className="p-4 flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
                                            {rule.type === "category" ? <TagIcon className="h-5 w-5" /> : <Briefcase className="h-5 w-5" />}
                                        </div>
                                        <div>
                                            <div className="font-medium">{rule.name}</div>
                                            <div className="text-xs text-zinc-500 flex flex-wrap items-center gap-x-2 gap-y-1">
                                                <span>Якщо містить</span>
                                                <span className="text-zinc-900 dark:text-zinc-50 font-mono bg-zinc-100 dark:bg-zinc-800 px-1 rounded">"{rule.pattern}"</span>
                                                {rule.currency && (
                                                    <Badge variant="outline" className="text-[10px] h-4 px-1">{rule.currency}</Badge>
                                                )}
                                                {(rule.minAmount !== null || rule.maxAmount !== null) && (
                                                    <span className="text-[10px] bg-zinc-100 dark:bg-zinc-800 px-1 rounded">
                                                        {rule.minAmount !== null && `≥ ${rule.minAmount}`}
                                                        {rule.minAmount !== null && rule.maxAmount !== null && ' і '}
                                                        {rule.maxAmount !== null && `≤ ${rule.maxAmount}`}
                                                    </span>
                                                )}
                                                <span>→</span>
                                                <span className="font-medium text-zinc-900 dark:text-zinc-50">{targetName || "???"}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <Switch
                                            checked={rule.isActive}
                                            onCheckedChange={() => handleToggle(rule.id, rule.isActive)}
                                        />
                                        <Button variant="ghost" size="icon" onClick={() => handleDelete(rule.id)}>
                                            <Trash2 className="h-4 w-4 text-red-500" />
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        );
                    })
                )}
            </div>
        </div>
    );
}
