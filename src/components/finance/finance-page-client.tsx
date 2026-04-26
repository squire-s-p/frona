"use client";

import { format, startOfDay, endOfDay } from "date-fns";
import { uk } from "date-fns/locale";
import {
    LayoutDashboard,
    Plus,
    RefreshCw,
    Loader2,
    Calendar as CalendarIcon,
    ArrowRight,
    TrendingUp,
    TrendingDown,
    History as HistoryIcon,
    Search,
    Filter,
    ArrowUpRight,
    ArrowDownLeft,
    ArrowLeftRight,
    CreditCard,
    Check,
    Tag,
    Briefcase,
    MessageSquare,
    Layers,
    X,
    ChevronDown,
    Zap,
    Wallet,
    Target,
    BarChart3,
    Receipt,
    CalendarClock
} from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { DateRange } from "react-day-picker";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { formatDistanceToNow } from "date-fns";
import * as React from "react";

import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
    getFinanceAccounts,
    getRecentTransactions,
    getProjects,
    updateTransactionProject,
    getSpendingAnalytics,
    getExchangeRates,
    getBudgets,
    getFinancialStats,
    getPlanningData
} from "@/app/dashboard/finance/actions";
import { getCategories } from "@/app/dashboard/finance/phase1-actions";
import { Checkbox } from "@/components/ui/checkbox";
import { getFinancialHealth, generateForecast } from "@/app/dashboard/finance/forecast-actions";
import { getProjectsProfitability, getClientsProfitability } from "@/app/dashboard/finance/project-actions";
import { getTaxStats } from "@/app/dashboard/finance/tax-actions";
import { getAutomationRules } from "@/app/dashboard/finance/automation-actions";
import { getBankAccounts, refreshAllBankAccounts } from "@/modules/bank/bank.actions";
import type { BankAccountRecord } from "@/modules/bank/bank.types";
import { toast } from "sonner";
import {
    AreaChart,
    Area,
    BarChart,
    Bar,
    Cell,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip as RechartsTooltip,
    ResponsiveContainer
} from "recharts";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { PlanningTab } from "./planning-tab";
import { AccountManagement } from "./account-management";
import { TransactionDialog } from "./transaction-dialog";
import { TransfersTab } from "./transfers-tab";
import { FinancialHealthCards } from "./financial-health-cards";
import { ForecastTab } from "./forecast-tab";
import { ProjectsAnalyticsTab } from "./projects-analytics-tab";
import { TaxTab } from "./tax-tab";
import { AutomationTab } from "./automation-tab";
import { GoalsTab } from "./goals-tab";
import { TransactionDetailDialog } from "./transaction-detail-dialog";

// Monochrome Palette
const CHART_COLORS = ['#18181b', '#52525b', '#a1a1aa', '#d4d4d8', '#71717a'];

export function FinancePageClient() {
    const [isMounted, setIsMounted] = React.useState(false);
    const [accounts, setAccounts] = React.useState<any[]>([]);
    const [bankAccounts, setBankAccounts] = React.useState<BankAccountRecord[]>([]);
    const [transactions, setTransactions] = React.useState<any[]>([]);
    const [projects, setProjects] = React.useState<any[]>([]);
    const [analytics, setAnalytics] = React.useState<any[]>([]);
    const [financialStats, setFinancialStats] = React.useState<{ pieChart: any[], barChart: any[] }>({ pieChart: [], barChart: [] });
    const [budgets, setBudgets] = React.useState<any[]>([]);
    const [planningData, setPlanningData] = React.useState<{ goals: any[], payments: any[], shoppingItems: any[] }>({ goals: [], payments: [], shoppingItems: [] });
    const [rates, setRates] = React.useState({ USD: 41.5, EUR: 45.0 });
    const [isLoading, setIsLoading] = React.useState(true);
    const [isSyncing, setIsSyncing] = React.useState(false);
    const [syncProgress, setSyncProgress] = React.useState<string | null>(null);
    const [lastSyncedAt, setLastSyncedAt] = React.useState<Date | null>(null);
    const [financialHealth, setFinancialHealth] = React.useState({
        burnRate: 0,
        runway: 0,
        liquidRunway: 0,
        savingsRate: 0,
        stabilityScore: 0,
        totalBalance: 0,
        liquidBalance: 0,
        projections: {
            d30: 0,
            d60: 0,
            d90: 0
        }
    });

    // Filtering State
    const [searchQuery, setSearchQuery] = React.useState("");
    const [selectedProject, setSelectedProject] = React.useState("all");
    const [selectedCategory, setSelectedCategory] = React.useState("all");
    const [selectedAccount, setSelectedAccount] = React.useState("all");
    const [isFiltering, setIsFiltering] = React.useState(false);
    const [forecastData, setForecastData] = React.useState<any>(null);
    const [projectsProfitability, setProjectsProfitability] = React.useState<any[]>([]);
    const [clientsProfitability, setClientsProfitability] = React.useState<any[]>([]);
    const [taxStats, setTaxStats] = React.useState<any>(null);
    const [automationRules, setAutomationRules] = React.useState<any[]>([]);
    const [transactionDialogOpen, setTransactionDialogOpen] = React.useState(false);
    const [detailDialogOpen, setDetailDialogOpen] = React.useState(false);
    const [selectedTransactionForDetail, setSelectedTransactionForDetail] = React.useState<any>(null);
    const [categories, setCategories] = React.useState<any[]>([]);
    const [whatIfScenarios, setWhatIfScenarios] = React.useState<any[]>([]);
    const [dateRange, setDateRange] = React.useState<DateRange | undefined>({
        from: undefined,
        to: undefined,
    });
    const [pendingDateRange, setPendingDateRange] = React.useState<DateRange | undefined>(dateRange);
    const [isDatePopoverOpen, setIsDatePopoverOpen] = React.useState(false);
    const [debouncedSearch, setDebouncedSearch] = React.useState("");
    const [historyTotals, setHistoryTotals] = React.useState({ income: 0, expense: 0 });

    React.useEffect(() => {
        const timer = setTimeout(() => setDebouncedSearch(searchQuery), 300);
        return () => clearTimeout(timer);
    }, [searchQuery]);

    const [activeTab, setActiveTab] = React.useState("overview");
    const [showLoadMore, setShowLoadMore] = React.useState(false);
    const cardContentRef = React.useRef<HTMLDivElement>(null);
    const loadMoreSentinelRef = React.useRef<HTMLDivElement>(null);

    const [offset, setOffset] = React.useState(0);
    const [hasMore, setHasMore] = React.useState(true);
    const [isLoadingMore, setIsLoadingMore] = React.useState(false);


    const fetchTransactions = React.useCallback(async () => {
        setIsFiltering(true);
        setOffset(0);
        setHasMore(true);
        try {
            const res = await getRecentTransactions(20, 0, {
                search: debouncedSearch,
                projectId: selectedProject === "all" ? undefined : selectedProject,
                categoryId: selectedCategory === "all" ? undefined : selectedCategory,
                accountId: selectedAccount === "all" ? undefined : selectedAccount,
                dateFrom: dateRange?.from ? startOfDay(dateRange.from).toISOString() : undefined,
                dateTo: dateRange?.to ? endOfDay(dateRange.to).toISOString() : undefined,
            });
            setTransactions(res.transactions);
            setHistoryTotals(res.totals);
            setHasMore(res.hasMore);
            setOffset(20); // Prepare offset for next load
        } catch (error) {
            console.error("Failed to fetch filtered transactions:", error);
        } finally {
            setIsFiltering(false);
        }
    }, [debouncedSearch, selectedProject, selectedCategory, selectedAccount, dateRange]);

    const loadMoreTransactions = React.useCallback(async () => {
        if (isLoadingMore || !hasMore) return;
        setIsLoadingMore(true);
        try {
            const res = await getRecentTransactions(20, offset, {
                search: debouncedSearch,
                projectId: selectedProject === "all" ? undefined : selectedProject,
                categoryId: selectedCategory === "all" ? undefined : selectedCategory,
                accountId: selectedAccount === "all" ? undefined : selectedAccount,
                dateFrom: dateRange?.from ? startOfDay(dateRange.from).toISOString() : undefined,
                dateTo: dateRange?.to ? endOfDay(dateRange.to).toISOString() : undefined,
            });

            if (res.transactions.length === 0) {
                setHasMore(false);
                return;
            }

            setTransactions(prev => {
                const existingIds = new Set(prev.map(tx => tx.id));
                const unique = res.transactions.filter(tx => !existingIds.has(tx.id));
                return [...prev, ...unique];
            });

            setHasMore(res.hasMore);
            setOffset(prev => prev + 20); // Always increment offset to move window forward
            setHistoryTotals(res.totals);
        } catch (error) {
            console.error("Failed to load more transactions:", error);
        } finally {
            setIsLoadingMore(false);
        }
    }, [hasMore, isLoadingMore, offset, debouncedSearch, selectedProject, selectedCategory, selectedAccount, dateRange]);

    React.useEffect(() => {
        if (!isMounted || !hasMore || activeTab !== "history" || isLoadingMore) return;

        // Give a small delay to ensure the DOM is ready after tab switch
        const timer = setTimeout(() => {
            if (!loadMoreSentinelRef.current || !cardContentRef.current) return;

            const observer = new IntersectionObserver(
                ([entry]) => {
                    if (entry.isIntersecting && !isLoadingMore && hasMore) {
                        setShowLoadMore(true);
                        loadMoreTransactions();
                    } else {
                        setShowLoadMore(false);
                    }
                },
                {
                    threshold: 0.01,
                    rootMargin: '400px', // Slightly reduced but still proactive
                    root: cardContentRef.current // Use the actual scrollable container
                }
            );

            observer.observe(loadMoreSentinelRef.current);

            return () => {
                if (loadMoreSentinelRef.current) observer.unobserve(loadMoreSentinelRef.current);
                observer.disconnect();
            };
        }, 100);

        return () => clearTimeout(timer);
    }, [hasMore, activeTab, transactions.length, isLoadingMore, loadMoreTransactions, isMounted, offset]);

    // Перезавантаження при зміні фільтрів (але не при переключенні вкладки — список зберігається)
    React.useEffect(() => {
        if (!isMounted || activeTab !== "history") return;
        fetchTransactions();
    }, [debouncedSearch, selectedProject, selectedCategory, selectedAccount, dateRange, fetchTransactions, isMounted]);

    // Перше завантаження при першому відкритті вкладки (якщо немає даних)
    React.useEffect(() => {
        if (!isMounted || activeTab !== "history") return;
        if (transactions.length === 0) fetchTransactions();
    }, [activeTab]);

    const fetchData = React.useCallback(async () => {
        try {
            const [accs, bankAccs, txsRes, projs, chartData, currentRates, userBudgets, stats, planning, health, forecast, profitability, clientProfitability, taxes, rules, fetchedCategories] = await Promise.all([
                getFinanceAccounts(),
                getBankAccounts(),
                getRecentTransactions(20),
                getProjects(),
                getSpendingAnalytics(),
                getExchangeRates(),
                getBudgets(),
                getFinancialStats(),
                getPlanningData(),
                getFinancialHealth(),
                generateForecast({ months: 6, whatIf: whatIfScenarios }),
                getProjectsProfitability(),
                getClientsProfitability(),
                getTaxStats(),
                getAutomationRules(),
                getCategories()
            ]);
            setAccounts(accs);
            setBankAccounts(bankAccs);

            // Handle Transactions specifically
            const isFiltered = debouncedSearch || selectedProject !== "all" || selectedCategory !== "all" || selectedAccount !== "all" || (dateRange?.from !== undefined);

            if (!isFiltered) {
                if (transactions.length <= 20) {
                    setTransactions(txsRes.transactions);
                    setHistoryTotals(txsRes.totals);
                    setHasMore(txsRes.hasMore);
                    setOffset(txsRes.transactions.length);
                } else {
                    setHistoryTotals(txsRes.totals);
                    setHasMore(txsRes.hasMore);
                }
            } else {
                if (transactions.length === 0) {
                    setTransactions(txsRes.transactions);
                    setHistoryTotals(txsRes.totals);
                    setHasMore(txsRes.hasMore);
                    setOffset(txsRes.transactions.length);
                } else if (transactions.length <= 20) {
                    setHistoryTotals(txsRes.totals);
                    setHasMore(txsRes.hasMore);
                }
            }

            setProjects(projs);
            setAnalytics(chartData);
            setRates(currentRates);
            setBudgets(userBudgets);
            setFinancialStats(stats);
            setFinancialHealth(health);
            setForecastData(forecast);
            setProjectsProfitability(profitability);
            setClientsProfitability(clientProfitability);
            setTaxStats(taxes);
            setAutomationRules(rules);
            setCategories(fetchedCategories);
            setPlanningData({
                goals: planning.goals || [],
                payments: planning.payments || [],
                shoppingItems: planning.shoppingItems || []
            });
        } catch (error) {
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    }, [debouncedSearch, selectedProject, selectedCategory, selectedAccount, dateRange, whatIfScenarios]);

    const handleSync = React.useCallback(async (showToast = true) => {
        if (isSyncing) return;
        setIsSyncing(true);
        setSyncProgress("З'єднання з банком...");

        try {
            // 1. Trigger real incremental sync from bank API
            const syncRes = await refreshAllBankAccounts();

            if (syncRes.errors.length > 0) {
                console.warn("[finance] sync errors:", syncRes.errors);
                // We show one toast for errors if any
                if (showToast) toast.error(`Помилка синхронізації: ${syncRes.errors[0]}`);
            }

            // 2. Refresh local UI data
            setSyncProgress("Оновлення інтерфейсу...");
            await fetchData();

            setLastSyncedAt(new Date());
            if (showToast && syncRes.errors.length === 0) {
                const msg = syncRes.totalInserted > 0
                    ? `Оновлено: +${syncRes.totalInserted} транзакцій`
                    : "Нових транзакцій не знайдено";
                toast.success(msg);
            }
        } catch (error: any) {
            console.error(error);
            if (showToast) toast.error("Не вдалося оновити дані");
        } finally {
            setIsSyncing(false);
            setSyncProgress(null);
        }
    }, [isSyncing, fetchData]);

    React.useEffect(() => {
        setIsMounted(true);
        fetchData();
        // Ми не додаємо fetchData в залежності, щоб уникнути циклу при ініціалізації
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const refreshForecast = React.useCallback(async () => {
        try {
            const forecast = await generateForecast({ months: 6, whatIf: whatIfScenarios });
            setForecastData(forecast);
        } catch (error) {
            console.error("Failed to refresh forecast:", error);
        }
    }, [whatIfScenarios]);

    React.useEffect(() => {
        if (isMounted && whatIfScenarios.length > 0) {
            refreshForecast();
        } else if (isMounted && whatIfScenarios.length === 0) {
            refreshForecast(); // Reset to normal if cleared
        }
    }, [whatIfScenarios, isMounted, refreshForecast]);

    // Periodic sync every 5 minutes
    React.useEffect(() => {
        const interval = setInterval(() => {
            handleSync(false);
        }, 5 * 60 * 1000);
        return () => clearInterval(interval);
    }, [handleSync]);

    // Sync when tab becomes visible
    React.useEffect(() => {
        const handleVisibilityChange = () => {
            if (!document.hidden) {
                const timeSinceLastSync = lastSyncedAt ? Date.now() - lastSyncedAt.getTime() : Infinity;
                if (timeSinceLastSync > 5 * 60 * 1000) {
                    handleSync(false);
                }
            }
        };
        document.addEventListener("visibilitychange", handleVisibilityChange);
        return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
    }, [lastSyncedAt, handleSync]);

    // Totals
    const totalBalanceUAH = accounts.reduce((sum: number, acc: any) => {
        if (acc.currency === "USD") return sum + (acc.balance * rates.USD);
        if (acc.currency === "EUR") return sum + (acc.balance * rates.EUR);
        return sum + acc.balance;
    }, 0);

    if (!isMounted) {
        return <div className="p-6 space-y-8" />;
    }

    return (
        <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 shrink-0 mb-6">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">Фінанси</h1>
                    <p className="text-zinc-500 dark:text-zinc-400 mt-1">
                        Огляд ваших активів та витрат
                    </p>
                </div>
                <div className="flex flex-col items-end gap-2 text-right">
                    <div className="flex items-center gap-2">
                        {syncProgress && (
                            <span className="text-[10px] text-zinc-500 animate-pulse font-medium">
                                {syncProgress}
                            </span>
                        )}
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleSync()}
                            disabled={isSyncing}
                            className="bg-zinc-100 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-800"
                        >
                            {isSyncing ? (
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            ) : (
                                <RefreshCw className="h-4 w-4 mr-2" />
                            )}
                            Оновити дані
                        </Button>
                    </div>
                    {lastSyncedAt && (
                        <p className="text-[10px] text-zinc-400 uppercase tracking-wider">
                            ОСТАННЯ СИНХРОНІЗАЦІЯ: {formatDistanceToNow(lastSyncedAt, { addSuffix: true, locale: uk })}
                        </p>
                    )}
                </div>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col min-h-0">
                <TabsList className={cn(
                    "w-full justify-start shrink-0",
                    activeTab === "history" ? "mb-4" : "mb-6"
                )}>
                    <TabsTrigger value="overview" className="flex-1 gap-2">
                        <LayoutDashboard className="h-3.5 w-3.5" />
                        Огляд
                    </TabsTrigger>
                    <TabsTrigger value="history" className="flex-1 gap-2">
                        <HistoryIcon className="h-3.5 w-3.5" />
                        Історія
                    </TabsTrigger>
                    <TabsTrigger value="planning" className="flex-1 gap-2">
                        <CalendarClock className="h-3.5 w-3.5" />
                        Планування
                    </TabsTrigger>
                    <TabsTrigger value="goals" className="flex-1 gap-2">
                        <Target className="h-3.5 w-3.5" />
                        Цілі
                    </TabsTrigger>
                    <TabsTrigger value="forecast" className="flex-1 gap-2">
                        <TrendingUp className="h-3.5 w-3.5" />
                        Прогноз
                    </TabsTrigger>
                    <TabsTrigger value="analytics" className="flex-1 gap-2">
                        <BarChart3 className="h-3.5 w-3.5" />
                        Аналітика
                    </TabsTrigger>
                    <TabsTrigger value="tax" className="flex-1 gap-2">
                        <Receipt className="h-3.5 w-3.5" />
                        Податки
                    </TabsTrigger>
                    <TabsTrigger value="automation" className="flex-1 gap-2">
                        <Zap className="h-3.5 w-3.5" />
                        Автоматизація
                    </TabsTrigger>
                </TabsList>

                <div className={cn(
                    "flex-1 min-h-0 flex flex-col -mx-4 md:-mx-6 px-4 md:px-6",
                    activeTab !== "history" && "overflow-y-auto"
                )}>
                    <div className={cn(
                        "pb-10 pt-1",
                        activeTab === "history" && "flex-1 flex flex-col min-h-0 pb-0"
                    )}>
                        <TabsContent value="overview" className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500 mt-0 focus-visible:outline-none">
                            <FinancialHealthCards data={financialHealth} />

                            {/* Charts grid */}
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                <Card className="border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 shadow-sm">
                                    <CardHeader>
                                        <CardTitle className="text-lg font-medium text-zinc-900 dark:text-zinc-50">Динаміка витрат</CardTitle>
                                    </CardHeader>
                                    <CardContent className="h-[300px]">
                                        {analytics.length > 0 ? (
                                            <ResponsiveContainer width="100%" height="100%">
                                                <AreaChart data={analytics}>
                                                    <defs>
                                                        <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                                                            <stop offset="5%" stopColor="#18181b" stopOpacity={0.1} />
                                                            <stop offset="95%" stopColor="#18181b" stopOpacity={0} />
                                                        </linearGradient>
                                                    </defs>
                                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e4e4e7" opacity={0.5} />
                                                    <XAxis
                                                        dataKey="date"
                                                        axisLine={false}
                                                        tickLine={false}
                                                        tickFormatter={(value) => {
                                                            try {
                                                                const date = new Date(value);
                                                                return isNaN(date.getTime()) ? value : format(date, "d MMM", { locale: uk });
                                                            } catch {
                                                                return value;
                                                            }
                                                        }}
                                                        stroke="#71717a"
                                                        fontSize={12}
                                                        dy={10}
                                                    />
                                                    <YAxis
                                                        axisLine={false}
                                                        tickLine={false}
                                                        stroke="#71717a"
                                                        fontSize={12}
                                                        tickFormatter={(value) => `${value}`}
                                                    />
                                                    <RechartsTooltip
                                                        contentStyle={{ backgroundColor: '#18181b', border: 'none', borderRadius: '8px', color: '#f4f4f5' }}
                                                        itemStyle={{ color: '#f4f4f5' }}
                                                        formatter={(value: any) => value !== undefined ? [`${value} ₴`, 'Сума'] : ['', '']}
                                                        labelFormatter={(label) => {
                                                            try {
                                                                const date = new Date(label);
                                                                return isNaN(date.getTime()) ? String(label) : format(date, "d MMMM yyyy", { locale: uk });
                                                            } catch {
                                                                return String(label);
                                                            }
                                                        }}
                                                    />
                                                    <Area
                                                        type="monotone"
                                                        dataKey="amount"
                                                        stroke="#18181b"
                                                        strokeWidth={2}
                                                        fillOpacity={1}
                                                        fill="url(#colorValue)"
                                                    />
                                                </AreaChart>
                                            </ResponsiveContainer>
                                        ) : (
                                            <div className="h-full flex items-center justify-center text-zinc-400 text-sm">
                                                Немає даних для графіка
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>

                                <Card className="border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 shadow-sm">
                                    <CardHeader>
                                        <CardTitle className="text-lg font-medium text-zinc-900 dark:text-zinc-50">Доходи vs Витрати</CardTitle>
                                    </CardHeader>
                                    <CardContent className="h-[300px]">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <BarChart data={financialStats.barChart} barSize={40}>
                                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e4e4e7" opacity={0.5} />
                                                <XAxis dataKey="name" axisLine={false} tickLine={false} stroke="#71717a" fontSize={12} dy={10} />
                                                <YAxis axisLine={false} tickLine={false} stroke="#71717a" fontSize={12} />
                                                <RechartsTooltip
                                                    cursor={{ fill: '#f4f4f5', opacity: 0.1 }}
                                                    contentStyle={{ backgroundColor: '#18181b', border: 'none', borderRadius: '8px', color: '#f4f4f5' }}
                                                />
                                                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                                                    {financialStats.barChart.map((entry: any, index: number) => (
                                                        <Cell key={`cell-${index}`} fill={index === 0 ? '#18181b' : '#a1a1aa'} />
                                                    ))}
                                                </Bar>
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </CardContent>
                                </Card>
                            </div>

                            {/* Account Management */}
                            <AccountManagement accounts={accounts} onRefresh={fetchData} />
                        </TabsContent>

                        <TabsContent value="planning">
                            <PlanningTab
                                payments={planningData.payments}
                                shoppingItems={planningData.shoppingItems}
                                accounts={accounts}
                                onRefresh={fetchData}
                            />
                        </TabsContent>

                        <TabsContent value="goals">
                            <GoalsTab
                                goals={planningData.goals}
                                accounts={accounts}
                                onRefresh={fetchData}
                            />
                        </TabsContent>

                        <TabsContent value="history" className="flex-1 flex flex-col min-h-0 m-0 focus-visible:outline-none">
                            {/* Transactions List */}
                            <Card className="border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 h-full flex flex-col overflow-hidden gap-0 pb-0">
                                <CardHeader className="border-b border-zinc-200 dark:border-zinc-800 flex flex-row items-center justify-between space-y-0 shrink-0">
                                    <div className="flex items-center gap-2">
                                        <CardTitle className="text-lg font-medium text-zinc-900 dark:text-zinc-50">Історія операцій</CardTitle>
                                        {isFiltering && <Loader2 className="h-4 w-4 animate-spin text-zinc-400" />}
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="hidden lg:flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
                                            <div className="relative shrink-0">
                                                <HistoryIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-400" />
                                                <Input
                                                    type="text"
                                                    placeholder="Пошук..."
                                                    className="h-8 w-28 xl:w-40 bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-md pl-8 pr-3 text-xs focus-visible:ring-1 transition-all placeholder:text-zinc-500 shadow-sm"
                                                    value={searchQuery}
                                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
                                                />
                                            </div>
                                            <Popover open={isDatePopoverOpen} onOpenChange={(open) => {
                                                setIsDatePopoverOpen(open);
                                                if (open) setPendingDateRange(dateRange);
                                            }}>
                                                <PopoverTrigger asChild>
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        className={cn(
                                                            "h-8 text-xs justify-start text-left font-normal w-auto min-w-fit whitespace-nowrap bg-zinc-50 dark:bg-zinc-900/50 border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800 px-3 shadow-sm",
                                                            !dateRange?.from && "text-zinc-500"
                                                        )}
                                                    >
                                                        <CalendarIcon className="mr-2 h-3.5 w-3.5" />
                                                        {dateRange?.from ? (
                                                            dateRange.to ? (
                                                                <>
                                                                    {format(dateRange.from, "LLL dd, y", { locale: uk })} -{" "}
                                                                    {format(dateRange.to, "LLL dd, y", { locale: uk })}
                                                                </>
                                                            ) : (
                                                                format(dateRange.from, "LLL dd, y", { locale: uk })
                                                            )
                                                        ) : (
                                                            <span>Виберіть діапазон дат</span>
                                                        )}
                                                    </Button>
                                                </PopoverTrigger>
                                                <PopoverContent className="w-auto p-0" align="end">
                                                    <Calendar
                                                        initialFocus
                                                        mode="range"
                                                        defaultMonth={pendingDateRange?.from || dateRange?.from}
                                                        selected={pendingDateRange}
                                                        onSelect={setPendingDateRange}
                                                        numberOfMonths={2}
                                                        locale={uk}
                                                    />
                                                    <div className="p-3 border-t border-zinc-100 dark:border-zinc-800 flex justify-between items-center gap-2">
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => {
                                                                const resetVal = { from: undefined, to: undefined };
                                                                setPendingDateRange(resetVal);
                                                                setDateRange(resetVal);
                                                                setIsDatePopoverOpen(false);
                                                            }}
                                                            className="h-8 text-xs text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
                                                        >
                                                            Скинути
                                                        </Button>
                                                        <div className="flex gap-2">
                                                            <Button
                                                                variant="outline"
                                                                size="sm"
                                                                onClick={() => setIsDatePopoverOpen(false)}
                                                                className="h-8 text-xs border-zinc-200 dark:border-zinc-800"
                                                            >
                                                                Скасувати
                                                            </Button>
                                                            <Button
                                                                variant="default"
                                                                size="sm"
                                                                onClick={() => {
                                                                    setDateRange(pendingDateRange);
                                                                    setIsDatePopoverOpen(false);
                                                                }}
                                                                className="h-8 text-xs bg-zinc-900 dark:bg-zinc-100 text-zinc-50 dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-zinc-200"
                                                            >
                                                                Застосувати
                                                            </Button>
                                                        </div>
                                                    </div>
                                                </PopoverContent>
                                            </Popover>

                                            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                                                <SelectTrigger className="h-8 w-auto min-w-[120px] text-xs bg-zinc-50 dark:bg-zinc-900/50 border-zinc-200 dark:border-zinc-800 px-3 gap-2">
                                                    <SelectValue placeholder="Категорія" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="all">Усі категорії</SelectItem>
                                                    <SelectItem value="transfer-special-id">Перекази</SelectItem>
                                                    {categories.map((c: any) => (
                                                        <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            <Select value={selectedProject} onValueChange={setSelectedProject}>
                                                <SelectTrigger className="h-8 w-auto min-w-[110px] text-xs bg-zinc-50 dark:bg-zinc-900/50 border-zinc-200 dark:border-zinc-800 px-3 gap-2">
                                                    <SelectValue placeholder="Проект" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="all">Усі проекти</SelectItem>
                                                    {projects.map((p: any) => (
                                                        <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>

                                            <Select value={selectedAccount} onValueChange={setSelectedAccount}>
                                                <SelectTrigger className="h-8 w-auto min-w-[110px] text-xs bg-zinc-50 dark:bg-zinc-900/50 border-zinc-200 dark:border-zinc-800 font-medium px-3 gap-2">
                                                    <div className="flex items-center gap-2">
                                                        <CreditCard className="h-3 w-3 text-zinc-400 shrink-0" />
                                                        <SelectValue placeholder="Рахунок" />
                                                    </div>
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="all">Усі рахунки</SelectItem>
                                                    {accounts.map((acc: any) => (
                                                        <SelectItem key={acc.id} value={acc.id}>
                                                            <div className="flex items-center gap-2 text-xs">
                                                                <div className={cn(
                                                                    "w-1.5 h-1.5 rounded-full shrink-0",
                                                                    acc.type === 'savings' ? 'bg-amber-400' : 'bg-emerald-400'
                                                                )} />
                                                                {acc.name}
                                                            </div>
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <Button size="sm" className="h-8 text-xs px-3 shadow-sm shrink-0" onClick={() => setTransactionDialogOpen(true)}>
                                            <Plus className="h-3.5 w-3.5 mr-2" />
                                            Додати
                                        </Button>
                                    </div>
                                </CardHeader>
                                <CardContent className="flex-1 overflow-hidden p-0 relative flex flex-col">

                                    <div ref={cardContentRef} className="p-0 flex-1 overflow-y-auto">
                                        {transactions.length === 0 ? (
                                            <div className="p-8 text-center text-zinc-500">
                                                {isFiltering ? <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" /> : "Немає транзакцій для відображення"}
                                            </div>
                                        ) : (
                                            <div className="flex flex-col">
                                                {(() => {
                                                    const groups: { [key: string]: any[] } = {};
                                                    transactions.forEach(tx => {
                                                        const date = new Date(tx.date);
                                                        const dateStr = startOfDay(date).toISOString();
                                                        if (!groups[dateStr]) groups[dateStr] = [];
                                                        groups[dateStr].push(tx);
                                                    });

                                                    return Object.entries(groups)
                                                        .sort(([a], [b]) => b.localeCompare(a))
                                                        .map(([dateStr, groupTxs]) => {
                                                            const date = new Date(dateStr);
                                                            const isToday = format(date, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd');
                                                            const isYesterday = format(date, 'yyyy-MM-dd') === format(new Date(Date.now() - 86400000), 'yyyy-MM-dd');

                                                            const dateLabel = isToday ? 'Сьогодні' : isYesterday ? 'Вчора' : format(date, 'd MMMM yyyy', { locale: uk });

                                                            return (
                                                                <div key={dateStr} className="flex flex-col">
                                                                    <div className="px-4 py-2 bg-zinc-50/50 dark:bg-zinc-900/50 border-y border-zinc-100 dark:border-zinc-800/50 sticky top-0 z-10 backdrop-blur-md">
                                                                        <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-400">
                                                                            {dateLabel}
                                                                        </span>
                                                                    </div>
                                                                    <div className="divide-y divide-zinc-100 dark:divide-zinc-800/50">
                                                                        {groupTxs.map((tx) => (
                                                                            <div
                                                                                key={tx.id}
                                                                                onClick={() => {
                                                                                    setSelectedTransactionForDetail(tx);
                                                                                    setDetailDialogOpen(true);
                                                                                }}
                                                                                className="p-4 hover:bg-zinc-50 dark:hover:bg-zinc-900/30 transition-all duration-200 flex items-center justify-between group cursor-pointer"
                                                                            >
                                                                                <div className="flex items-center gap-4">
                                                                                    <div className={cn(
                                                                                        "w-10 h-10 rounded-xl flex items-center justify-center text-xs font-bold transition-transform group-hover:scale-105",
                                                                                        tx.isTransfer
                                                                                            ? "bg-amber-50 dark:bg-amber-900/20 text-amber-600"
                                                                                            : tx.type === 'income'
                                                                                                ? "bg-zinc-900 dark:bg-white text-zinc-50 dark:text-zinc-900"
                                                                                                : "bg-zinc-100 dark:bg-zinc-800 text-zinc-500"
                                                                                    )}>
                                                                                        {tx.isTransfer ? (
                                                                                            <ArrowLeftRight className="w-5 h-5" />
                                                                                        ) : tx.type === 'income' ? (
                                                                                            <ArrowUpRight className="w-5 h-5" />
                                                                                        ) : (tx.description?.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase() || '??')}
                                                                                    </div>
                                                                                    <div>
                                                                                        <div className="font-semibold text-sm text-zinc-900 dark:text-zinc-50 flex items-center gap-2">
                                                                                            {tx.description}
                                                                                            {tx.projectId && (
                                                                                                <span className="text-[9px] font-black bg-zinc-900 text-zinc-50 dark:bg-zinc-100 dark:text-zinc-950 px-1 py-0 rounded-sm uppercase tracking-wider border border-zinc-800 dark:border-white/10 shadow-none">
                                                                                                    {tx.project?.name || projects.find(p => p.id === tx.projectId)?.name || 'Проєкт'}
                                                                                                </span>
                                                                                            )}
                                                                                        </div>
                                                                                        <div className="text-xs text-zinc-400 mt-0.5 flex items-center gap-1.5">
                                                                                            <span className="font-medium text-zinc-500">{tx.category?.name || 'Без категорії'}</span>
                                                                                            <span className="w-1 h-1 rounded-full bg-zinc-300" />
                                                                                            <span className="text-[10px] uppercase font-bold">{tx.account?.name}</span>
                                                                                        </div>
                                                                                    </div>
                                                                                </div>
                                                                                <div className="text-right">
                                                                                    <div className={cn(
                                                                                        "text-sm font-bold tracking-tight",
                                                                                        tx.type === 'income' ? "text-emerald-600" : "text-zinc-900 dark:text-zinc-100"
                                                                                    )}>
                                                                                        {tx.type === 'income' ? '+' : '-'}{new Intl.NumberFormat('uk-UA').format(tx.amount)} ₴
                                                                                    </div>
                                                                                </div>
                                                                            </div>
                                                                        ))}
                                                                    </div>
                                                                </div>
                                                            );
                                                        });
                                                })()}
                                                <div ref={loadMoreSentinelRef} className="h-10 w-full" />
                                                {hasMore && isLoadingMore && (
                                                    <div className="py-8 flex flex-col items-center justify-center">
                                                        <div className="flex flex-col items-center gap-3">
                                                            <div className="flex gap-1.5">
                                                                <span className="w-1.5 h-1.5 rounded-full bg-zinc-300 dark:bg-zinc-700 animate-bounce [animation-delay:-0.3s]" />
                                                                <span className="w-1.5 h-1.5 rounded-full bg-zinc-300 dark:bg-zinc-700 animate-bounce [animation-delay:-0.15s]" />
                                                                <span className="w-1.5 h-1.5 rounded-full bg-zinc-300 dark:bg-zinc-700 animate-bounce" />
                                                            </div>
                                                            <span className="text-[10px] text-zinc-400 font-medium uppercase tracking-widest">Завантаження...</span>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        </TabsContent>

                        <TabsContent value="forecast">
                            <ForecastTab
                                data={forecastData}
                                whatIfs={whatIfScenarios}
                                onWhatIfChange={setWhatIfScenarios}
                            />
                        </TabsContent>

                        <TabsContent value="analytics">
                            <ProjectsAnalyticsTab projects={projectsProfitability} clients={clientsProfitability} />
                        </TabsContent>

                        <TabsContent value="tax">
                            <TaxTab data={taxStats} accounts={accounts} onSuccess={fetchData} />
                        </TabsContent>

                        <TabsContent value="automation">
                            <AutomationTab
                                rules={automationRules}
                                categories={categories}
                                projects={projects}
                                onRefresh={fetchData}
                            />
                        </TabsContent>
                    </div >
                </div >
            </Tabs >

            <TransactionDialog
                open={transactionDialogOpen}
                onOpenChange={setTransactionDialogOpen}
                accounts={accounts}
                projects={projects}
                onSuccess={fetchData}
            />

            <TransactionDetailDialog
                open={detailDialogOpen}
                onOpenChange={setDetailDialogOpen}
                transaction={selectedTransactionForDetail}
                categories={categories}
                projects={projects}
                onSuccess={fetchData}
            />
        </div >
    );
}

