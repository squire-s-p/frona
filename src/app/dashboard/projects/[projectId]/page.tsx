import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getAuthSession } from "@/lib/auth-session";
import { cn } from "@/lib/utils";
import { bucketsFromEntries } from "@/lib/time-entries";
import { format } from "date-fns";
import { uk } from "date-fns/locale";

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

  let project = null;
  let user = null;

  try {
    const data = await Promise.all([
      prisma.project.findUnique({
        where: { id: projectId },
        include: {
          transactions: {
            orderBy: { date: "desc" },
            select: {
              id: true,
              amount: true,
              date: true,
              description: true,
            }
          },
          timeEntries: {
            orderBy: { startAt: "desc" }
          },
          client: {
            select: { id: true, name: true }
          }
        }
      }),
      prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, targetHourlyRate: true }
      }).catch(() => ({ id: userId, targetHourlyRate: 0 })) as any
    ]);
    project = data[0];
    user = data[1];
  } catch (error) {
    console.error("Failed to fetch project details:", error);
  }

  if (!project) {
    redirect("/dashboard/projects");
  }

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

  const rateNum = (() => {
    if (totalMinutes === 0) return 0;
    const hours = totalMinutes / 60;
    const baseValue = earned > 0 ? earned : Number(project.cost || 0);
    return baseValue / hours;
  })();

  const rate = rateNum > 0 ? `${Math.round(rateNum)} ₴` : "—";

  const targetRate = (user as any)?.targetHourlyRate || 0;
  const targetRateText = targetRate > 0 ? `Ціль: ${targetRate} ₴/год` : "Ціль не встановлена";

  const gaugePercent = targetRate > 0 
    ? Math.min(100, (rateNum / targetRate) * 50)
    : (project.cost && Number(project.cost) > 0 
        ? Math.min(100, (earned / Number(project.cost)) * 100) 
        : 0);

  const totalHours = totalMinutes / 60;
  const rawOptimalCost = totalHours * targetRate;
  // Округлюємо до сотень в більшу сторону
  const optimalCost = Math.ceil(rawOptimalCost / 100) * 100;
  
  const efficiency = Number(project.cost || 0) - rawOptimalCost;
  const isProfitable = efficiency >= 0;

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
      y: 34 - (val / maxChart) * 28, // 34 - низ, 6 - верх
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
              <div className="rounded-2xl border border-border/40 bg-neutral-200/50 dark:bg-neutral-800 p-5 flex flex-col min-h-[320px] overflow-hidden justify-between min-w-0">
                <div>
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-base font-bold text-foreground tracking-tight">Оплати по проєкту</h3>
                  </div>
                  
                  {/* List Header */}
                  <div className="flex justify-between text-[9px] text-muted-foreground font-black mb-3 border-b border-border/50 pb-2 uppercase tracking-widest">
                    <span>Транзакція</span>
                    <span>Дата</span>
                  </div>
                </div>
                
                {/* List Items */}
                <div className="flex-1 overflow-y-auto space-y-3 pr-1 scrollbar-hide mb-6">
                  {project.transactions.length > 0 ? (
                    project.transactions.map((t, i) => (
                      <div key={t.id || i} className="flex justify-between items-start">
                        <div className="flex flex-col min-w-0 pr-2">
                          <span className="text-[11px] font-bold text-foreground truncate">{t.description || "Оплата"}</span>
                          <span className="text-[10px] text-muted-foreground">{Number(t.amount)} ₴</span>
                        </div>
                        <span className="text-[10px] font-bold text-muted-foreground shrink-0 uppercase tracking-tighter">
                          {format(new Date(t.date), "d MMM", { locale: uk })}
                        </span>
                      </div>
                    ))
                  ) : (
                    <div className="h-full flex items-center justify-center opacity-40">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Немає транзакцій</p>
                    </div>
                  )}
                </div>

                <div className="space-y-4">
                  {/* Progress Bar */}
                  <div className="h-1.5 w-full bg-neutral-300 dark:bg-[#2a2a2a] rounded-full overflow-hidden">
                    <div className="h-full bg-foreground rounded-full transition-all duration-500" style={{ width: `${earnedPercent}%` }} />
                  </div>
                  
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-3 sm:gap-2">
                    <div className="shrink-0">
                      <div className="flex items-center gap-1.5 mb-1">
                        <div className="w-1.5 h-1.5 rounded-full bg-foreground" />
                        <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">Оплачено</span>
                      </div>
                      <p className="text-3xl sm:text-4xl font-bold text-foreground tracking-tighter leading-none">
                        {earned} <span className="text-lg font-medium">₴</span>
                      </p>
                    </div>
                    <div className="sm:text-right shrink-0">
                      <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider block mb-1">Залишок</span>
                      <p className="text-lg sm:text-xl font-bold text-foreground/50 tracking-tighter leading-none">
                        {project.cost ? Number(project.cost) - earned : 0} ₴
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* 2. Час роботи (Image 2 style) */}
              <div className="rounded-2xl border border-border/40 bg-neutral-200/50 dark:bg-neutral-800 p-5 flex flex-col min-h-[320px] relative overflow-hidden group min-w-0">
                <div className="flex justify-between items-start mb-2 relative z-10">
                  <h3 className="text-base font-bold text-foreground tracking-tight">Час роботи</h3>
                </div>
                <p className="text-4xl font-bold text-foreground relative z-10 mb-1 tracking-tighter">{workedText}</p>

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

              {/* 3. Ставка / год */}
              <div className="rounded-2xl border border-border/40 bg-neutral-200/50 dark:bg-neutral-800 p-5 flex flex-col min-h-[320px] relative overflow-hidden group min-w-0">
                <div className="flex justify-between items-start mb-2 relative z-10">
                  <h3 className="text-base font-bold text-foreground tracking-tight">Ставка / год</h3>
                </div>

                <div className="flex-1 flex flex-col items-center justify-end mb-10">
                  {/* Gauge Chart */}
                  <div className="relative w-full max-w-[280px] h-32 flex-shrink-0">
                    <svg viewBox="0 0 100 50" className="w-full h-full overflow-visible">
                      <path d="M 10 50 A 40 40 0 0 1 90 50" fill="none" stroke="currentColor" className="text-neutral-300 dark:text-neutral-700" strokeWidth="12" strokeLinecap="round" />
                      <path d="M 10 50 A 40 40 0 0 1 90 50" fill="none" stroke="currentColor" className="text-foreground" strokeWidth="12" strokeLinecap="round" strokeDasharray="125.6" strokeDashoffset={125.6 * (1 - gaugePercent/100)} pathLength="125.6" />
                    </svg>
                    <div className="absolute bottom-0 left-0 right-0 text-center translate-y-2">
                      <div className="text-4xl sm:text-5xl font-bold text-foreground tracking-tighter">{rate}</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* 4. Вартість (Image 4 style) */}
              <div className="rounded-2xl border border-border/40 bg-neutral-200/50 dark:bg-neutral-800 p-6 flex flex-col justify-between min-h-[320px] relative min-w-0">
                 <div className="flex justify-between items-start">
                   <h3 className="text-base font-bold text-foreground tracking-tight">Вартість</h3>
                 </div>
                 <div className="flex flex-col justify-end">
                   <p className="text-4xl sm:text-5xl font-bold text-foreground mb-4 tracking-tighter truncate">
                     {project.cost ? `${project.cost}` : "—"} <span className="text-xl sm:text-2xl text-muted-foreground">₴</span>
                   </p>
                   
                   <div className="space-y-3">
                     <div className="flex flex-wrap gap-2">
                       <span className={cn(
                         "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-medium tracking-wide uppercase transition-colors shadow-sm",
                         "bg-black text-white dark:bg-white dark:text-black"
                       )}>
                         {isProfitable ? (
                           <>
                             <TrendingUp className="h-3.5 w-3.5" />
                             +{Math.abs(Math.round(efficiency))} ₴ до цілі
                           </>
                         ) : (
                           <>
                             <TrendingUp className="h-3.5 w-3.5 rotate-180" />
                             {Math.round(efficiency)} ₴ від цілі
                           </>
                         )}
                       </span>
                     </div>
                     {!isProfitable && (
                       <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest pl-1">
                         Оптимально: <span className="text-foreground">{optimalCost} ₴</span>
                       </p>
                     )}
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
