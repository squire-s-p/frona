"use client";

import * as React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Loader2, ArrowRightLeft } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { createTransfer } from "@/app/dashboard/finance/phase1-actions";

const formSchema = z.object({
    fromAccountId: z.string().min(1, "Виберіть рахунок"),
    toAccountId: z.string().min(1, "Виберіть рахунок"),
    amount: z.coerce.number().positive("Сума має бути більше 0"),
    fee: z.coerce.number().min(0).optional(),
    exchangeRate: z.coerce.number().positive().optional(),
    note: z.string().optional(),
    date: z.string(),
});

type FormValues = z.infer<typeof formSchema>;

type FinanceAccount = {
    id: string;
    name: string;
    currency: string;
    balance: number;
};

interface TransferDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    accounts: FinanceAccount[];
    onSuccess?: () => void;
}

export function TransferDialog({
    open,
    onOpenChange,
    accounts,
    onSuccess,
}: TransferDialogProps) {
    const [isLoading, setIsLoading] = React.useState(false);

    const form = useForm<FormValues>({
        resolver: zodResolver(formSchema) as any,
        defaultValues: {
            fromAccountId: "",
            toAccountId: "",
            amount: 0,
            fee: 0,
            exchangeRate: undefined,
            note: "",
            date: new Date().toISOString().split("T")[0],
        },
    });

    const fromAccountId = form.watch("fromAccountId");
    const toAccountId = form.watch("toAccountId");
    const amount = form.watch("amount");
    const exchangeRate = form.watch("exchangeRate");

    const fromAccount = accounts.find((a) => a.id === fromAccountId);
    const toAccount = accounts.find((a) => a.id === toAccountId);

    const showExchangeRate =
        fromAccount && toAccount && fromAccount.currency !== toAccount.currency;

    const convertedAmount = exchangeRate && amount ? amount * exchangeRate : amount;

    async function onSubmit(values: FormValues) {
        setIsLoading(true);
        try {
            await createTransfer({
                fromAccountId: values.fromAccountId,
                toAccountId: values.toAccountId,
                amount: values.amount,
                fee: values.fee,
                exchangeRate: values.exchangeRate,
                note: values.note,
                date: new Date(values.date),
            });

            onOpenChange(false);
            form.reset();
            onSuccess?.();
        } catch (error) {
            console.error("Failed to create transfer:", error);
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Трансфер між рахунками</DialogTitle>
                    <DialogDescription>
                        Переведіть гроші між вашими рахунками
                    </DialogDescription>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="fromAccountId"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>З рахунку</FormLabel>
                                    <Select onValueChange={field.onChange} value={field.value}>
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Виберіть рахунок" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {accounts.map((account) => (
                                                <SelectItem key={account.id} value={account.id}>
                                                    {account.name} ({account.currency})
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <div className="flex items-center justify-center py-2">
                            <ArrowRightLeft className="h-5 w-5 text-zinc-400" />
                        </div>

                        <FormField
                            control={form.control}
                            name="toAccountId"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>На рахунок</FormLabel>
                                    <Select onValueChange={field.onChange} value={field.value}>
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Виберіть рахунок" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {accounts.map((account) => (
                                                <SelectItem
                                                    key={account.id}
                                                    value={account.id}
                                                    disabled={account.id === fromAccountId}
                                                >
                                                    {account.name} ({account.currency})
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="amount"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>
                                            Сума {fromAccount && `(${fromAccount.currency})`}
                                        </FormLabel>
                                        <FormControl>
                                            <Input type="number" step="0.01" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="fee"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Комісія (опційно)</FormLabel>
                                        <FormControl>
                                            <Input type="number" step="0.01" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        {showExchangeRate && (
                            <FormField
                                control={form.control}
                                name="exchangeRate"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>
                                            Курс обміну ({fromAccount?.currency} → {toAccount?.currency})
                                        </FormLabel>
                                        <FormControl>
                                            <Input type="number" step="0.000001" {...field} />
                                        </FormControl>
                                        {exchangeRate && (
                                            <FormDescription>
                                                Буде зараховано: {convertedAmount.toFixed(2)}{" "}
                                                {toAccount?.currency}
                                            </FormDescription>
                                        )}
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        )}

                        <FormField
                            control={form.control}
                            name="date"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Дата</FormLabel>
                                    <FormControl>
                                        <Input type="date" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="note"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Примітка (опційно)</FormLabel>
                                    <FormControl>
                                        <Textarea
                                            placeholder="Додаткова інформація..."
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <DialogFooter>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => onOpenChange(false)}
                                disabled={isLoading}
                            >
                                Скасувати
                            </Button>
                            <Button type="submit" disabled={isLoading}>
                                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Створити трансфер
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
