"use client";

import * as React from "react";
import { useState } from "react";
import { format } from "date-fns";
import { uk } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import {
    CalendarClock, Plus, Trash2, CheckCircle2, Circle, ExternalLink,
    TrendingUp, UserCheck, Link as LinkIcon,
    ChevronDown, ChevronUp, Trash, PlusCircle
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import {
    AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
    deleteRecurringPayment,
    createShoppingItem, deleteShoppingItem, toggleShoppingItemStatus, addShoppingLink, deleteShoppingLink
} from "@/app/dashboard/finance/actions";
import { RecurringPaymentDialog } from "./recurring-payment-dialog";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type ShoppingItem = { id: string; name: string; url?: string | null; price?: number | null; status?: string; links?: Array<{ id: string; url: string }> };

interface PlanningTabProps {
    payments: any[];
    shoppingItems?: ShoppingItem[];
    accounts: Array<{ id: string; name: string; currency: string }>;
    onRefresh: () => void;
}

export function PlanningTab({ payments, shoppingItems = [], accounts, onRefresh }: PlanningTabProps) {
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Payment Dialog State
    const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);

    // Shopping Dialog State
    const [isShoppingDialogOpen, setIsShoppingDialogOpen] = useState(false);
    const [shopName, setShopName] = useState("");
    const [shopUrl, setShopUrl] = useState("");
    const [shopPrice, setShopPrice] = useState("");

    // Multi-link State
    const [expandedItemId, setExpandedItemId] = useState<string | null>(null);
    const [newLinkUrl, setNewLinkUrl] = useState("");

    // Delete Alert State
    const [deleteId, setDeleteId] = useState<string | null>(null);
    const [deleteType, setDeleteType] = useState<"payment" | "shopping" | null>(null);

    const resetForms = () => {
        setShopName(""); setShopUrl(""); setShopPrice("");
        setIsSubmitting(false);
    };

    const handleCreateShoppingItem = async () => {
        if (!shopName) return toast.error("Введіть назву");
        setIsSubmitting(true);
        try {
            await createShoppingItem({ name: shopName, url: shopUrl || undefined, price: shopPrice ? Number(shopPrice) : undefined });
            toast.success("Додано"); onRefresh(); setIsShoppingDialogOpen(false); resetForms();
        } catch { toast.error("Помилка"); } finally { setIsSubmitting(false); }
    };

    const handleToggleShopStatus = async (item: ShoppingItem) => {
            try { await toggleShoppingItemStatus(item.id, item.status ?? ""); onRefresh(); } catch { toast.error("Помилка"); }
    };

    const handleAddLink = async (itemId: string) => {
        if (!newLinkUrl) return;
        try { await addShoppingLink(itemId, newLinkUrl); toast.success("Посилання додано"); setNewLinkUrl(""); onRefresh(); } catch { toast.error("Помилка"); }
    };

    const handleDeleteLink = async (linkId: string) => {
        try { await deleteShoppingLink(linkId); toast.success("Видалено"); onRefresh(); } catch { toast.error("Помилка"); }
    };

    const confirmDelete = async () => {
        if (!deleteId || !deleteType) return;
        try {
            if (deleteType === "payment") await deleteRecurringPayment(deleteId);
            else if (deleteType === "shopping") await deleteShoppingItem(deleteId);
            toast.success("Видалено"); onRefresh();
        } catch { toast.error("Помилка"); } finally { setDeleteId(null); setDeleteType(null); }
    };

    return (
        <div className="space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Recurring Payments Table */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50 flex items-center gap-2">
                            <CalendarClock className="w-4 h-4" /> Регулярні платежі
                        </h3>
                        <RecurringPaymentDialog
                            open={isPaymentDialogOpen}
                            onOpenChange={setIsPaymentDialogOpen}
                            accounts={accounts}
                            onSuccess={onRefresh}
                        />
                    </div>
                    <div className="rounded-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 overflow-hidden">
                        <Table>
                            <TableHeader>
                                <TableRow className="hover:bg-transparent">
                                    <TableHead>Назва</TableHead>
                                    <TableHead>Дата</TableHead>
                                    <TableHead className="text-right">Сума</TableHead>
                                    <TableHead className="w-[50px]"></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {payments.length === 0 && <TableRow><TableCell colSpan={4} className="text-center text-zinc-500 py-8">Немає запланованих платежів</TableCell></TableRow>}
                                {payments.map(p => (
                                    <TableRow key={p.id} className="group">
                                        <TableCell className="font-medium">
                                            <div className="flex items-center gap-2">
                                                {p.name}
                                                {p.affectsForecast && (
                                                    <span title="Впливає на прогноз">
                                                        <TrendingUp className="w-3 h-3 text-blue-500" />
                                                    </span>
                                                )}
                                                {p.isExpectedIncome && (
                                                    <span title="Очікуваний дохід">
                                                        <UserCheck className="w-3 h-3 text-yellow-500" />
                                                    </span>
                                                )}
                                            </div>
                                            <div className="text-[10px] text-zinc-400 capitalize">{p.frequency}</div>
                                        </TableCell>
                                        <TableCell>{format(new Date(p.nextPaymentDate), "d MMM", { locale: uk })}</TableCell>
                                        <TableCell className="text-right font-mono">
                                            <span className={p.amount > 0 ? "text-emerald-600" : "text-zinc-900 dark:text-zinc-100"}>
                                                {new Intl.NumberFormat('uk-UA').format(p.amount)} ₴
                                            </span>
                                        </TableCell>
                                        <TableCell>
                                            <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100" onClick={() => { setDeleteId(p.id); setDeleteType("payment"); }}>
                                                <Trash2 className="w-3 h-3 text-zinc-400 hover:text-red-500" />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                </div>

                {/* Shopping List Table */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50 flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4" /> Список покупок
                        </h3>
                        <Dialog open={isShoppingDialogOpen} onOpenChange={setIsShoppingDialogOpen}>
                            <DialogTrigger asChild>
                                <Button variant="outline" size="sm" className="h-8 border-zinc-200 dark:border-zinc-800"><Plus className="w-3 h-3 mr-1" /> Додати</Button>
                            </DialogTrigger>
                            <DialogContent>
                                <DialogHeader><DialogTitle>Нова покупка</DialogTitle></DialogHeader>
                                <div className="grid gap-4 py-4">
                                    <div className="grid gap-2"><Label>Назва</Label><Input value={shopName} onChange={e => setShopName(e.target.value)} /></div>
                                    <div className="grid gap-2"><Label>URL (опціонально)</Label><Input value={shopUrl} onChange={e => setShopUrl(e.target.value)} /></div>
                                    <div className="grid gap-2"><Label>Ціна (орієнтовно)</Label><Input type="number" value={shopPrice} onChange={e => setShopPrice(e.target.value)} /></div>
                                </div>
                                <DialogFooter><Button onClick={handleCreateShoppingItem} disabled={isSubmitting}>Додати</Button></DialogFooter>
                            </DialogContent>
                        </Dialog>
                    </div>
                    <div className="rounded-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 overflow-hidden">
                        <Table>
                            <TableHeader>
                                <TableRow className="hover:bg-transparent">
                                    <TableHead className="w-[30px]"></TableHead>
                                    <TableHead>Товар</TableHead>
                                    <TableHead className="text-right">Ціна</TableHead>
                                    <TableHead className="w-[50px]"></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {shoppingItems.length === 0 && <TableRow><TableCell colSpan={4} className="text-center text-zinc-500 py-8">Ваш список покупок порожній</TableCell></TableRow>}
                                {shoppingItems.map(item => (
                                    <React.Fragment key={item.id}>
                                        <TableRow className="group hover:bg-zinc-50 dark:hover:bg-zinc-900/50">
                                            <TableCell>
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="icon-sm"
                                                    onClick={() => handleToggleShopStatus(item)}
                                                    className="h-7 w-7 text-zinc-400 hover:text-foreground"
                                                >
                                                    {item.status === "BOUGHT" ? <CheckCircle2 className="w-4 h-4 text-foreground" /> : <Circle className="w-4 h-4" />}
                                                </Button>
                                            </TableCell>
                                            <TableCell>
                                                <div className={cn("font-medium text-sm cursor-pointer hover:underline decoration-zinc-400", item.status === "BOUGHT" && "line-through text-zinc-400")} onClick={() => setExpandedItemId(expandedItemId === item.id ? null : item.id)}>
                                                    {item.name}
                                                </div>
                                                <div className="flex items-center gap-2 mt-0.5">
                                                    {(item.links?.length ?? 0) > 0 && <Badge variant="secondary" className="text-[10px] h-4 px-1 rounded-sm text-zinc-500">{item.links?.length} посилань</Badge>}
                                                    {item.url && !item.links?.length && (
                                                        <a href={item.url} target="_blank" rel="noreferrer" className="text-[10px] text-zinc-400 hover:underline flex items-center gap-1">
                                                            <ExternalLink className="w-3 h-3" /> Link
                                                        </a>
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-right font-mono text-sm">
                                                {item.price ? `${new Intl.NumberFormat('uk-UA').format(item.price)} ₴` : '-'}
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex gap-1">
                                                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setExpandedItemId(expandedItemId === item.id ? null : item.id)}>
                                                        {expandedItemId === item.id ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                                                    </Button>
                                                    <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100" onClick={() => { setDeleteId(item.id); setDeleteType("shopping"); }}>
                                                        <Trash2 className="w-3 h-3 text-zinc-400 hover:text-red-500" />
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                        {expandedItemId === item.id && (
                                            <TableRow className="bg-zinc-50/50 dark:bg-zinc-900/20 hover:bg-zinc-50/50">
                                                <TableCell colSpan={4} className="p-4 pt-0">
                                                    <div className="pl-9 space-y-2 mt-2">
                                                        <h4 className="text-xs font-semibold text-zinc-500 uppercase tracking-widest">Посилання на магазини</h4>
                                                        {item.links?.map((link: any) => (
                                                            <div key={link.id} className="flex items-center justify-between text-sm bg-white dark:bg-zinc-950 p-2 rounded border border-zinc-100 dark:border-zinc-800">
                                                                <a href={link.url} target="_blank" rel="noreferrer" className="flex items-center gap-2 hover:underline truncate text-zinc-700 dark:text-zinc-300">
                                                                    <LinkIcon className="w-3 h-3" />
                                                                    <span className="truncate max-w-[200px]">{link.siteName || link.url}</span>
                                                                    {link.price && <Badge variant="outline" className="text-[10px] h-5 border-zinc-200">{new Intl.NumberFormat('uk-UA').format(link.price)} ₴</Badge>}
                                                                </a>
                                                                <Button variant="ghost" size="icon" className="h-6 w-6 text-zinc-400 hover:text-red-500" onClick={() => handleDeleteLink(link.id)}>
                                                                    <Trash className="w-3 h-3" />
                                                                </Button>
                                                            </div>
                                                        ))}
                                                        <div className="flex gap-2">
                                                            <Input placeholder="https://..." className="h-8 text-xs bg-white dark:bg-zinc-950" value={newLinkUrl} onChange={e => setNewLinkUrl(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleAddLink(item.id)} />
                                                            <Button size="sm" variant="outline" className="h-8 w-8 p-0" onClick={() => handleAddLink(item.id)}><PlusCircle className="w-4 h-4" /></Button>
                                                        </div>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        )}
                                    </React.Fragment>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                </div>
            </div>

            <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader><AlertDialogTitle>Видалити?</AlertDialogTitle><AlertDialogDescription>Ця дія незворотна.</AlertDialogDescription></AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Ні</AlertDialogCancel>
                        <AlertDialogAction onClick={confirmDelete}>Так</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
