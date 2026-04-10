"use client";

import * as React from "react";
import { Plus, MoreVertical, Pencil, Archive, ArrowRightLeft } from "lucide-react";
import { Wallet, CreditCard, Banknote, Bitcoin, PiggyBank } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { AccountDialog } from "./account-dialog";
import { TransferDialog } from "./transfer-dialog";
import { deleteAccount } from "@/app/dashboard/finance/phase1-actions";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { uk } from "date-fns/locale";
import { History, RefreshCw } from "lucide-react";
import { BankConnectWidget, BankAccountSyncCard } from "@/modules/bank/BankConnectWidget";

const accountTypeIcons = {
    bank: CreditCard,
    cash: Banknote,
    crypto: Bitcoin,
    savings: PiggyBank,
    default: Wallet,
} as const;

interface AccountManagementProps {
    accounts: any[];
    bankAccounts?: any[]; // records from the new bank module
    onRefresh: () => void;
}

export function AccountManagement({ accounts, bankAccounts = [], onRefresh }: AccountManagementProps) {
    const [accountDialogOpen, setAccountDialogOpen] = React.useState(false);
    const [transferDialogOpen, setTransferDialogOpen] = React.useState(false);
    const [editingAccount, setEditingAccount] = React.useState<any>(null);

    const handleEdit = (account: any) => {
        setEditingAccount(account);
        setAccountDialogOpen(true);
    };

    const handleArchive = async (accountId: string) => {
        try {
            await deleteAccount(accountId);
            onRefresh();
        } catch (error) {
            console.error("Failed to archive account:", error);
        }
    };

    const handleDialogClose = (open: boolean) => {
        if (!open) {
            setEditingAccount(null);
        }
        setAccountDialogOpen(open);
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
                    Рахунки
                </h2>
                <div className="flex gap-2 flex-wrap">
                    <BankConnectWidget onConnected={onRefresh} />
                    <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setTransferDialogOpen(true)}
                        disabled={accounts.length < 2}
                    >
                        <ArrowRightLeft className="h-4 w-4 mr-2" />
                        Трансфер
                    </Button>
                    <Button size="sm" onClick={() => setAccountDialogOpen(true)}>
                        <Plus className="h-4 w-4 mr-2" />
                        Додати рахунок
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {accounts.map((account) => {
                    const TypeIcon =
                        accountTypeIcons[account.type as keyof typeof accountTypeIcons] ||
                        accountTypeIcons.default;

                    const isMonobank = account.type === "bank" && account.id.length > 20;
                    const lastSyncDate = account.lastSyncedAt ? new Date(account.lastSyncedAt) : null;

                    return (
                        <Card
                            key={account.id}
                            className="border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 hover:border-zinc-400 transition-all duration-300 relative overflow-hidden group shadow-sm hover:shadow-md"
                        >
                            {/* Decorative background based on type */}
                            <div
                                className={cn(
                                    "absolute top-0 right-0 w-24 h-24 -mr-8 -mt-8 opacity-5 transition-transform group-hover:scale-110",
                                    account.type === 'bank' ? "text-blue-500" :
                                        account.type === 'cash' ? "text-emerald-500" : "text-zinc-500"
                                )}
                            >
                                <TypeIcon className="w-full h-full" />
                            </div>

                            <div
                                className="absolute top-0 left-0 right-0 h-1"
                                style={{ backgroundColor: account.color || "#18181b" }}
                            />

                            <CardContent className="p-4 relative">
                                <div className="flex items-start justify-between mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className={cn(
                                            "w-10 h-10 rounded-xl flex items-center justify-center shadow-inner",
                                            account.type === 'bank' ? "bg-blue-50 dark:bg-blue-900/20 text-blue-600" :
                                                account.type === 'cash' ? "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600" :
                                                    "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400"
                                        )}>
                                            <TypeIcon className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <div className="font-semibold text-sm text-zinc-900 dark:text-zinc-50 flex items-center gap-1.5">
                                                {account.name}
                                                {isMonobank && (
                                                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" title="Connected to Monobank" />
                                                )}
                                            </div>
                                            <div className="text-[10px] uppercase tracking-wider font-bold text-zinc-400">
                                                {account.type === "bank" && "Банківська карта"}
                                                {account.type === "cash" && "Готівка"}
                                                {account.type === "crypto" && "Крипто-актив"}
                                                {account.type === "savings" && "Скарбничка / Депозит"}
                                                {account.type === "tax" && "Податковий резерв"}
                                            </div>
                                        </div>
                                    </div>

                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 -mr-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                            >
                                                <MoreVertical className="h-4 w-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <DropdownMenuItem onClick={() => handleEdit(account)}>
                                                <Pencil className="h-4 w-4 mr-2" />
                                                Редагувати
                                            </DropdownMenuItem>

                                            <DropdownMenuItem
                                                onClick={() => handleArchive(account.id)}
                                                className="text-red-600"
                                            >
                                                <Archive className="h-4 w-4 mr-2" />
                                                Архівувати
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>

                                <div className="space-y-1 mb-4">
                                    <div className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
                                        {new Intl.NumberFormat("uk-UA", {
                                            minimumFractionDigits: 2,
                                            maximumFractionDigits: 2,
                                        }).format(account.balance)}
                                        <span className="text-sm font-medium ml-1 text-zinc-400">{account.currency}</span>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between pt-2 border-t border-zinc-100 dark:border-zinc-800/50">
                                    <div className="flex items-center gap-1.5">
                                        {isMonobank && (
                                            <div className="flex items-center gap-1 text-[10px] text-zinc-400 uppercase font-medium">
                                                <RefreshCw className="h-2.5 w-2.5" />
                                                {lastSyncDate ? format(lastSyncDate, "HH:mm") : "--:--"}
                                            </div>
                                        )}
                                    </div>
                                    {!account.includeInTotal && (
                                        <div className="text-[10px] text-zinc-400 font-medium uppercase italic">
                                            Off Balance
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    );
                })}
                {accounts.length === 0 && (
                    <Card className="border-dashed border-2 border-zinc-300 dark:border-zinc-700 bg-transparent">
                        <CardContent className="p-6 flex flex-col items-center justify-center text-center h-full min-h-[180px]">
                            <Wallet className="h-8 w-8 text-zinc-400 mb-2" />
                            <p className="text-sm text-zinc-500 mb-3">
                                Немає рахунків
                            </p>
                            <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setAccountDialogOpen(true)}
                            >
                                <Plus className="h-4 w-4 mr-2" />
                                Створити перший рахунок
                            </Button>
                        </CardContent>
                    </Card>
                )}
            </div>

            {/* Monobank Sync Statuses */}
            {bankAccounts.length > 0 && (
                <div className="mt-8 space-y-3">
                    <h3 className="text-sm font-medium text-zinc-500 uppercase tracking-wider px-1">
                        Статус синхронізації Monobank
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {bankAccounts.map((bankAcc) => (
                            <BankAccountSyncCard
                                key={bankAcc.id}
                                account={bankAcc}
                                onRefreshed={onRefresh}
                            />
                        ))}
                    </div>
                </div>
            )}

            <AccountDialog
                open={accountDialogOpen}
                onOpenChange={handleDialogClose}
                account={editingAccount}
                onSuccess={onRefresh}
            />

            <TransferDialog
                open={transferDialogOpen}
                onOpenChange={setTransferDialogOpen}
                accounts={accounts}
                onSuccess={onRefresh}
            />
        </div>
    );
}
