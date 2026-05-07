"use client";

import * as React from "react";
import {
    Search,
    Plus,
    ArrowLeftRight,
    Loader2,
} from "lucide-react";
import { format } from "date-fns";
import { uk } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { TransferDialog } from "./transfer-dialog";
import { getTransfers } from "@/app/dashboard/finance/phase1-actions";
import { cn } from "@/lib/utils";

interface TransferRecord {
    id: string;
    fromAccountId: string;
    toAccountId: string;
    amount: number;
    fee: number;
    exchangeRate: number | null;
    note: string | null;
    date: string | Date;
    createdAt: string | Date;
    fromAccount: { id: string; name: string; currency: string };
    toAccount: { id: string; name: string; currency: string };
}

interface TransfersTabProps {
    accounts: Array<{ id: string; name: string; currency: string; balance: number }>;
    onRefresh: () => void;
}

export function TransfersTab({ accounts, onRefresh }: TransfersTabProps) {
    const [transfers, setTransfers] = React.useState<TransferRecord[]>([]);
    const [isLoading, setIsLoading] = React.useState(true);
    const [transferDialogOpen, setTransferDialogOpen] = React.useState(false);
    const [searchQuery, setSearchQuery] = React.useState("");

    const fetchTransfers = React.useCallback(async () => {
        setIsLoading(true);
        try {
            const data = await getTransfers();
            setTransfers(data);
        } catch (error) {
            console.error("Failed to fetch transfers:", error);
        } finally {
            setIsLoading(false);
        }
    }, []);

    React.useEffect(() => {
        fetchTransfers();
    }, [fetchTransfers]);

    const filteredTransfers = transfers.filter(t =>
        t.note?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.fromAccount?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.toAccount?.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
                    <Input
                        placeholder="Пошук переказів..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10 bg-white dark:bg-zinc-900/50 border-zinc-200 dark:border-zinc-800 h-9 text-sm"
                    />
                </div>
                <Button size="sm" className="h-9 text-xs px-3 shadow-none" onClick={() => setTransferDialogOpen(true)}>
                    <Plus className="h-3.5 w-3.5 mr-2" />
                    Новий переказ
                </Button>
            </div>

            {isLoading ? (
                <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
            ) : filteredTransfers.length === 0 ? (
                <div className="text-center py-12 text-zinc-500">
                    {searchQuery ? "Перекази не знайдено" : "Переказів ще немає. Створіть перший!"}
                </div>
            ) : (
                <div className="divide-y divide-zinc-100 dark:divide-zinc-800/50">
                    {filteredTransfers.map((t) => {
                        const date = new Date(t.date);
                        const isCrossCurrency = t.fromAccount.currency !== t.toAccount.currency;
                        return (
                            <div
                                key={t.id}
                                className="p-4 hover:bg-zinc-50 dark:hover:bg-zinc-900/30 transition-all duration-200 flex items-center justify-between"
                            >
                                <div className="flex items-center gap-4">
                                    <div className={cn(
                                        "w-10 h-10 rounded-xl flex items-center justify-center",
                                        "bg-amber-50 dark:bg-amber-900/20 text-amber-600"
                                    )}>
                                        <ArrowLeftRight className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <div className="font-semibold text-sm text-zinc-900 dark:text-zinc-50">
                                            {t.fromAccount.name} → {t.toAccount.name}
                                        </div>
                                        <div className="text-xs text-zinc-400 mt-0.5 flex items-center gap-1.5">
                                            <span>{format(date, "d MMMM yyyy", { locale: uk })}</span>
                                            {t.note && (
                                                <>
                                                    <span className="w-1 h-1 rounded-full bg-zinc-300" />
                                                    <span>{t.note}</span>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="text-sm font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
                                        {new Intl.NumberFormat('uk-UA').format(t.amount)} {t.fromAccount.currency}
                                    </div>
                                    {t.fee > 0 && (
                                        <div className="text-xs text-zinc-400">
                                            Комісія: {new Intl.NumberFormat('uk-UA').format(t.fee)} {t.fromAccount.currency}
                                        </div>
                                    )}
                                    {isCrossCurrency && t.exchangeRate && (
                                        <div className="text-[10px] text-zinc-400">
            Курс: {t.exchangeRate} ({t.fromAccount.currency}→{t.toAccount.currency})
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            <TransferDialog
                open={transferDialogOpen}
                onOpenChange={setTransferDialogOpen}
                accounts={accounts}
                onSuccess={() => {
                    fetchTransfers();
                    onRefresh();
                }}
            />
        </div>
    );
}
