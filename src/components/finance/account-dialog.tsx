"use client";

import * as React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { cn } from "@/lib/utils";
import { Loader2, Wallet, CreditCard, Banknote, Bitcoin, PiggyBank } from "lucide-react";

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
import {
    Input
} from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { createAccount, updateAccount } from "@/app/dashboard/finance/phase1-actions";

const accountTypes = [
    { value: "bank", label: "Банківський рахунок", icon: CreditCard },
    { value: "cash", label: "Готівка", icon: Banknote },
    { value: "crypto", label: "Крипто", icon: Bitcoin },
    { value: "savings", label: "Накоп ичення", icon: PiggyBank },
] as const;

const accountColors = [
    { value: "#18181b", label: "Чорний" },
    { value: "#71717a", label: "Сірий" },
    { value: "#a1a1aa", label: "Світло-сірий" },
    { value: "#d4d4d8", label: "Срібний" },
];

const formSchema = z.object({
    name: z.string().min(1, "Введіть назву"),
    type: z.string(),
    currency: z.string(),
    balance: z.coerce.number(),
    color: z.string().optional(),
    includeInTotal: z.boolean().default(true),
    role: z.string().default("liquid"),
});

type FormValues = z.infer<typeof formSchema>;

interface AccountDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    account?: any;
    onSuccess?: () => void;
}

export function AccountDialog({
    open,
    onOpenChange,
    account,
    onSuccess,
}: AccountDialogProps) {
    const [isLoading, setIsLoading] = React.useState(false);
    const isEditing = !!account;

    const form = useForm<FormValues>({
        resolver: zodResolver(formSchema) as any,
        defaultValues: {
            name: account?.name || "",
            type: account?.type || "bank",
            currency: account?.currency || "UAH",
            balance: account?.balance || 0,
            color: account?.color || "#18181b",
            includeInTotal: account?.includeInTotal ?? true,
            role: account?.role || "liquid",
        },
    });

    React.useEffect(() => {
        if (account) {
            form.reset({
                name: account.name,
                type: account.type,
                currency: account.currency,
                balance: account.balance,
                color: account.color || "#18181b",
                includeInTotal: account.includeInTotal ?? true,
                role: account.role || "liquid",
            });
        } else {
            form.reset({
                name: "",
                type: "bank",
                currency: "UAH",
                balance: 0,
                color: "#18181b",
                includeInTotal: true,
                role: "liquid",
            });
        }
    }, [account, form]);

    async function onSubmit(values: FormValues) {
        setIsLoading(true);
        try {
            if (isEditing) {
                await updateAccount(account.id, {
                    name: values.name,
                    type: values.type,
                    color: values.color,
                    includeInTotal: values.includeInTotal,
                    role: values.role,
                });
            } else {
                await createAccount({
                    name: values.name,
                    type: values.type,
                    currency: values.currency,
                    balance: values.balance,
                    color: values.color,
                    includeInTotal: values.includeInTotal,
                    role: values.role,
                });
            }

            onOpenChange(false);
            form.reset();
            onSuccess?.();
        } catch (error) {
            console.error("Failed to save account:", error);
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>
                        {isEditing ? "Редагувати рахунок" : "Новий рахунок"}
                    </DialogTitle>
                    <DialogDescription>
                        {isEditing
                            ? "Оновіть інформацію про рахунок"
                            : "Створіть новий фінансовий рахунок"}
                    </DialogDescription>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Назва</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Моя картка" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="type"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Тип рахунку</FormLabel>
                                    <Select
                                        onValueChange={field.onChange}
                                        defaultValue={field.value}
                                    >
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {accountTypes.map((type) => {
                                                const Icon = type.icon;
                                                return (
                                                    <SelectItem key={type.value} value={type.value}>
                                                        <div className="flex items-center gap-2">
                                                            <Icon className="h-4 w-4" />
                                                            <span>{type.label}</span>
                                                        </div>
                                                    </SelectItem>
                                                );
                                            })}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="role"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Роль рахунку</FormLabel>
                                    <Select
                                        onValueChange={field.onChange}
                                        defaultValue={field.value}
                                    >
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            <SelectItem value="liquid">Операційні кошти (Liquid)</SelectItem>
                                            <SelectItem value="savings">Заощадження (Savings)</SelectItem>
                                            <SelectItem value="tax">Податковий резерв (Tax)</SelectItem>
                                            <SelectItem value="other">Інше</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <FormDescription>
                                        Впливає на розрахунок "фінансової подушки" (Runway)
                                    </FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {!isEditing && (
                            <>
                                <div className="grid grid-cols-2 gap-4">
                                    <FormField
                                        control={form.control}
                                        name="currency"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Валюта</FormLabel>
                                                <Select
                                                    onValueChange={field.onChange}
                                                    defaultValue={field.value}
                                                >
                                                    <FormControl>
                                                        <SelectTrigger>
                                                            <SelectValue />
                                                        </SelectTrigger>
                                                    </FormControl>
                                                    <SelectContent>
                                                        <SelectItem value="UAH">UAH (₴)</SelectItem>
                                                        <SelectItem value="USD">USD ($)</SelectItem>
                                                        <SelectItem value="EUR">EUR (€)</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={form.control}
                                        name="balance"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Початковий баланс</FormLabel>
                                                <FormControl>
                                                    <Input type="number" step="0.01" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>
                            </>
                        )}

                        <FormField
                            control={form.control}
                            name="color"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Колір</FormLabel>
                                    <div className="grid grid-cols-4 gap-2">
                                        {accountColors.map((color) => (
                                            <Button
                                                key={color.value}
                                                type="button"
                                                variant="outline"
                                                onClick={() => field.onChange(color.value)}
                                                className={cn(
                                                    "h-10 w-full rounded-md border-2 transition-all p-0 hover:scale-105 active:scale-95",
                                                    field.value === color.value
                                                        ? "border-zinc-900 dark:border-zinc-50 ring-2 ring-zinc-500/20"
                                                        : "border-transparent"
                                                )}
                                                style={{ backgroundColor: color.value }}
                                                title={color.label}
                                            />
                                        ))}
                                    </div>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="includeInTotal"
                            render={({ field }) => (
                                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                                    <FormControl>
                                        <Checkbox
                                            checked={field.value}
                                            onCheckedChange={field.onChange}
                                        />
                                    </FormControl>
                                    <div className="space-y-1 leading-none">
                                        <FormLabel>Включити в загальний баланс</FormLabel>
                                        <FormDescription>
                                            Баланс цього рахунку буде включено в розрахунок
                                            загального балансу
                                        </FormDescription>
                                    </div>
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
                                {isEditing ? "Зберегти" : "Створити"}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog >
    );
}
