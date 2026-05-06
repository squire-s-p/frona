"use client";

import * as React from "react";
import {
    Search,
    Filter,
    Plus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { TransferDialog } from "./transfer-dialog";
import { getTransfers } from "@/app/dashboard/finance/phase1-actions";

interface TransfersTabProps {
    accounts: Array<{ id: string; name: string; currency: string; balance: number }>;
    onRefresh: () => void;
}

export function TransfersTab({ accounts, onRefresh }: TransfersTabProps) {
    const [transfers, setTransfers] = React.useState<Array<{ id: string; note?: string | null; fromAccount?: { name: string }; toAccount?: { name: string } }>>([]);
    const [_isLoading, setIsLoading] = React.useState(true);
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

    const _filteredTransfers = transfers.filter(t =>
        t.note?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.fromAccount?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.toAccount?.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
                    <Input
                        placeholder="Пошук переказів за назвою або рахунком..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10 bg-white dark:bg-zinc-900/50 border-zinc-200 dark:border-zinc-800"
                    />
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="icon" className="border-zinc-200 dark:border-zinc-800">
                        <Filter className="h-4 w-4 text-zinc-500" />
                    </Button>
                    <Button onClick={() => setTransferDialogOpen(true)}>
                        <Plus className="h-4 w-4 mr-2" />
                        Новий переказ
                    </Button>
                </div>
            </div>


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
