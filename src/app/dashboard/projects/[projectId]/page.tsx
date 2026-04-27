import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getAuthSession } from "@/lib/auth-session";
import { bucketsFromEntries } from "@/lib/time-entries";

import { Card } from "@/components/ui/card";
import ProjectTimeChart from "@/components/projects/project-time-chart";

import { TrashIcon } from "@/components/icons/trash";
import { Badge } from "@/components/ui/badge";
import ProjectHeader from "@/components/projects/project-header";
import ProjectDetailsCard from "@/components/projects/project-details-card";

import ProjectTasksClient from "@/components/projects/project-tasks-client";
import { 
  Wallet, Clock, Coins, Banknote, 
  Sparkles, TrendingUp, BadgePercent, DollarSign, ShoppingBag, BarChart2, Percent,
  MoreVertical, ChevronDown, Briefcase
} from "lucide-react";

type ActiveTimer = any;

export default async function ProjectDetailsPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const session = await getAuthSession();
  const userId = session?.user?.id;

  if (!userId) {
    redirect("/login?callbackUrl=/dashboard/projects");
  }

  const resolved = await params;
  const projectId =
    typeof resolved?.projectId === "string" ? resolved.projectId.trim() : "";

  if (!projectId) {
    redirect("/dashboard/projects");
  }

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: {
      id: true,
      userId: true,
      name: true,
      status: true,

      description: true,
      source: true,
      clientName: true, // legacy
      site: true,
      cost: true,
      accesses: true,
      clientContact: true, // legacy
      notes: true,

      // ✅ NEW: relation to Client
      client: {
        select: {
          id: true,
          name: true,
        },
      },

      timeEntries: {
        orderBy: { startAt: "desc" },
        take: 500,
        select: { startAt: true, endAt: true },
      },
      transactions: {
        where: { type: "income" },
        select: { amount: true, date: true, description: true },
        orderBy: { date: "desc" },
      },
    },
  });

  if (!project || project.userId !== userId) {
    redirect("/dashboard/projects");
  }

  const isArchived = project.status === "archived";

  const tasks = isArchived
    ? []
    : await prisma.task.findMany({
        where: { userId, projectId },
        orderBy: { updatedAt: "desc" },
        select: {
          id: true,
          title: true,
          description: true,
          status: true,
          priority: true,
          startAt: true,
          endAt: true,
          createdAt: true,
          updatedAt: true,
          project: { select: { id: true, name: true } },
          _count: { select: { comments: true } },
        },
      });

  const projectsOptions = isArchived
    ? []
    : await prisma.project.findMany({
        where: { userId, status: { not: "archived" } },
        orderBy: { updatedAt: "desc" },
        select: { id: true, name: true },
      });

  // ✅ NEW: clients for combobox (only for non-archived)
  const clients = isArchived
    ? []
    : await prisma.client.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        select: { id: true, name: true },
      });

  // 4) Time buckets (ALL period)
  const entries = project.timeEntries;
  const oldestStart = entries.length
    ? new Date(entries[entries.length - 1].startAt)
    : new Date();
  const daysAll = Math.max(
    1,
    Math.ceil((Date.now() - oldestStart.getTime()) / (24 * 60 * 60 * 1000)) + 1
  );

  const bucketsAll = bucketsFromEntries(entries, daysAll);

  // --- Calculations for Finance section ---
  const totalMinutes = bucketsAll.reduce((acc, b) => acc + b.minutes, 0);
  const workedText = (() => {
    if (totalMinutes === 0) return "—";
    const h = Math.floor(totalMinutes / 60);
    const m = totalMinutes % 60;
    if (h === 0) return `${m}хв`;
    if (m === 0) return `${h}г`;
    return `${h}г\u00A0${m}хв`;
  })();

  const earned = project.transactions.reduce((acc, t) => acc + Number(t.amount), 0);
  const earnedText = earned > 0 ? `${earned} ₴` : "—";

  const rate = (() => {
    if (totalMinutes === 0) return "—";
    const hours = totalMinutes / 60;
    const baseValue = earned > 0 ? earned : Number(project.cost || 0);
    if (baseValue === 0) return "—";
    return `${Math.round(baseValue / hours)} ₴`;
  })();

  const earnedPercent = project.cost && Number(project.cost) > 0 
    ? Math.min(100, Math.max(0, (earned / Number(project.cost)) * 100)) 
    : 0;

  // Динамічний графік для "Час роботи" (Синхронізовано з ProjectTimeChart)
  let chartPath = "M0 40 L 100 40";
  let fillPath = "M0 40 L 100 40 Z";
  
  if (bucketsAll.length > 0) {
    // Знаходимо перший та останній дні з активністю, як у великому графіку
    const firstIdx = bucketsAll.findIndex(b => b.minutes > 0);
    const lastIdx = bucketsAll.findLastIndex ? bucketsAll.findLastIndex(b => b.minutes > 0) : bucketsAll.map(b => b.minutes > 0).lastIndexOf(true);
    
    let slicedBuckets = bucketsAll;
    if (firstIdx !== -1 && lastIdx !== -1) {
      slicedBuckets = bucketsAll.slice(firstIdx, lastIdx + 1);
    }

    const chartData = slicedBuckets.map(b => b.minutes);
    const maxChart = Math.max(...chartData, 1);
    
    const chartPoints = chartData.map((val, i) => ({
      x: chartData.length > 1 ? (i / (chartData.length - 1)) * 100 : 50,
      y: 40 - (val / maxChart) * 35,
    }));
    
    if (chartPoints.length > 0) {
      chartPath = `M ${chartPoints[0].x} ${chartPoints[0].y}`;
      for (let i = 1; i < chartPoints.length; i++) {
        const prev = chartPoints[i - 1];
        const curr = chartPoints[i];
        const midX = (prev.x + curr.x) / 2;
        chartPath += ` C ${midX} ${prev.y}, ${midX} ${curr.y}, ${curr.x} ${curr.y}`;
      }
      fillPath = `${chartPath} L 100 40 L 0 40 Z`;
    }
  }

  return (
    <div className="absolute inset-0 overflow-y-auto scrollbar-hide bg-background">
      <div className="p-4 md:p-6 pb-20 space-y-6">
        {/* TOP BAR / BREADCRUMBS handled by ProjectHeader */}
        <ProjectHeader
          projectId={project.id}
          name={project.name}
          status={project.status as any}
          client={project.client}
        />

        {/* TOP ROW: Details / Tasks + Finance */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">

          {/* LEFT — Details (full height) */}
          <div className="lg:col-span-7 h-full">
            <ProjectDetailsCard
              projectId={project.id}
              status={project.status as any}
              clients={clients}
              initialClientId={project.client?.id ?? null}
              initial={{
                name: project.name,
                description: project.description ?? null,
                source: project.source ?? null,
                clientName: project.clientName ?? null,
                site: project.site ?? null,
                cost: project.cost ? project.cost.toString() : null,
                clientContact: project.clientContact ?? null,
                accesses: project.accesses ?? null,
                notes: project.notes ?? null,
              }}
            />
          </div>

          {/* RIGHT — Tasks + Finance */}
          <div className="lg:col-span-5 flex flex-col gap-5 h-full">

            {/* Tasks Block */}
            {!isArchived && (
              <div className="rounded-2xl border bg-neutral-100 dark:bg-neutral-900 shadow-none flex flex-col flex-1 min-h-[300px] overflow-hidden">
                <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-border/50">
                  <h2 className="text-base font-bold tracking-tight text-foreground">Список задач</h2>
                </div>
                <ProjectTasksClient initialTasks={tasks} projects={projectsOptions} projectId={project.id} />
              </div>
            )}

            {/* Analytics Block */}
            <div className="rounded-2xl border bg-neutral-100 dark:bg-neutral-900 shadow-none overflow-hidden">
              <div className="px-5 pt-5 pb-4 border-b border-border/50">
                <h2 className="text-base font-bold tracking-tight text-foreground">Часові звіти</h2>
              </div>
              <div className="p-5">
                <ProjectTimeChart buckets={bucketsAll} />
              </div>
            </div>

          </div>
        </div>

        {/* BOTTOM ROW: Finance */}
        <div className="rounded-2xl border bg-neutral-100 dark:bg-neutral-900 shadow-none overflow-hidden mt-5 w-full">
          <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-border/50">
            <h2 className="text-base font-bold tracking-tight text-foreground">Фінансовий звіт</h2>
          </div>
          
          <div className="p-5 flex flex-col gap-5">
            {/* 4 детальні картки */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
              
              {/* 1. Оплати (Image 1 style) */}
              <div className="rounded-2xl border border-border/40 bg-neutral-200/50 dark:bg-[#161616] p-5 flex flex-col h-[340px] overflow-hidden">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-sm font-bold text-foreground tracking-tight">Оплати по проєкту</h3>
                  <MoreVertical className="h-4 w-4 text-muted-foreground" />
                </div>
                
                {/* Progress Bar */}
                <div className="h-2 w-full bg-neutral-300 dark:bg-[#2a2a2a] rounded-full overflow-hidden mb-3 shrink-0">
                  <div className="h-full bg-foreground rounded-full transition-all" style={{ width: `${earnedPercent}%` }} />
                </div>
                
                {/* Legend */}
                <div className="flex justify-between text-xs mb-6 shrink-0">
                  <div>
                    <div className="flex items-center gap-1.5 mb-1">
                      <div className="w-2.5 h-2.5 rounded-sm bg-foreground" />
                      <span className="text-foreground font-semibold">Оплачено</span>
                    </div>
                    <span className="text-foreground font-bold text-sm">
                      {earned} ₴ <span className="text-muted-foreground font-medium">({Math.round(earnedPercent)}%)</span>
                    </span>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-1.5 mb-1 justify-end">
                      <div className="w-2.5 h-2.5 rounded-sm bg-neutral-400 dark:bg-[#333]" />
                      <span className="text-foreground font-semibold">Залишок</span>
                    </div>
                    <span className="text-foreground font-bold text-sm">
                      {project.cost ? Number(project.cost) - earned : 0} ₴ <span className="text-muted-foreground font-medium">({100 - Math.round(earnedPercent)}%)</span>
                    </span>
                  </div>
                </div>

                {/* List Header */}
                <div className="flex justify-between text-[10px] text-muted-foreground font-bold mb-3 border-b border-border/50 pb-2 shrink-0">
                  <span className="uppercase tracking-wider">Транзакція</span>
                  <span className="uppercase tracking-wider">Дата</span>
                </div>
                
                {/* List Items */}
                <div className="flex-1 overflow-y-auto space-y-3 pr-1 scrollbar-hide">
                  {project.transactions.map((t, i) => (
                    <div key={i} className="flex justify-between items-center border-b border-border/40 pb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-foreground truncate max-w-[120px]">{t.description || "Оплата"}</span>
                      </div>
                      <div className="flex flex-col items-end">
                         <span className="text-[10px] text-muted-foreground">{t.date.toLocaleDateString("uk-UA")}</span>
                         <span className="text-xs font-bold text-green-600 dark:text-green-500">+{Number(t.amount)} ₴</span>
                      </div>
                    </div>
                  ))}
                  {project.transactions.length === 0 && (
                     <div className="text-xs text-muted-foreground text-center py-4">Немає транзакцій</div>
                  )}
                </div>
              </div>

              {/* 2. Час роботи (Image 2 style) */}
              <div className="rounded-2xl border border-border/40 bg-neutral-200/50 dark:bg-[#161616] p-5 flex flex-col h-[340px] relative overflow-hidden group">
                <div className="flex justify-between items-start mb-2 relative z-10">
                  <h3 className="text-base font-bold text-foreground tracking-tight">Час роботи</h3>
                </div>
                <p className="text-4xl font-bold text-foreground relative z-10 mb-1 tracking-tighter">{workedText}</p>
                <p className="text-sm text-muted-foreground font-medium relative z-10">Загальний час</p>

                {/* Line Chart */}
                <div className="absolute bottom-0 left-0 right-0 h-32 opacity-80 group-hover:opacity-100 transition-opacity">
                  <svg viewBox="0 0 100 40" className="w-full h-full preserve-3d" preserveAspectRatio="none">
                    <defs>
                      <linearGradient id="lineGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="currentColor" stopOpacity="0.1" />
                        <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
                      </linearGradient>
                    </defs>
                    <path
                      d={fillPath}
                      fill="url(#lineGrad)"
                      className="text-neutral-400 dark:text-neutral-500"
                    />
                    <path
                      d={chartPath}
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      vectorEffect="non-scaling-stroke"
                      className="text-neutral-400 dark:text-neutral-200"
                    />
                  </svg>
                </div>
              </div>

              {/* 3. Ставка / год (Image 3 style) */}
              <div className="rounded-2xl border border-border/40 bg-neutral-200/50 dark:bg-[#161616] p-5 flex flex-col items-center h-[340px]">
                <div className="flex justify-center mb-8 w-full mt-2">
                  <div className="bg-background/50 border border-border/50 text-xs font-medium text-foreground rounded-lg px-3 py-1.5 flex items-center gap-2 cursor-pointer hover:bg-background transition-colors">
                    Report <ChevronDown className="h-3 w-3" />
                  </div>
                </div>
                
                {/* Gauge Chart */}
                <div className="relative w-40 h-24 overflow-hidden mb-6 flex-shrink-0">
                  <svg viewBox="0 0 100 50" className="w-full h-full overflow-visible">
                    <path d="M 10 50 A 40 40 0 0 1 90 50" fill="none" stroke="currentColor" className="text-neutral-300 dark:text-neutral-800" strokeWidth="8" strokeDasharray="3 3" strokeLinecap="round" />
                    <path d="M 10 50 A 40 40 0 0 1 90 50" fill="none" stroke="currentColor" className="text-foreground" strokeWidth="8" strokeDasharray="3 3" strokeLinecap="round" strokeDashoffset={125.6 * (1 - earnedPercent/100)} pathLength="125.6" />
                  </svg>
                  <div className="absolute bottom-0 left-0 right-0 text-center flex flex-col items-center translate-y-1">
                    <div className="text-2xl font-bold text-foreground tracking-tight">{rate}</div>
                    <div className="text-[10px] text-muted-foreground font-medium uppercase">Ставка / год</div>
                  </div>
                </div>
                
                <p className="text-xs text-muted-foreground mb-auto">{Math.round(earnedPercent)}% Виконання</p>
              </div>

              {/* 4. Вартість (Image 4 style) */}
              <div className="rounded-2xl border border-border/40 bg-neutral-200/50 dark:bg-[#161616] p-6 flex flex-col justify-center h-[340px] relative">
                 <div className="flex justify-between items-start mb-6">
                   <h3 className="text-base font-bold text-foreground tracking-tight">Вартість</h3>
                   <div className="h-10 w-10 rounded-xl bg-background border border-border/50 flex items-center justify-center">
                      <Briefcase className="h-5 w-5 text-muted-foreground" />
                   </div>
                 </div>
                 
                 <div className="flex-1 flex flex-col justify-center">
                   <p className="text-5xl font-bold text-foreground mb-4 tracking-tighter truncate">
                     {project.cost ? `${project.cost}` : "—"} <span className="text-2xl text-muted-foreground">₴</span>
                   </p>
                   
                   <div>
                     <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-green-500/10 text-green-600 dark:text-green-500 text-xs font-bold tracking-wide">
                       <TrendingUp className="h-3.5 w-3.5" />
                       Встановлено бюджет
                     </span>
                   </div>
                 </div>
              </div>

            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
