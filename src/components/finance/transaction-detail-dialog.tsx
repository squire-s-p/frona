"use client";

import * as React from "react";
import { format } from "date-fns";
import { uk } from "date-fns/locale";
import {
    Loader2,
    Calendar,
    Tag,
    Briefcase,
    CreditCard,
    ArrowUpRight,
    ArrowDownLeft,
    Check,
    MessageSquare,
    ArrowLeftRight,
} from "lucide-react";

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { Checkbox } from "@/components/ui/checkbox";
import { updateTransactionDetails, applySmartCategorization } from "@/app/dashboard/finance/actions";
import { toast } from "sonner";

interface TransactionDetailDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    transaction: any;
    categories: any[];
    projects: any[];
    onSuccess?: () => void;
}

export function TransactionDetailDialog({
    open,
    onOpenChange,
    transaction,
    categories,
    projects,
    onSuccess,
}: TransactionDetailDialogProps) {
    const [isSaving, setIsSaving] = React.useState(false);
    const [selectedCategoryId, setSelectedCategoryId] = React.useState<string>("");
    const [selectedProjectId, setSelectedProjectId] = React.useState<string>("none");
    const [note, setNote] = React.useState<string>("");
    const [applyToAll, setApplyToAll] = React.useState(false);

    React.useEffect(() => {
        if (transaction) {
            setSelectedCategoryId(transaction.category?.id || transaction.categoryId || "");
            setSelectedProjectId(transaction.projectId || "none");
            setNote(transaction.note || transaction.description || "");
            setApplyToAll(false);
        }
    }, [transaction]);

    if (!transaction) return null;

    const handleSave = async () => {
        setIsSaving(true);
        try {
            // Оновлюємо поточну транзакцію
            const res = await updateTransactionDetails(transaction.id, {
                categoryId: selectedCategoryId,
                projectId: selectedProjectId,
                note: note,
            });

            if (res.success) {
                // Якщо обрано "Застосувати до всіх", викликаємо смарт-екшн
                if (applyToAll && transaction.description) {
                    await applySmartCategorization({
                        description: transaction.description,
                        categoryId: selectedCategoryId,
                        projectId: selectedProjectId === "none" ? null : selectedProjectId,
                    });
                    toast.success(`Правило створено та застосовано до транзакцій "${transaction.description}"`);
                } else {
                    toast.success("Дані оновлено");
                }
                onOpenChange(false);
                onSuccess?.();
            } else {
                toast.error("Помилка оновлення: " + res.error);
            }
        } catch (error) {
            toast.error("Сталася помилка");
        } finally {
            setIsSaving(false);
        }
    };

    const isTransfer = transaction.type === "transfer" || transaction.isTransfer;
    const isIncome = transaction.type === "income";

    // Show all categories instead of filtering by type to avoid hiding options
    const displayCategories = [...categories].sort((a, b) => a.name.localeCompare(b.name));

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent
                showCloseButton={false}
                className="sm:max-w-[440px] p-0 overflow-hidden border-zinc-200 dark:border-zinc-800 rounded-2xl gap-0"
            >
                {/* Header with very light background */}
                <div className={cn(
                    "relative p-6 pt-10",
                    isIncome
                        ? "bg-emerald-500/[0.03] dark:bg-emerald-500/10"
                        : isTransfer
                            ? "bg-amber-500/[0.03] dark:bg-amber-500/10"
                            : "bg-zinc-500/[0.03] dark:bg-zinc-500/10"
                )}>
                    {/* Background blob - subtle shadow */}
                    <div className={cn(
                        "absolute -top-40 -left-40 w-96 h-96 blur-[120px] opacity-20 rounded-full",
                        isIncome ? "bg-emerald-500" : isTransfer ? "bg-amber-500" : "bg-zinc-500"
                    )} />

                    <div className="relative z-10">
                        <DialogHeader className="space-y-1">
                            <DialogDescription className="text-[10px] uppercase font-bold tracking-[0.2em] text-zinc-400">
                                Деталі транзакції
                            </DialogDescription>
                            <DialogTitle className="text-xl font-bold text-zinc-900 dark:text-zinc-50 leading-tight">
                                {transaction.description || (isIncome ? "Дохід" : isTransfer ? "Переказ" : "Витрата")}
                            </DialogTitle>
                        </DialogHeader>

                        <div className="mt-8 flex items-end justify-between">
                            <div className={cn(
                                "text-4xl font-black tracking-tighter flex items-baseline gap-1.5",
                                isIncome ? "text-emerald-500 dark:text-emerald-400" : "text-zinc-900 dark:text-zinc-50"
                            )}>
                                <span>{isIncome ? '+' : isTransfer ? '' : '-'}{new Intl.NumberFormat('uk-UA').format(Math.abs(transaction.amount))}</span>
                                <span className="text-xl font-medium opacity-30">₴</span>
                            </div>

                            <div className={cn(
                                "w-10 h-10 rounded-xl flex items-center justify-center shadow-sm border border-black/[0.03] dark:border-white/[0.03]",
                                isIncome
                                    ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                                    : isTransfer
                                        ? "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                                        : "bg-zinc-500/10 text-zinc-600 dark:text-zinc-400"
                            )}>
                                {isIncome ? <ArrowUpRight className="w-5 h-5" /> : isTransfer ? <ArrowLeftRight className="w-5 h-5" /> : <ArrowDownLeft className="w-5 h-5" />}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Content 영역 */}
                <div className="p-6 space-y-6 bg-white dark:bg-[#09090b] border-t border-zinc-100 dark:border-zinc-800/60">
                    <div className="grid grid-cols-2 gap-8">
                        <div className="space-y-1">
                            <div className="text-[10px] uppercase font-bold text-zinc-400 flex items-center gap-2">
                                <Calendar className="w-3 h-3 opacity-60" />
                                Дата
                            </div>
                            <p className="text-xs font-bold text-zinc-900 dark:text-zinc-50">
                                {format(new Date(transaction.date), 'd MMM yyyy, HH:mm', { locale: uk })}
                            </p>
                        </div>
                        <div className="space-y-1">
                            <div className="text-[10px] uppercase font-bold text-zinc-400 flex items-center gap-2">
                                <CreditCard className="w-3 h-3 opacity-60" />
                                Рахунок
                            </div>
                            <p className="text-xs font-bold text-zinc-900 dark:text-zinc-50 italic">
                                {transaction.account?.name || "Невідомо"}
                            </p>
                        </div>
                    </div>

                    <div className="space-y-5">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <Label className="text-[10px] uppercase font-bold text-zinc-400 flex items-center gap-2">
                                    <Tag className="w-3 h-3 opacity-60" />
                                    Категорія
                                </Label>
                                <Select value={selectedCategoryId} onValueChange={setSelectedCategoryId}>
                                    <SelectTrigger className="w-full h-8 px-3 rounded-lg border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 text-[11px] font-medium text-zinc-600 dark:text-zinc-400 focus:ring-0 shadow-none">
                                        <SelectValue placeholder="Категорія" />
                                    </SelectTrigger>
                                    <SelectContent className="rounded-xl border-zinc-100 dark:border-zinc-800">
                                        {displayCategories.map((cat) => (
                                            <SelectItem key={cat.id} value={cat.id} className="rounded-lg text-xs">
                                                {cat.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-1.5">
                                <Label className="text-[10px] uppercase font-bold text-zinc-400 flex items-center gap-2">
                                    <Briefcase className="w-3 h-3 opacity-60" />
                                    Проєкт
                                </Label>
                                <Select value={selectedProjectId} onValueChange={setSelectedProjectId}>
                                    <SelectTrigger className="w-full h-8 px-3 rounded-lg border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 text-[11px] font-medium text-zinc-600 dark:text-zinc-400 focus:ring-0 shadow-none">
                                        <SelectValue placeholder="Проєкт" />
                                    </SelectTrigger>
                                    <SelectContent className="rounded-xl border-zinc-100 dark:border-zinc-800">
                                        <SelectItem value="none" className="rounded-lg text-xs">Без проєкту</SelectItem>
                                        {projects.map((proj) => (
                                            <SelectItem key={proj.id} value={proj.id} className="rounded-lg text-xs">
                                                {proj.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <Label className="text-[10px] uppercase font-bold text-zinc-400 flex items-center gap-2">
                                <MessageSquare className="w-3 h-3 opacity-60" />
                                Примітка
                            </Label>
                            <Textarea
                                value={note}
                                onChange={(e) => setNote(e.target.value)}
                                placeholder="Додайте опис..."
                                className="min-h-[70px] rounded-xl border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 text-xs py-2 px-3 resize-none focus:ring-0 shadow-none font-medium"
                            />
                        </div>

                        {/* Apply to all similar toggle */}
                        {!isTransfer && transaction.description && (
                            <div className="flex items-center space-x-2 pt-1">
                                <Checkbox
                                    id="applyToAll"
                                    checked={applyToAll}
                                    onCheckedChange={(checked) => setApplyToAll(checked as boolean)}
                                    className="border-zinc-300 dark:border-zinc-700 data-[state=checked]:bg-zinc-900 dark:data-[state=checked]:bg-zinc-100 dark:data-[state=checked]:text-zinc-900"
                                />
                                <Label
                                    htmlFor="applyToAll"
                                    className="text-[11px] font-medium text-zinc-500 cursor-pointer select-none"
                                >
                                    Застосувати до всіх "{transaction.description}" (та створити правило)
                                </Label>
                            </div>
                        )}
                    </div>

                    <DialogFooter className="flex items-center justify-end gap-2 pt-2">
                        <Button
                            variant="ghost"
                            onClick={() => onOpenChange(false)}
                            className="h-8 px-4 rounded-lg text-xs font-bold text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
                        >
                            Скасувати
                        </Button>
                        <Button
                            onClick={handleSave}
                            disabled={isSaving}
                            className="h-8 px-6 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 hover:bg-zinc-200 dark:hover:bg-zinc-700 font-bold border border-zinc-200 dark:border-zinc-700 transition-all active:scale-95 text-xs shadow-sm"
                        >
                            {isSaving ? (
                                <Loader2 className="w-3 h-3 animate-spin" />
                            ) : (
                                <>
                                    <Check className="w-3 h-3 mr-1.5 stroke-[3]" />
                                    Зберегти
                                </>
                            )}
                        </Button>
                    </DialogFooter>
                </div>
            </DialogContent>
        </Dialog>
    );
}
