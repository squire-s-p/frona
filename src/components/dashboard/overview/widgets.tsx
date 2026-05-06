import * as React from "react";
import {
  Clock, Folder, BarChart3, Zap, Play,
  CheckSquare, StickyNote, Timer, TrendingUp,
  Wallet, ArrowRight, ArrowUpRight,
  Users,
  CheckCircle2, Activity, Landmark, TrendingDown
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export type WidgetType =
  | "PROJECTS_ACTIVE" | "PROJECTS_PROGRESS" | "PROJECTS_RECENT"
  | "TASKS_TODAY" | "TASKS_OVERDUE" | "TASKS_COMPLETION"
  | "CLIENTS_ACTIVE" | "CLIENTS_TOP" | "CLIENTS_RECENT"
  | "TIME_TODAY" | "TIME_WEEKLY" | "TIME_ACTIVE_TIMER"
  | "CALENDAR_TODAY" | "CALENDAR_UPCOMING"
  | "FINANCE_BALANCE" | "FINANCE_INCOME_EXPENSE" | "FINANCE_CASHFLOW" | "FINANCE_TRANSACTIONS"
  | "NOTES_RECENT" | "NOTES_PINNED"
  | "META_QUICK_STATS" | "META_FOCUS" | "QUICK_ACTIONS" | "UPDATES";

export interface WidgetLayout {
  id: string;
  type: WidgetType;
  size: "sm" | "md" | "lg";
}

export const DEFAULT_LAYOUT: WidgetLayout[] = [
  { id: "time-today", type: "TIME_TODAY", size: "sm" },
  { id: "tasks-today", type: "TASKS_TODAY", size: "md" },
  { id: "projects-active", type: "PROJECTS_ACTIVE", size: "sm" },
  { id: "meta-stats", type: "META_QUICK_STATS", size: "lg" },
  { id: "finance-balance", type: "FINANCE_BALANCE", size: "sm" },
  { id: "notes-recent", type: "NOTES_RECENT", size: "sm" },
];

export type DashboardPresetId = "BALANCED" | "FOCUS" | "OPERATIONS" | "FINANCE";

export const DASHBOARD_PRESETS: Record<
  DashboardPresetId,
  { label: string; description: string; layout: Omit<WidgetLayout, "id">[] }
> = {
  BALANCED: {
    label: "Баланс",
    description: "Змішаний огляд усіх ключових зон",
    layout: [
      { type: "TIME_TODAY", size: "sm" },
      { type: "TASKS_TODAY", size: "md" },
      { type: "PROJECTS_ACTIVE", size: "sm" },
      { type: "META_QUICK_STATS", size: "lg" },
      { type: "FINANCE_BALANCE", size: "sm" },
      { type: "NOTES_RECENT", size: "sm" },
    ],
  },
  FOCUS: {
    label: "Фокус",
    description: "Пріоритет на виконання та дисципліну дня",
    layout: [
      { type: "META_FOCUS", size: "md" },
      { type: "TASKS_TODAY", size: "md" },
      { type: "TASKS_COMPLETION", size: "md" },
      { type: "TIME_ACTIVE_TIMER", size: "sm" },
      { type: "TIME_TODAY", size: "sm" },
      { type: "NOTES_PINNED", size: "sm" },
      { type: "QUICK_ACTIONS", size: "md" },
    ],
  },
  OPERATIONS: {
    label: "Операційний",
    description: "Проєкти, клієнти, задачі й контроль процесу",
    layout: [
      { type: "PROJECTS_ACTIVE", size: "sm" },
      { type: "PROJECTS_PROGRESS", size: "md" },
      { type: "CLIENTS_ACTIVE", size: "sm" },
      { type: "CLIENTS_TOP", size: "md" },
      { type: "TASKS_TODAY", size: "md" },
      { type: "TASKS_OVERDUE", size: "sm" },
      { type: "QUICK_ACTIONS", size: "md" },
    ],
  },
  FINANCE: {
    label: "Фінанси",
    description: "Кеш-флоу, транзакції та дохідність по клієнтах",
    layout: [
      { type: "FINANCE_BALANCE", size: "sm" },
      { type: "FINANCE_TRANSACTIONS", size: "md" },
      { type: "CLIENTS_TOP", size: "md" },
      { type: "META_QUICK_STATS", size: "lg" },
      { type: "TIME_WEEKLY", size: "md" },
      { type: "NOTES_PINNED", size: "sm" },
    ],
  },
};

export const WIDGET_CATALOG: { type: WidgetType; label: string; description: string; defaultSize: "sm" | "md" | "lg" }[] = [
  { type: "PROJECTS_ACTIVE", label: "Активні проєкти", description: "Кількість активних проєктів", defaultSize: "sm" },
  { type: "PROJECTS_PROGRESS", label: "Прогрес проєктів", description: "Статус виконання завдань", defaultSize: "md" },
  { type: "PROJECTS_RECENT", label: "Останні проєкти", description: "Останні оновлення у проєктах", defaultSize: "md" },
  { type: "TASKS_TODAY", label: "План на сьогодні", description: "Список справ на сьогодні", defaultSize: "sm" },
  { type: "TASKS_OVERDUE", label: "Прострочені завдання", description: "Критичні дедлайни", defaultSize: "sm" },
  { type: "TASKS_COMPLETION", label: "Статистика завдань", description: "% виконання за тиждень", defaultSize: "md" },
  { type: "CLIENTS_ACTIVE", label: "Активні клієнти", description: "Ваша база клієнтів", defaultSize: "sm" },
  { type: "CLIENTS_TOP", label: "Топ клієнти", description: "Найбільший дохід по клієнтах", defaultSize: "md" },
  { type: "TIME_TODAY", label: "Час сьогодні", description: "Записаний час за день", defaultSize: "sm" },
  { type: "TIME_WEEKLY", label: "Активність тижня", description: "Години поточного тижня", defaultSize: "md" },
  { type: "TIME_ACTIVE_TIMER", label: "Таймер", description: "Активна задача", defaultSize: "sm" },
  { type: "FINANCE_BALANCE", label: "Баланс рахунків", description: "Залишок коштів", defaultSize: "sm" },
  { type: "FINANCE_INCOME_EXPENSE", label: "Дохід та витрати", description: "Порівняння доходів і витрат за місяць", defaultSize: "md" },
  { type: "FINANCE_CASHFLOW", label: "Кеш-флоу", description: "Потік коштів і дохід по клієнтах", defaultSize: "md" },
  { type: "FINANCE_TRANSACTIONS", label: "Останні транзакції", description: "Огляд операцій", defaultSize: "md" },
  { type: "NOTES_RECENT", label: "Останні нотатки", description: "Швидкий доступ до думок", defaultSize: "sm" },
  { type: "NOTES_PINNED", label: "Закріплені нотатки", description: "Кількість важливих нотаток", defaultSize: "sm" },
  { type: "META_QUICK_STATS", label: "Зведена статистика", description: "Огляд всього бізнесу", defaultSize: "lg" },
  { type: "META_FOCUS", label: "Фокус дня", description: "Головні метрики на сьогодні", defaultSize: "md" },
  { type: "QUICK_ACTIONS", label: "Швидкі дії", description: "Навігаційні кнопки", defaultSize: "md" },
];

function formatCurrency(amount: number, currency = "UAH") {
  const num = new Intl.NumberFormat("uk-UA", { maximumFractionDigits: 0 }).format(amount);
  if (currency === "UAH") return `${num} ₴`;
  if (currency === "USD") return `$${num}`;
  if (currency === "EUR") return `€${num}`;
  return `${num} ${currency}`;
}

function formatRelativeTime(dateIso?: string) {
  if (!dateIso) return "Щойно";
  const date = new Date(dateIso);
  const diffMs = Date.now() - date.getTime();
  const minutes = Math.floor(diffMs / (1000 * 60));
  if (minutes < 1) return "Щойно";
  if (minutes < 60) return `${minutes} хв тому`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} год тому`;
  const days = Math.floor(hours / 24);
  return `${days} дн тому`;
}

function WidgetContainer({ icon: Icon, label, size, children, action, className = "", footer }: { icon: React.ElementType; label: string; size: WidgetLayout["size"]; children: React.ReactNode; action?: string; className?: string; footer?: string }) {
  return (
    <Card className={cn("overflow-hidden flex flex-col h-full border shadow-none group", className)}>
      {(size !== "sm") && (
        <CardHeader className="p-4 pb-0 flex flex-row items-center justify-between space-y-0">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Icon className="h-4 w-4 text-muted-foreground" />
            {label}
          </CardTitle>
          {action && (
            <Link href={action} className="text-muted-foreground hover:text-foreground">
              <ArrowRight className="h-4 w-4" />
            </Link>
          )}
        </CardHeader>
      )}
      <CardContent className={cn("p-4 flex-1 flex flex-col", size === "sm" && "justify-between")}>
        {size === "sm" && (
           <div className="flex items-center justify-between mb-2">
              <div className="p-2 bg-muted rounded-md"><Icon className="h-4 w-4 text-muted-foreground" /></div>
              {action && <Link href={action}><ArrowUpRight className="h-4 w-4 text-muted-foreground" /></Link>}
           </div>
        )}
        <div className="flex-1 flex flex-col min-h-0">
          {children}
        </div>
        {footer && <p className="text-[10px] text-muted-foreground mt-2 font-medium uppercase tracking-tight">{footer}</p>}
      </CardContent>
    </Card>
  );
}

// PROJECTS
function ProjectWidget({ size, data, variant }: { size: WidgetLayout["size"]; data: any; variant: string }) {
  const count = data?.projectCount || 0;
  const completionRate = data?.taskCompletionRate ?? 0;
  const overdueTasks = data?.overdueTasksCount ?? 0;

  if (variant === "PROGRESS") {
    return (
      <WidgetContainer icon={Folder} label="Прогрес проєктів" size={size} action="/dashboard/projects">
        <div className="space-y-3 mt-2">
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Виконання задач</span>
              <span className="font-semibold">{completionRate}%</span>
            </div>
            <div className="w-full bg-muted rounded-full h-2">
              <div className="bg-primary h-full rounded-full transition-all" style={{ width: `${completionRate}%` }} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="rounded-md border border-border/50 bg-muted/30 p-2">
              <p className="text-muted-foreground">Активних</p>
              <p className="font-semibold">{count}</p>
            </div>
            <div className="rounded-md border border-border/50 bg-muted/30 p-2">
              <p className="text-muted-foreground">Прострочено</p>
              <p className={cn("font-semibold", overdueTasks > 0 && "text-destructive")}>{overdueTasks}</p>
            </div>
          </div>
        </div>
      </WidgetContainer>
    );
  }

  if (variant === "RECENT") {
    return (
      <WidgetContainer icon={Folder} label="Останні проєкти" size={size} action="/dashboard/projects">
        <div className="space-y-2 mt-2">
          {(data?.recentProjects?.length ?? 0) > 0 ? (
            data.recentProjects.slice(0, size === "lg" ? 5 : 4).map((p: any) => (
              <div key={p.id} className="flex items-center justify-between gap-2 rounded-md border border-border/50 bg-muted/30 p-2">
                <div className="min-w-0">
                  <p className="truncate text-xs font-medium">{p.name}</p>
                  <p className="text-[10px] text-muted-foreground">{p.clientName || "Без клієнта"}</p>
                </div>
                <span className="shrink-0 text-[10px] text-muted-foreground">{formatRelativeTime(p.updatedAt)}</span>
              </div>
            ))
          ) : (
            <p className="text-xs text-muted-foreground">Немає активних проєктів</p>
          )}
        </div>
      </WidgetContainer>
    );
  }

  if (size === "sm") {
    return (
      <WidgetContainer icon={Folder} label="Проєкти" size={size}>
        <span className="text-3xl font-bold leading-none">{count}</span>
        <p className="text-xs text-muted-foreground mt-1">Активних проєктів</p>
      </WidgetContainer>
    );
  }
  return (
    <WidgetContainer icon={Folder} label="Останні проєкти" size={size} action="/dashboard/projects">
       <div className="space-y-2 mt-2">
          {data?.recentProjects?.slice(0, 3).map((p: any) => (
             <div key={p.id} className="flex justify-between items-center p-2 rounded-md bg-muted/40 border border-border/50">
                <span className="text-xs font-medium truncate pr-2">{p.name}</span>
                <Badge variant="outline" className="text-[9px] px-1 py-0">{p.status || "актив"}</Badge>
             </div>
          ))}
       </div>
    </WidgetContainer>
  );
}

// TASKS
function TaskWidget({ size, data, variant }: { size: WidgetLayout["size"]; data: any; variant: string }) {
  if (variant === "COMPLETION" && size !== "sm") {
    const rate = data?.taskCompletionRate || 0;
    return (
      <WidgetContainer icon={Activity} label="Виконання завдань" size={size}>
          <div className="flex-1 flex flex-col justify-center gap-3">
             <div className="w-full bg-muted rounded-full h-2">
                <div className="bg-primary h-full rounded-full transition-all" style={{ width: `${rate}%` }} />
             </div>
             <div className="flex justify-between text-xs font-medium">
                <span>{rate}% виконано</span>
                <span className="text-muted-foreground">План на сьогодні</span>
             </div>
          </div>
      </WidgetContainer>
    );
  }
  const count = variant === "OVERDUE" ? data?.overdueTasksCount : data?.pendingTasksCount;
  if (size === "sm") {
    return (
      <WidgetContainer icon={CheckCircle2} label="Завдання" size={size}>
        <span className={cn("text-3xl font-bold", variant === "OVERDUE" && count > 0 && "text-destructive")}>{count}</span>
        <p className="text-xs text-muted-foreground mt-1">{variant === "OVERDUE" ? "Прострочено" : "Заплановано"}</p>
      </WidgetContainer>
    );
  }
  return (
    <WidgetContainer icon={CheckCircle2} label="План завдань" size={size} action="/dashboard/tasks">
       <div className="space-y-2 mt-2">
          {data?.urgentTasks?.slice(0, 4).map((t: any) => (
             <div key={t.id} className="flex items-center gap-2 text-xs">
                <div className={cn("h-1.5 w-1.5 rounded-full shrink-0", t.priority === "urgent" ? "bg-destructive" : "bg-primary")} />
                <span className="truncate">{t.title}</span>
             </div>
          ))}
       </div>
    </WidgetContainer>
  );
}

// TIME
function TimeWidget({ size, data, variant }: { size: WidgetLayout["size"]; data: any; variant: string }) {
  if (variant === "ACTIVE_TIMER") {
    const isActive = !!data?.hasActiveTimer;
    return (
      <WidgetContainer icon={Timer} label="Таймер" size={size} className={isActive ? "ring-1 ring-primary/20" : ""}>
         <div className="flex-1 flex flex-col justify-center">
            {isActive ? (
               <>
                 <div className="animate-pulse flex items-center gap-2">
                    <span className="text-lg font-bold">У процесі</span>
                    <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                 </div>
                 <p className="mt-1 text-xs text-muted-foreground truncate">{data?.activeTaskName || "Задача не вказана"}</p>
                 <p className="text-[10px] text-muted-foreground truncate">{data?.activeProjectName || "Без проєкту"}</p>
               </>
            ) : <span className="text-sm font-medium text-muted-foreground italic">Немає активності</span>}
         </div>
      </WidgetContainer>
    );
  }
  const h = Math.round(((data?.todayDuration || 0) / 3600) * 10) / 10;
  if (size === "sm") {
    return (
      <WidgetContainer icon={Clock} label="Час" size={size}>
        <span className="text-3xl font-bold">{h}г</span>
        <p className="text-xs text-muted-foreground mt-1">Витрачено сьогодні</p>
      </WidgetContainer>
    );
  }
  return (
    <WidgetContainer icon={BarChart3} label="Тижнева активність" size={size}>
       <div className="flex-1 flex items-end gap-1 px-1">
          {data?.weeklyHours?.map((val: number, i: number) => (
             <div key={i} className="flex-1 flex flex-col items-center gap-1">
                <div className="w-full bg-primary/20 rounded-sm hover:bg-primary/40 transition-colors" style={{ height: `${Math.max((val / Math.max(...data.weeklyHours, 1)) * 40, 2)}px` }} />
             </div>
          ))}
       </div>
    </WidgetContainer>
  );
}

// FINANCE
function FinanceWidget({ size, data, variant }: { size: WidgetLayout["size"]; data: any; variant: string }) {
  const total = data?.financeAccounts?.reduce((s:any, a:any) => s + a.balance, 0) || 0;
  const income = data?.monthlyIncome ?? 0;
  const expense = data?.monthlyExpense ?? 0;
  const net = income - expense;
  const totalFlow = Math.max(income + expense, 1);

  if (variant === "INCOME_EXPENSE") {
    return (
      <WidgetContainer icon={Landmark} label="Дохід і витрати" size={size} action="/dashboard/finance">
        <div className="space-y-2 mt-2">
          <div className="flex items-center justify-between rounded-md border border-border/50 bg-muted/30 p-2 text-xs">
            <span className="inline-flex items-center gap-1.5 text-muted-foreground"><TrendingUp className="h-3 w-3" /> Дохід</span>
            <span className="font-semibold text-emerald-600">{formatCurrency(income)}</span>
          </div>
          <div className="flex items-center justify-between rounded-md border border-border/50 bg-muted/30 p-2 text-xs">
            <span className="inline-flex items-center gap-1.5 text-muted-foreground"><TrendingDown className="h-3 w-3" /> Витрати</span>
            <span className="font-semibold">{formatCurrency(expense)}</span>
          </div>
          <div className="w-full bg-muted rounded-full h-2">
            <div className="bg-emerald-500 h-full rounded-full transition-all" style={{ width: `${Math.round((income / totalFlow) * 100)}%` }} />
          </div>
          <p className={cn("text-xs font-medium", net >= 0 ? "text-emerald-600" : "text-destructive")}>
            {net >= 0 ? "Профіцит" : "Дефіцит"}: {formatCurrency(Math.abs(net))}
          </p>
        </div>
      </WidgetContainer>
    );
  }

  if (variant === "CASHFLOW") {
    return (
      <WidgetContainer icon={BarChart3} label="Кеш-флоу" size={size} action="/dashboard/finance">
        <div className="space-y-2 mt-2">
          <div className="grid grid-cols-3 gap-2 text-xs">
            <div className="rounded-md border border-border/50 bg-muted/30 p-2">
              <p className="text-muted-foreground">Вхід</p>
              <p className="font-semibold text-emerald-600">{formatCurrency(income)}</p>
            </div>
            <div className="rounded-md border border-border/50 bg-muted/30 p-2">
              <p className="text-muted-foreground">Вихід</p>
              <p className="font-semibold">{formatCurrency(expense)}</p>
            </div>
            <div className="rounded-md border border-border/50 bg-muted/30 p-2">
              <p className="text-muted-foreground">Нетто</p>
              <p className={cn("font-semibold", net >= 0 ? "text-emerald-600" : "text-destructive")}>{formatCurrency(net)}</p>
            </div>
          </div>
          <div className="space-y-1">
            {(data?.revenueByClient?.length ?? 0) > 0 ? (
              data.revenueByClient.slice(0, 3).map((c: any, idx: number) => (
                <div key={`${c.name}-${idx}`} className="flex items-center justify-between text-xs">
                  <span className="truncate pr-2 text-muted-foreground">{c.name}</span>
                  <span className="font-medium">{formatCurrency(c.value)}</span>
                </div>
              ))
            ) : (
              <p className="text-xs text-muted-foreground">Немає даних за клієнтами цього місяця</p>
            )}
          </div>
        </div>
      </WidgetContainer>
    );
  }

  if (size === "sm") {
    return (
      <WidgetContainer icon={Wallet} label="Гаманець" size={size}>
         <span className="text-2xl font-bold truncate leading-none mb-1">{formatCurrency(total)}</span>
         <p className="text-[11px] text-muted-foreground font-medium uppercase tracking-tight">Загальний баланс</p>
      </WidgetContainer>
    );
  }
  return (
    <WidgetContainer icon={Landmark} label="Операції" size={size} action="/dashboard/finance">
       <div className="space-y-1 mt-2">
          {data?.recentTransactions?.slice(0, 3).map((t: any) => (
             <div key={t.id} className="flex justify-between items-center text-xs p-1.5 border-b last:border-0 border-border/40">
                <span className="truncate pr-4 text-muted-foreground">{t.description}</span>
                <span className={cn("font-semibold", t.type === "income" ? "text-emerald-500" : "")}>
                   {t.type === "income" ? "+" : ""}{formatCurrency(t.amount)}
                </span>
             </div>
          ))}
       </div>
    </WidgetContainer>
  );
}

// META
function MetaStatsWidget({ data, size }: { data: any; size: WidgetLayout["size"] }) {
  const stats = [
    { label: "Години", val: (Math.round(((data.todayDuration || 0) / 3600) * 10) / 10).toString() + "г", icon: Clock },
    { label: "Клієнти", val: data.activeClientsCount, icon: Users },
    { label: "Дохід", val: formatCurrency(data.monthlyIncome), icon: TrendingUp },
    { label: "Завдання", val: data.pendingTasksCount, icon: CheckSquare },
  ];
  return (
    <WidgetContainer icon={Activity} label="Огляд діяльності" size={size}>
       <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-2">
          {stats.map((s: any, i: number) => (
             <div key={i} className="p-4 rounded-lg bg-muted/40 border border-border/50 flex flex-col gap-2">
                <div className="flex items-center justify-between">
                   <s.icon className="h-4 w-4 text-muted-foreground" />
                   <span className="text-[10px] font-bold text-muted-foreground uppercase">{s.label}</span>
                </div>
                <span className="text-xl font-bold tracking-tight">{s.val}</span>
             </div>
          ))}
       </div>
    </WidgetContainer>
  );
}

function MetaFocusWidget({ data, size }: { data: any; size: WidgetLayout["size"] }) {
  const todayHours = Math.round(((data?.todayDuration || 0) / 3600) * 10) / 10;
  const completionRate = data?.taskCompletionRate ?? 0;
  const overdue = data?.overdueTasksCount ?? 0;
  const statusTone = overdue > 0 ? "text-destructive" : "text-emerald-600";

  return (
    <WidgetContainer icon={Activity} label="Фокус дня" size={size} action="/dashboard/tasks">
      <div className="space-y-2.5 mt-2 text-xs">
        <div className="flex items-center justify-between rounded-md border border-border/50 bg-muted/30 p-2">
          <span className="text-muted-foreground">Час сьогодні</span>
          <span className="font-semibold">{todayHours}г</span>
        </div>
        <div className="flex items-center justify-between rounded-md border border-border/50 bg-muted/30 p-2">
          <span className="text-muted-foreground">Виконання</span>
          <span className="font-semibold">{completionRate}%</span>
        </div>
        <div className="flex items-center justify-between rounded-md border border-border/50 bg-muted/30 p-2">
          <span className="text-muted-foreground">Прострочено</span>
          <span className={cn("font-semibold", statusTone)}>{overdue}</span>
        </div>
      </div>
    </WidgetContainer>
  );
}

// CLIENTS
function ClientsWidget({ size, data, variant }: { size: WidgetLayout["size"]; data: any; variant: string }) {
  if (variant === "ACTIVE" || size === "sm") {
    const count = data?.activeClientsCount ?? 0;
    return (
      <WidgetContainer icon={Users} label="Клієнти" size={size} action="/dashboard/clients">
        <span className="text-3xl font-bold leading-none">{count}</span>
        <p className="text-xs text-muted-foreground mt-1">Активних клієнтів</p>
      </WidgetContainer>
    );
  }

  return (
    <WidgetContainer icon={Users} label="Топ клієнти" size={size} action="/dashboard/clients">
      <div className="space-y-2 mt-2">
        {(data?.topClientsRevenue?.length ?? 0) > 0 ? (
          data.topClientsRevenue.slice(0, size === "lg" ? 5 : 4).map((client: any, idx: number) => (
            <div key={`${client.name}-${idx}`} className="flex items-center justify-between rounded-md border border-border/50 bg-muted/30 p-2">
              <p className="truncate text-xs font-medium pr-3">{client.name}</p>
              <span className="shrink-0 text-xs font-semibold">{formatCurrency(client.value)}</span>
            </div>
          ))
        ) : (
          <p className="text-xs text-muted-foreground">Немає даних по клієнтах</p>
        )}
      </div>
    </WidgetContainer>
  );
}

// QUICK ACTIONS
export function QuickActionsWidget({ size }: { size: WidgetLayout["size"] }) {
  const SettingsIcon = Zap; // Mock icon
  const actions = [
    { href: "/dashboard/time", icon: Play, label: "Таймер" },
    { href: "/dashboard/projects", icon: Folder, label: "Проєкти" },
    { href: "/dashboard/tasks", icon: CheckCircle2, label: "Списки" },
    { href: "/dashboard/finance", icon: Wallet, label: "Фінанси" },
    { href: "/dashboard/notes", icon: StickyNote, label: "Нотатки" },
    { href: "/dashboard/settings", icon: SettingsIcon, label: "Опції" },
  ];
  return (
    <WidgetContainer icon={Zap} label="Швидка навігація" size={size}>
      <div className={`grid ${size === "sm" ? "grid-cols-2" : "grid-cols-3"} gap-2`}>
        {actions.slice(0, size === "sm" ? 4 : 6).map(({ href, icon: Icon, label }: any) => (
          <Link key={href} href={href} className="flex flex-col items-center justify-center p-3 rounded-lg border bg-muted/30 hover:bg-muted transition-all">
            <Icon className="h-4 w-4 mb-2 text-muted-foreground" />
            <span className="text-[10px] font-medium text-center">{label}</span>
          </Link>
        ))}
      </div>
    </WidgetContainer>
  );
}

export function renderWidget(item: WidgetLayout, data: any) {
  const [cat, sub] = item.type.split("_");
  switch (cat) {
    case "PROJECTS": return <ProjectWidget size={item.size} data={data} variant={sub} />;
    case "TASKS": return <TaskWidget size={item.size} data={data} variant={sub} />;
    case "TIME": return <TimeWidget size={item.size} data={data} variant={sub} />;
    case "FINANCE": return <FinanceWidget size={item.size} data={data} variant={sub} />;
    case "META":
      if (sub === "FOCUS") return <MetaFocusWidget data={data} size={item.size} />;
      return <MetaStatsWidget data={data} size={item.size} />;
    case "CLIENTS":
      return <ClientsWidget size={item.size} data={data} variant={sub} />;
    case "QUICK": return <QuickActionsWidget size={item.size} />;
    case "NOTES":
      if (sub === "PINNED" || item.size === "sm") {
        const count = data?.pinnedNotesCount ?? 0;
        return (
          <WidgetContainer icon={StickyNote} label="Нотатки" size={item.size} action="/dashboard/notes">
            <span className="text-3xl font-bold leading-none">{count}</span>
            <p className="text-xs text-muted-foreground mt-1">Закріплених нотаток</p>
          </WidgetContainer>
        );
      }
      return (
        <WidgetContainer icon={StickyNote} label="Останні нотатки" size={item.size} action="/dashboard/notes">
          <div className="space-y-2 mt-2">
            {(data?.recentNotes?.length ?? 0) > 0 ? (
              data.recentNotes.slice(0, item.size === "lg" ? 4 : 3).map((note: any) => (
                <div key={note.id} className="rounded-md border border-border/50 bg-muted/30 p-2">
                  <div className="flex items-center justify-between gap-2">
                    <p className="truncate text-xs font-medium">{note.title || "Без назви"}</p>
                    <span className="shrink-0 text-[10px] text-muted-foreground">{formatRelativeTime(note.updatedAt)}</span>
                  </div>
                  {note.content ? (
                    <p className="mt-1 line-clamp-2 text-[11px] text-muted-foreground">{note.content}</p>
                  ) : null}
                </div>
              ))
            ) : (
              <p className="text-xs text-muted-foreground">Немає нотаток для відображення</p>
            )}
          </div>
        </WidgetContainer>
      );
    default:
      return <div className="p-4 bg-muted/20 border border-dashed rounded-lg h-full flex flex-col items-center justify-center text-[10px] text-muted-foreground"><p>{item.type}</p></div>;
  }
}
