import * as React from "react";
import {
  Clock, Folder, BarChart3, Zap, Bell, Play,
  CheckSquare, StickyNote, Timer, TrendingUp,
  Wallet, ArrowRight, ArrowUpRight, ArrowDownRight,
  AlertCircle, Calendar, Target, FileText,
  TrendingDown, Users, ListFilter, PlusCircle,
  MoreHorizontal, ChevronRight, Square,
  CheckCircle2, Clock3, Ban, Activity, Landmark,
  Trophy, Star
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
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

export const WIDGET_CATALOG: { type: WidgetType; label: string; description: string; defaultSize: "sm" | "md" | "lg" }[] = [
  { type: "PROJECTS_ACTIVE", label: "Активні проєкти", description: "Кількість активних проєктів", defaultSize: "sm" },
  { type: "PROJECTS_PROGRESS", label: "Прогрес проєктів", description: "Статус виконання завдань", defaultSize: "md" },
  { type: "TASKS_TODAY", label: "План на сьогодні", description: "Список справ на сьогодні", defaultSize: "sm" },
  { type: "TASKS_OVERDUE", label: "Прострочені завдання", description: "Критичні дедлайни", defaultSize: "sm" },
  { type: "TASKS_COMPLETION", label: "Статистика завдань", description: "% виконання за тиждень", defaultSize: "md" },
  { type: "CLIENTS_ACTIVE", label: "Активні клієнти", description: "Ваша база клієнтів", defaultSize: "sm" },
  { type: "TIME_TODAY", label: "Час сьогодні", description: "Записаний час за день", defaultSize: "sm" },
  { type: "TIME_WEEKLY", label: "Активність тижня", description: "Години поточного тижня", defaultSize: "md" },
  { type: "TIME_ACTIVE_TIMER", label: "Таймер", description: "Активна задача", defaultSize: "sm" },
  { type: "FINANCE_BALANCE", label: "Баланс рахунків", description: "Залишок коштів", defaultSize: "sm" },
  { type: "FINANCE_TRANSACTIONS", label: "Останні транзакції", description: "Огляд операцій", defaultSize: "md" },
  { type: "NOTES_RECENT", label: "Останні нотатки", description: "Швидкий доступ до думок", defaultSize: "sm" },
  { type: "META_QUICK_STATS", label: "Зведена статистика", description: "Огляд всього бізнесу", defaultSize: "lg" },
  { type: "QUICK_ACTIONS", label: "Швидкі дії", description: "Навігаційні кнопки", defaultSize: "md" },
];

function formatCurrency(amount: number, currency = "UAH") {
  return new Intl.NumberFormat("uk-UA", { style: "currency", currency, maximumFractionDigits: 0 }).format(amount);
}

function WidgetContainer({ icon: Icon, label, size, children, action, className = "", footer }: { icon: React.ElementType; label: string; size: WidgetLayout["size"]; children: React.ReactNode; action?: string; className?: string; footer?: string }) {
  return (
    <Card className={cn("overflow-hidden flex flex-col h-full border shadow-sm group", className)}>
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
function ProjectWidget({ size, data }: { size: WidgetLayout["size"]; data: any }) {
  const count = data?.projectCount || 0;
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
               <div className="animate-pulse flex items-center gap-2">
                  <span className="text-lg font-bold">У процесі</span>
                  <div className="h-1.5 w-1.5 rounded-full bg-primary" />
               </div>
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
function FinanceWidget({ size, data }: { size: WidgetLayout["size"]; data: any }) {
  const total = data?.financeAccounts?.reduce((s:any, a:any) => s + a.balance, 0) || 0;
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
    case "PROJECTS": return <ProjectWidget size={item.size} data={data} />;
    case "TASKS": return <TaskWidget size={item.size} data={data} variant={sub} />;
    case "TIME": return <TimeWidget size={item.size} data={data} variant={sub} />;
    case "FINANCE": return <FinanceWidget size={item.size} data={data} />;
    case "META": return <MetaStatsWidget data={data} size={item.size} />;
    case "QUICK": return <QuickActionsWidget size={item.size} />;
    case "NOTES": return (
      <WidgetContainer icon={StickyNote} label="Нотатки" size={item.size}>
         <div className="flex-1 flex flex-col justify-center py-2 opacity-50">
            <ListFilter className="h-6 w-6 mb-1 mx-auto" />
            <p className="text-[10px] font-medium text-center">Останні нотатки</p>
         </div>
      </WidgetContainer>
    );
    default:
      return <div className="p-4 bg-muted/20 border border-dashed rounded-lg h-full flex flex-col items-center justify-center text-[10px] text-muted-foreground"><p>{item.type}</p></div>;
  }
}
