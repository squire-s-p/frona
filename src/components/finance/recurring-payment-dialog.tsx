"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
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
import { Button } from "@/components/ui/button";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { createRecurringPayment } from "@/app/dashboard/finance/actions";
import { getCategories } from "@/app/dashboard/finance/phase1-actions";
import { toast } from "sonner";
import { CalendarIcon, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { uk } from "date-fns/locale";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";

const formSchema = z.object({
    name: z.string().min(1, "Введіть назву"),
    amount: z.coerce.number().positive("Сума має бути більше 0"),
    type: z.enum(["income", "expense"]),
    frequency: z.enum(["once", "weekly", "monthly", "yearly"]),
    nextPaymentDate: z.date(),
    categoryId: z.string().optional(),
    accountId: z.string().optional(),
    affectsForecast: z.boolean().default(true),
    isExpectedIncome: z.boolean().default(false),
});

type FormValues = z.infer<typeof formSchema>;

interface RecurringPaymentDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    accounts: Array<{ id: string; name: string; currency: string }>;
    onSuccess?: () => void;
}

export function RecurringPaymentDialog({
    open,
    onOpenChange,
    accounts,
    onSuccess,
}: RecurringPaymentDialogProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [categories, setCategories] = useState<Array<{ id: string; name: string }>>([]);

    const form = useForm<FormValues>({
        resolver: zodResolver(formSchema) as any,
        defaultValues: {
            name: "",
            amount: 0,
            type: "expense",
            frequency: "monthly",
            nextPaymentDate: new Date(),
            affectsForecast: true,
            isExpectedIncome: false,
        },
    });

    useEffect(() => {
        if (open) {
            form.reset({
                name: "",
                amount: 0,
                type: "expense",
                frequency: "monthly",
                nextPaymentDate: new Date(),
                affectsForecast: true,
                isExpectedIncome: false,
            });
            fetchCategories();
        }
    }, [open, form]);

    async function fetchCategories() {
        try {
            const cats = await getCategories();
            setCategories(cats);
        } catch (error) {
            toast.error("Не вдалося завантажити категорії");
        }
    }

    async function onSubmit(values: FormValues) {
        setIsLoading(true);
        try {
            await createRecurringPayment({
                name: values.name,
                amount: values.amount,
                type: values.type,
                frequency: values.frequency,
                nextPaymentDate: values.nextPaymentDate,
                category: values.categoryId,
                accountId: values.accountId,
                affectsForecast: values.affectsForecast,
                isExpectedIncome: values.isExpectedIncome,
            });
            toast.success("Платіж створено");
            onOpenChange(false);
            onSuccess?.();
            form.reset();
        } catch (error) {
            toast.error("Помилка при створенні");
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Новий регуляторний платіж</DialogTitle>
                    <DialogDescription>
                        Налаштуйте регулярні витрати або очікувані доходи для прогнозування.
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
                                        <Input placeholder="Оренда офісу, Підписка..." {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="type"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Тип</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value="expense">Витрата</SelectItem>
                                                <SelectItem value="income">Дохід</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="frequency"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Частота</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value="once">Один раз</SelectItem>
                                                <SelectItem value="weekly">Щотижня</SelectItem>
                                                <SelectItem value="monthly">Щомісяця</SelectItem>
                                                <SelectItem value="yearly">Щорічно</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="amount"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Сума</FormLabel>
                                        <FormControl>
                                            <Input type="number" step="0.01" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="nextPaymentDate"
                                render={({ field }) => (
                                    <FormItem className="flex flex-col">
                                        <FormLabel>Наступний платіж</FormLabel>
                                        <Popover>
                                            <PopoverTrigger asChild>
                                                <FormControl>
                                                    <Button
                                                        variant={"outline"}
                                                        className={cn(
                                                            "w-full pl-3 text-left font-normal",
                                                            !field.value && "text-muted-foreground"
                                                        )}
                                                    >
                                                        {field.value ? (
                                                            format(field.value, "PPP", { locale: uk })
                                                        ) : (
                                                            <span>Оберіть дату</span>
                                                        )}
                                                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                                    </Button>
                                                </FormControl>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-auto p-0" align="start">
                                                <Calendar
                                                    mode="single"
                                                    selected={field.value}
                                                    onSelect={field.onChange}
                                                    disabled={(date) =>
                                                        date < new Date(new Date().setHours(0, 0, 0, 0))
                                                    }
                                                    initialFocus
                                                />
                                            </PopoverContent>
                                        </Popover>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="categoryId"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Категорія</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Оберіть категорію" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {categories.map((cat) => (
                                                    <SelectItem key={cat.id} value={cat.id}>
                                                        {cat.name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <FormField
                            control={form.control}
                            name="accountId"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Рахунок за замовчуванням</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Оберіть рахунок (опціонально)" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {accounts.map((acc) => (
                                                <SelectItem key={acc.id} value={acc.id}>
                                                    {acc.name} ({acc.currency})
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <FormDescription>
                                        Рахунок, з якого автоматично створюватимуться транзакції.
                                    </FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <div className="space-y-4 rounded-md border p-4">
                            <FormField
                                control={form.control}
                                name="isExpectedIncome"
                                render={({ field }) => (
                                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                                        <FormControl>
                                            <Checkbox
                                                checked={field.value}
                                                onCheckedChange={field.onChange}
                                            />
                                        </FormControl>
                                        <div className="space-y-1 leading-none">
                                            <FormLabel>Очікуваний дохід</FormLabel>
                                            <FormDescription>
                                                Позначте, якщо це очікувана виплата від клієнта (не підписка).
                                            </FormDescription>
                                        </div>
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="affectsForecast"
                                render={({ field }) => (
                                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                                        <FormControl>
                                            <Checkbox
                                                checked={field.value}
                                                onCheckedChange={field.onChange}
                                            />
                                        </FormControl>
                                        <div className="space-y-1 leading-none">
                                            <FormLabel>Враховувати у прогнозі</FormLabel>
                                            <FormDescription>
                                                Визначає, чи бачити цей платіж у фінансовому симуляторі.
                                            </FormDescription>
                                        </div>
                                    </FormItem>
                                )}
                            />
                        </div>

                        <DialogFooter>
                            <Button type="submit" disabled={isLoading}>
                                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Зберегти
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
