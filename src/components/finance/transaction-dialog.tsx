"use client";

import * as React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { format } from "date-fns";
import { uk } from "date-fns/locale";
import {
    Loader2,
    Plus,
    Calendar as CalendarIcon,
    Tags,
    Layers,
    User as UserIcon,
    FileText,
    Repeat,
    Split,
    Trash2,
    Briefcase
} from "lucide-react";

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
import { Badge } from "@/components/ui/badge";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import {
    createTransactionWithTags,
    createFullSplitTransaction,
    getTags,
    getCategories,
    getClients,
    createTag,
} from "@/app/dashboard/finance/phase1-actions";
import { getFinanceAccounts, getProjects } from "@/app/dashboard/finance/actions";
import { toast } from "sonner";

const formSchema = z.object({
    accountId: z.string().min(1, "Виберіть рахунок"),
    categoryId: z.string().min(1, "Виберіть категорію"),
    type: z.enum(["income", "expense"]),
    amount: z.coerce.number().positive("Сума має бути більшою за 0"),
    date: z.date(),
    description: z.string().optional(),
    clientId: z.string().optional(),
    projectId: z.string().optional(),
    tagIds: z.array(z.string()).default([]),
    note: z.string().optional(),
    isRecurring: z.boolean().default(false),
    recurringFrequency: z.enum(["weekly", "monthly", "yearly"]).optional(),
    isSplit: z.boolean().default(false),
    splits: z.array(z.object({
        categoryId: z.string().min(1, "Виберіть категорію"),
        amount: z.coerce.number().positive("Сума має бути більшою за 0"),
        note: z.string().optional(),
    })).optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface TransactionDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    accounts: Awaited<ReturnType<typeof getFinanceAccounts>>;
    projects: Awaited<ReturnType<typeof getProjects>>;
    onSuccess?: () => void;
}

import { useFieldArray } from "react-hook-form";

export function TransactionDialog({
    open,
    onOpenChange,
    accounts,
    projects,
    onSuccess,
}: TransactionDialogProps) {
    const [isLoading, setIsLoading] = React.useState(false);
    const [categories, setCategories] = React.useState<any[]>([]);
    const [tags, setTags] = React.useState<any[]>([]);
    const [clients, setClients] = React.useState<Awaited<ReturnType<typeof getClients>>>([]);
    const [newTagName, setNewTagName] = React.useState("");
    const [isCreatingTag, setIsCreatingTag] = React.useState(false);

    const form = useForm<FormValues>({
        resolver: zodResolver(formSchema) as any,
        defaultValues: {
            accountId: accounts[0]?.id || "",
            categoryId: "",
            type: "expense",
            amount: 0,
            date: new Date(),
            description: "",
            clientId: "",
            projectId: "none",
            tagIds: [],
            note: "",
            isRecurring: false,
            recurringFrequency: "monthly",
            isSplit: false,
            splits: [{ categoryId: "", amount: 0, note: "" }],
        },
    });

    const { control, handleSubmit, reset, watch, setValue, getValues } = form;

    const { fields, append, remove } = useFieldArray({
        control,
        name: "splits",
    });

    const loadData = React.useCallback(async () => {
        try {
            const [cats, tgs, clis] = await Promise.all([
                getCategories(),
                getTags(),
                getClients(),
            ]);
            setCategories(cats);
            setTags(tgs);
            setClients(clis);
        } catch {
        }
    }, []);

    React.useEffect(() => {
        if (open) {
            loadData();
            reset({
                accountId: accounts[0]?.id || "",
                categoryId: "",
                type: "expense",
                amount: 0,
                date: new Date(),
                description: "",
                clientId: "",
                projectId: "none",
                tagIds: [],
                note: "",
                isRecurring: false,
                isSplit: false,
                splits: [{ categoryId: "", amount: 0, note: "" }],
            });
        }
    }, [open, accounts, reset, loadData]);

    async function handleCreateTag() {
        if (!newTagName.trim()) return;
        setIsCreatingTag(true);
        try {
            const tag = await createTag(newTagName.trim());
            setTags([...tags, tag]);
            setNewTagName("");
            toast.success("Тег створено");
        } catch {
            toast.error("Помилка створення тегу");
        } finally {
            setIsCreatingTag(false);
        }
    }

    const toggleTag = (tagId: string) => {
        const currentTags = getValues("tagIds");
        if (currentTags.includes(tagId)) {
            setValue("tagIds", currentTags.filter((id: string) => id !== tagId));
        } else {
            setValue("tagIds", [...currentTags, tagId]);
        }
    };

    async function onSubmit(values: FormValues) {
        setIsLoading(true);
        try {
            if (values.isSplit && values.splits) {
                await createFullSplitTransaction({
                    accountId: values.accountId,
                    type: values.type,
                    amount: values.amount,
                    date: values.date,
                    description: values.description || "Розділена транзакція",
                    splits: values.splits,
                    tagIds: values.tagIds,
                    clientId: values.clientId,
                    projectId: values.projectId === "none" ? undefined : values.projectId,
                });
            } else {
                await createTransactionWithTags({
                    ...values,
                    projectId: values.projectId === "none" ? undefined : values.projectId,
                });
            }
            toast.success("Транзакцію створено");
            onOpenChange(false);
            onSuccess?.();
        } catch {
            toast.error("Помилка створення транзакції");
        } finally {
            setIsLoading(false);
        }
    }

    const currentType = watch("type");
    const currentAccountId = watch("accountId");
    const selectedTags = watch("tagIds");
    const isRecurring = watch("isRecurring");
    const isSplit = watch("isSplit");
    const mainAmount = watch("amount");
    const splits = watch("splits") || [];
    const splitsTotal = splits.reduce((sum: number, s: any) => sum + (Number(s.amount) || 0), 0);
    const isSplitBalanced = Math.abs(splitsTotal - mainAmount) < 0.01;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Нова транзакція</DialogTitle>
                    <DialogDescription>
                        Додайте деталі ваших доходів або витрат
                    </DialogDescription>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                        <div className="flex p-1 bg-zinc-100 dark:bg-zinc-900 rounded-lg">
                            <Button
                                type="button"
                                variant="ghost"
                                onClick={() => setValue("type", "expense")}
                                className={cn(
                                    "flex-1 py-2 text-sm font-medium rounded-md transition-all h-auto",
                                    currentType === "expense"
                                        ? "bg-white dark:bg-zinc-800 text-red-600 shadow-sm hover:bg-white dark:hover:bg-zinc-800"
                                        : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-transparent"
                                )}
                            >
                                Витрата
                            </Button>
                            <Button
                                type="button"
                                variant="ghost"
                                onClick={() => setValue("type", "income")}
                                className={cn(
                                    "flex-1 py-2 text-sm font-medium rounded-md transition-all h-auto",
                                    currentType === "income"
                                        ? "bg-white dark:bg-zinc-800 text-green-600 shadow-sm hover:bg-white dark:hover:bg-zinc-800"
                                        : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-transparent"
                                )}
                            >
                                Дохід
                            </Button>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={control}
                                name={"accountId" as any}
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Рахунок</FormLabel>
                                        <Select onValueChange={field.onChange} value={field.value}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Виберіть рахунок" />
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
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={control}
                                name={"categoryId" as any}
                                render={({ field }) => (
                                    <FormItem className={cn(isSplit && "opacity-50 pointer-events-none")}>
                                        <FormLabel>Категорія {isSplit && "(буде розділено)"}</FormLabel>
                                        <Select
                                            onValueChange={field.onChange}
                                            value={field.value}
                                            disabled={isSplit}
                                        >
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Виберіть категорію" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {categories
                                                    .filter(c => c.type === currentType)
                                                    .map((cat) => (
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

                        {isSplit && (
                            <div className="space-y-4 p-4 bg-zinc-50 dark:bg-zinc-900/50 rounded-lg border border-zinc-200 dark:border-zinc-800">
                                <div className="flex items-center justify-between">
                                    <div className="text-sm font-medium flex items-center gap-2">
                                        <Split className="h-4 w-4 text-zinc-400" />
                                        Розподіл суми
                                    </div>
                                    <div className={cn(
                                        "text-xs font-bold px-2 py-0.5 rounded",
                                        isSplitBalanced ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                                    )}>
                                        {splitsTotal.toFixed(2)} / {mainAmount.toFixed(2)}
                                    </div>
                                </div>
                                <div className="space-y-3">
                                    {fields.map((item, index) => (
                                        <div key={item.id} className="flex gap-2 items-start">
                                            <div className="grid grid-cols-[1fr,100px] gap-2 flex-1">
                                                <FormField
                                                    control={control}
                                                    name={`splits.${index}.categoryId` as any}
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <Select onValueChange={field.onChange} value={field.value}>
                                                                <FormControl>
                                                                    <SelectTrigger className="h-8 text-xs">
                                                                        <SelectValue placeholder="Категорія" />
                                                                    </SelectTrigger>
                                                                </FormControl>
                                                                <SelectContent>
                                                                    {categories
                                                                        .filter(c => c.type === currentType)
                                                                        .map((cat) => (
                                                                            <SelectItem key={cat.id} value={cat.id}>
                                                                                {cat.name}
                                                                            </SelectItem>
                                                                        ))}
                                                                </SelectContent>
                                                            </Select>
                                                        </FormItem>
                                                    )}
                                                />
                                                <FormField
                                                    control={control}
                                                    name={`splits.${index}.amount` as any}
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <FormControl>
                                                                <Input
                                                                    type="number"
                                                                    step="0.01"
                                                                    placeholder="0.00"
                                                                    className="h-8 text-xs"
                                                                    {...field}
                                                                />
                                                            </FormControl>
                                                        </FormItem>
                                                    )}
                                                />
                                            </div>
                                            {fields.length > 1 && (
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 text-zinc-400 hover:text-red-500"
                                                    onClick={() => remove(index)}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            )}
                                        </div>
                                    ))}
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        className="w-full h-8 border-dashed text-xs"
                                        onClick={() => append({ categoryId: "", amount: 0, note: "" })}
                                    >
                                        <Plus className="h-3 w-3 mr-2" />
                                        Додати частку
                                    </Button>
                                </div>
                            </div>
                        )}

                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={control}
                                name={"amount" as any}
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Сума</FormLabel>
                                        <FormControl>
                                            <div className="relative">
                                                <Input
                                                    type="number"
                                                    step="0.01"
                                                    placeholder="0.00"
                                                    className="pl-8"
                                                    {...field}
                                                />
                                                <span className="absolute left-3 top-2.5 text-zinc-500">
                                                    {accounts.find(a => a.id === currentAccountId)?.currency === 'USD' ? '$' :
                                                        accounts.find(a => a.id === currentAccountId)?.currency === 'EUR' ? '€' : '₴'}
                                                </span>
                                            </div>
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={control}
                                name={"date" as any}
                                render={({ field }) => (
                                    <FormItem className="flex flex-col">
                                        <FormLabel className="mt-1">Дата</FormLabel>
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
                                                        {field.value instanceof Date ? (
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
                                                    selected={field.value as any}
                                                    onSelect={field.onChange}
                                                    disabled={(date) =>
                                                        date > new Date() || date < new Date("1900-01-01")
                                                    }
                                                    initialFocus
                                                />
                                            </PopoverContent>
                                        </Popover>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <FormField
                            control={control}
                            name={"description" as any}
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Опис</FormLabel>
                                    <FormControl>
                                        <Input placeholder="На що витрачено..." {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <div className="space-y-4 pt-4 border-t border-zinc-100 dark:border-zinc-800">
                            <div className="flex items-center gap-2 text-sm font-medium text-zinc-900 dark:text-zinc-50">
                                <Tags className="h-4 w-4" />
                                Теги
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {tags.map(tag => (
                                    <Badge
                                        key={tag.id}
                                        variant={selectedTags.includes(tag.id) ? "default" : "outline"}
                                        className="cursor-pointer hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors"
                                        onClick={() => toggleTag(tag.id)}
                                    >
                                        {tag.name}
                                    </Badge>
                                ))}
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Button variant="outline" size="sm" className="h-6 rounded-full px-2 border-dashed">
                                            <Plus className="h-3 w-3 mr-1" />
                                            Новий тег
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-60 p-3" align="start">
                                        <div className="space-y-3">
                                            <div className="text-xs font-medium uppercase tracking-wider text-zinc-500">
                                                Створити новий тег
                                            </div>
                                            <div className="flex gap-2">
                                                <Input
                                                    size={1}
                                                    value={newTagName}
                                                    onChange={(e) => setNewTagName(e.target.value)}
                                                    placeholder="Назва..."
                                                    className="h-8 text-xs"
                                                />
                                                <Button
                                                    size="sm"
                                                    className="h-8 text-xs"
                                                    onClick={handleCreateTag}
                                                    disabled={isCreatingTag || !newTagName.trim()}
                                                >
                                                    {isCreatingTag ? <Loader2 className="h-3 w-3 animate-spin" /> : "Додати"}
                                                </Button>
                                            </div>
                                        </div>
                                    </PopoverContent>
                                </Popover>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={control}
                                name={"clientId" as any}
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="flex items-center gap-2">
                                            <UserIcon className="h-3.5 w-3.5 text-zinc-400" />
                                            Клієнт (optional)
                                        </FormLabel>
                                        <Select onValueChange={field.onChange} value={field.value}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Виберіть клієнта" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value="none">Без клієнта</SelectItem>
                                                {clients.map((cli) => (
                                                    <SelectItem key={cli.id} value={cli.id}>
                                                        {cli.name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <div className="flex flex-col gap-2">
                                <FormLabel className="flex items-center gap-2">
                                    <Layers className="h-3.5 w-3.5 text-zinc-400" />
                                    Додатково
                                </FormLabel>
                                <div className="flex gap-2">
                                    <Button
                                        type="button"
                                        variant={isRecurring ? "default" : "outline"}
                                        size="sm"
                                        className="flex-1 text-xs"
                                        onClick={() => setValue("isRecurring", !isRecurring)}
                                    >
                                        <Repeat className={cn("h-3 w-3 mr-2", isRecurring && "animate-spin-slow")} />
                                        Рекурентність
                                    </Button>
                                    <Button
                                        type="button"
                                        variant={isSplit ? "default" : "outline"}
                                        size="sm"
                                        className="flex-1 text-xs"
                                        onClick={() => setValue("isSplit", !isSplit)}
                                    >
                                        <Split className="h-3 w-3 mr-2" />
                                        Розділити
                                    </Button>
                                </div>
                                {isRecurring && (
                                    <div className="animate-in slide-in-from-top-2 duration-300">
                                        <FormField
                                            control={control}
                                            name={"recurringFrequency" as any}
                                            render={({ field }) => (
                                                <Select onValueChange={field.onChange} value={field.value}>
                                                    <FormControl>
                                                        <SelectTrigger className="h-8 text-xs bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800">
                                                            <SelectValue placeholder="Періодичність" />
                                                        </SelectTrigger>
                                                    </FormControl>
                                                    <SelectContent>
                                                        <SelectItem value="weekly">Щотижня</SelectItem>
                                                        <SelectItem value="monthly">Щомісяця</SelectItem>
                                                        <SelectItem value="yearly">Щороку</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            )}
                                        />
                                    </div>
                                )}
                            </div>
                        </div>

                        <FormField
                            control={control}
                            name={"projectId" as any}
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="flex items-center gap-2">
                                        <Briefcase className="h-3.5 w-3.5 text-zinc-400" />
                                        Проєкт (optional)
                                    </FormLabel>
                                    <Select onValueChange={field.onChange} value={field.value}>
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Виберіть проєкт" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            <SelectItem value="none">Без проєкту</SelectItem>
                                            {projects.map((proj) => (
                                                <SelectItem key={proj.id} value={proj.id}>
                                                    {proj.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={control}
                            name={"note" as any}
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="flex items-center gap-2">
                                        <FileText className="h-3.5 w-3.5 text-zinc-400" />
                                        Примітка
                                    </FormLabel>
                                    <FormControl>
                                        <Textarea
                                            placeholder="Додаткова інформація..."
                                            className="resize-none h-20"
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
                            <Button
                                type="submit"
                                disabled={isLoading || (isSplit && !isSplitBalanced)}
                                className="bg-zinc-900 text-zinc-50 dark:bg-zinc-50 dark:text-zinc-900"
                            >
                                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Створити транзакцію
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
