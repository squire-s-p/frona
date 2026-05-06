"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { addDays, format as dfFormat, isToday } from "date-fns";
import { uk } from "date-fns/locale";
import {
  Play,
  Plus,
  ChevronLeft,
  ChevronRight,
  Square,
  BarChart3,
  History,
  CalendarClock,
} from "lucide-react";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Kbd } from "@/components/ui/kbd";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";

import {
  startWork,
  stopActive,
  getTasksForProject,
  createManualWorkEntry,
  patchActiveTimer,
  updateWorkEntry,
  bulkUpdateTimeEntries,
  deleteTimeEntry,
  getWeeklySummary,
} from "@/app/dashboard/time/actions";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";



import TimeTimeline from "@/components/time/time-timeline";
import TimeEntriesList from "@/components/time/time-entries-list";
import WorkEntryDialog from "@/components/time/work-entry-dialog";
import { WeeklySparkline } from "@/components/time/weekly-sparkline";

import { TaskDialog } from "@/components/tasks/task-dialog";

type Project = { id: string; name: string };

type Entry = {
  id: string;
  type: "work" | "break";
  startAt: Date;
  endAt: Date | null;
  durationSec: number | null;
  note: string | null;
  project: { id: string; name: string } | null;
  task: { id: string; title: string } | null;
};

type ActiveTimer = {
  userId: string;
  mode: "work" | "break";
  startedAt: Date;
  note: string | null;
  project: { id: string; name: string } | null;
  task: { id: string; title: string } | null;
};

function toISODate(d: Date) {
  return dfFormat(d, "yyyy-MM-dd");
}

function formatHeaderDate(d: Date) {
  return dfFormat(d, "EEEE, d MMMM", { locale: uk });
}

function toLocalMinuteISO(d: Date) {
  return dfFormat(d, "yyyy-MM-dd'T'HH:mm");
}

function formatDurationUa(sec: number) {
  const safe = Math.max(0, Math.floor(sec));
  const h = Math.floor(safe / 3600);
  const m = Math.floor((safe % 3600) / 60);

  if (h <= 0) return `${m} хв`;
  if (m <= 0) return `${h} год`;
  return `${h} год ${m} хв`;
}

export default function TimePageClient({
  dateISO,
  timezone,
  activeTimer,
  entries,
  projects,
  tags,
  relevantTasks = [],
}: {
  dateISO: string;
  timezone: string;
  activeTimer: ActiveTimer | null;
  entries: Entry[];
  projects: Project[];
  tags: Array<{ id: string; name: string }>;
  relevantTasks?: Array<{
    id: string;
    title: string;
    projectId: string | null;
    projectName: string | null;
    group: "overdue" | "today" | "tomorrow" | "later" | "no-date";
    dueAt: Date | null;
    priority: string;
  }>;
}) {

  const router = useRouter();

  const hydratedEntries = React.useMemo(() => {
    return (entries || []).map(e => ({
      ...e,
      startAt: new Date(e.startAt),
      endAt: e.endAt ? new Date(e.endAt) : null,
    }));
  }, [entries]);

  const hydratedActiveTimer = React.useMemo(() => {
    if (!activeTimer) return null;
    return {
      ...activeTimer,
      startedAt: new Date(activeTimer.startedAt),
    };
  }, [activeTimer]);

  const date = React.useMemo(() => {
    const [y, m, d] = dateISO.split("-").map(Number);
    return new Date(y, m - 1, d, 0, 0, 0);
  }, [dateISO]);

  const [weeklyData, setWeeklyData] = React.useState<Array<{ dateISO: string; workSec: number }>>([]);

  React.useEffect(() => {
    getWeeklySummary(dateISO).then(setWeeklyData);
  }, [dateISO]);

  const isRunning = !!hydratedActiveTimer;

  const totals = React.useMemo(() => {
    let work = 0;
    let brk = 0;

    // Враховуємо лише робочі записи
    const workEntries = hydratedEntries
      .filter((e) => e.type === "work")
      .sort((a, b) => a.startAt.getTime() - b.startAt.getTime());

    for (let i = 0; i < workEntries.length; i++) {
      const e = workEntries[i];
      work += e.durationSec ?? 0;

      // перерва - це проміжок між поточним endAt та наступним startAt (тільки для роботи)
      if (i < workEntries.length - 1) {
        const next = workEntries[i + 1];
        if (e.endAt && next.startAt > e.endAt) {
          brk += Math.floor((next.startAt.getTime() - e.endAt.getTime()) / 1000);
        }
      }
    }

    return { work, brk, total: work + brk };
  }, [entries]);

  // ✅ Active duration tick
  const [now, setNow] = React.useState(() => Date.now());
  const activeStartedMs = React.useMemo(() => {
    if (!hydratedActiveTimer) return null;
    const d = hydratedActiveTimer.startedAt;
    return Number.isFinite(d.getTime()) ? d.getTime() : null;
  }, [hydratedActiveTimer]);

  React.useEffect(() => {
    if (!activeStartedMs) return;
    setNow(Date.now());
    const t = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(t);
  }, [activeStartedMs]);

  const activeDurationSec = activeTimer && activeStartedMs ? Math.max(0, Math.floor((now - activeStartedMs) / 1000)) : 0;

  // Adjustable Daily Goal (default 8h)
  const [goalHours, setGoalHours] = React.useState(8);
  
  // Load goal from localStorage on mount
  React.useEffect(() => {
    const saved = localStorage.getItem("frona_daily_goal_hours");
    if (saved) {
      const parsed = parseInt(saved, 10);
      if (!isNaN(parsed) && parsed >= 2 && parsed <= 24) {
        setGoalHours(parsed);
      }
    }
  }, []);

  const GOAL_SEC = goalHours * 3600;

  const handleGoalChange = () => {
    const next = goalHours >= 12 ? 4 : goalHours + 2;
    setGoalHours(next);
    localStorage.setItem("frona_daily_goal_hours", next.toString());
  };

  // Audio Notification Logic
  const playBeep = React.useCallback((freq = 440, duration = 0.2) => {
    try {
      const ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      gain.gain.setValueAtTime(0.1, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);
      osc.start();
      osc.stop(ctx.currentTime + duration);
    } catch (e) { console.error("Audio failed", e); }
  }, []);

  // --- Goal Notification Logic ---
  const lastGoalNotifRef = React.useRef(0);

  React.useEffect(() => {
    if (typeof window !== "undefined" && "Notification" in window) {
      if (Notification.permission === "default") {
        Notification.requestPermission();
      }
    }
  }, []);

  React.useEffect(() => {
    const totalNow = totals.work + activeDurationSec;
    // Notify only if goal reached now
    if (totalNow >= GOAL_SEC && lastGoalNotifRef.current < GOAL_SEC) {
      if (Notification.permission === "granted") {
        new Notification("Продуктивність", {
          body: "Вітаємо! Денна ціль досягнута! 🎉",
        });
      }
    }
    lastGoalNotifRef.current = totalNow;
  }, [totals.work, activeDurationSec, GOAL_SEC]);

  // --- Keyboard Shortcuts ---
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is typing in an input/textarea
      const target = e.target as HTMLElement;
      if (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable) return;

      const key = e.key.toLowerCase();
      if (key === "s") {
        e.preventDefault();
        isRunning ? stopActive() : startWork({ projectId: null, taskId: null });
      } else if (key === "n") {
        e.preventDefault();
        setWorkInitialRange(null);
        setEditingWorkEntryId(null);
        setWorkDialogOpen(true);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isRunning, hydratedActiveTimer?.mode]);

  // Trigger beep every hour of active work
  const lastHourRef = React.useRef(0);
  React.useEffect(() => {
    if (hydratedActiveTimer && hydratedActiveTimer.mode === "work" && activeDurationSec > 0) {
      const hours = Math.floor(activeDurationSec / 3600);
      if (hours > lastHourRef.current) {
        playBeep(880, 0.5); // Hourly beep
        lastHourRef.current = hours;
      }
    } else if (!hydratedActiveTimer) {
      lastHourRef.current = 0;
    }
  }, [activeDurationSec, hydratedActiveTimer, playBeep]);

  // Idle Detection Logic
  const [isIdleDialogOpen, setIsIdleDialogOpen] = React.useState(false);
  const [_idleAt, setIdleAt] = React.useState<number | null>(null);
  const IDLE_THRESHOLD_SEC = 5 * 60; // 5 minutes

  React.useEffect(() => {
    if (!activeTimer) {
      setIdleAt(null);
      return;
    }

    let lastActivity = Date.now();
    const handleActivity = () => {
      if (isIdleDialogOpen) return;
      lastActivity = Date.now();
      setIdleAt(null);
    };

    window.addEventListener("mousemove", handleActivity);
    window.addEventListener("keydown", handleActivity);
    window.addEventListener("click", handleActivity);

    const checkInterval = window.setInterval(() => {
      const inactiveSec = Math.floor((Date.now() - lastActivity) / 1000);
      if (inactiveSec >= IDLE_THRESHOLD_SEC && !isIdleDialogOpen) {
        setIdleAt(lastActivity);
        setIsIdleDialogOpen(true);
      }
    }, 5000);

    return () => {
      window.removeEventListener("mousemove", handleActivity);
      window.removeEventListener("keydown", handleActivity);
      window.removeEventListener("click", handleActivity);
      window.clearInterval(checkInterval);
    };
  }, [hydratedActiveTimer, isIdleDialogOpen]);

  const displayEntries = React.useMemo(() => hydratedEntries.filter(e => e.type === "work"), [hydratedEntries]);

  const goTo = (d: Date) => router.push(`/dashboard/time?date=${toISODate(d)}`);
  const goPrev = () => goTo(addDays(date, -1));
  const goNext = () => goTo(addDays(date, 1));
  const goToday = () => router.push(`/dashboard/time`);

  const [pending, startTransition] = React.useTransition();

  // ✅ ГОЛОВНА КНОПКА (одна):
  // - якщо немає таймера -> старт work
  // - якщо є таймер (work/break) -> stopActive() (у тебе це toggle: work->break, break->stop)
  const onMainTimerAction = () => {
    startTransition(async () => {
      if (!hydratedActiveTimer) {
        await startWork({});
        router.refresh();
        return;
      }

      await stopActive();
      router.refresh();
    });
  };

  const _onStopFromMenu = () => {
    startTransition(async () => {
      await stopActive();
      router.refresh();
    });
  };

  const mainButton = React.useMemo(() => {
    if (!hydratedActiveTimer) {
      return {
        icon: <Play className="h-4 w-4" />,
        aria: "Почати роботу",
        title: "Робота",
      };
    }

    return {
      icon: <Square className="h-4 w-4" />,
      aria: "Зупинити",
      title: "Стоп",
    };
  }, [hydratedActiveTimer]);

  const [workDialogOpen, setWorkDialogOpen] = React.useState(false);
  const [workInitialRange, setWorkInitialRange] = React.useState<{ startAt: Date; endAt: Date } | null>(null);

  const [editingWorkEntryId, setEditingWorkEntryId] = React.useState<string | null>(null);

  const editingWorkEntry = React.useMemo(() => {
    if (!editingWorkEntryId) return null;
    return hydratedEntries.find((e) => e.id === editingWorkEntryId && e.type === "work") ?? null;
  }, [hydratedEntries, editingWorkEntryId]);

  const [taskDialogOpen, setTaskDialogOpen] = React.useState(false);
  const [taskDialogProjectId, setTaskDialogProjectId] = React.useState<string | null>(null);

  // Timeline: only WORK segments. Break = empty space.
  const timelineEntries = React.useMemo(() => hydratedEntries.filter((e) => e.type === "work"), [hydratedEntries]);
  const timelineActiveTimer = hydratedActiveTimer?.mode === "work" ? hydratedActiveTimer : null;

  // Hover highlighting state
  const [highlightedId, setHighlightedId] = React.useState<string | null>(null);

  return (
    <div className="flex flex-1 min-h-0 flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="flex items-center gap-3">
          <Button
            size="icon"
            className="h-10 w-10 shrink-0 rounded-full"
            onClick={onMainTimerAction}
            disabled={pending}
            aria-label={mainButton.aria}
            title={mainButton.title}
          >
            {mainButton.icon}
          </Button>
          <h1 className="text-2xl font-semibold tracking-tight">Мій час</h1>
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:ml-auto">
          {/* Date controls */}
          <div className="flex items-center rounded-lg border bg-background p-1 shadow-none">
            <Button size="icon" variant="ghost" className="h-8 w-8" onClick={goPrev} aria-label="Попередній день">
              <ChevronLeft className="h-4 w-4" />
            </Button>

            <Popover>
              <PopoverTrigger asChild>
                <Button variant="ghost" className="h-8 px-3 text-sm font-medium capitalize">
                  {isToday(date) ? "Сьогодні" : formatHeaderDate(date)}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="center">
                <div className="flex flex-col">
                  <Calendar
                    mode="single"
                    selected={date}
                    onSelect={(d) => d && goTo(d)}
                    initialFocus
                    locale={uk}
                    weekStartsOn={1}
                    disabled={(d) => d > new Date()}
                  />
                  <div className="border-t p-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full text-xs"
                      onClick={() => goToday()}
                    >
                      Сьогодні
                    </Button>
                  </div>
                </div>
              </PopoverContent>
            </Popover>

            <Button
              size="icon"
              variant="ghost"
              className="h-8 w-8"
              onClick={goNext}
              aria-label="Наступний день"
              disabled={isToday(date)}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          {/* Primary Actions */}
          <Button
            variant="outline"
            className="h-10 gap-2"
            asChild
          >
            <Link href="/dashboard/reports/projects">
              <BarChart3 className="h-4 w-4" />
              <span>Звіти</span>
            </Link>
          </Button>

          <Button
            variant="outline"
            className="h-10 gap-2"
            onClick={() => {
              setEditingWorkEntryId(null);
              setWorkInitialRange(null);
              setWorkDialogOpen(true);
            }}
          >
            <Plus className="h-4 w-4" />
            <span>Додати запис</span>
          </Button>
        </div>
      </div>

      {/* Relevant Tasks Section */}
      {relevantTasks && relevantTasks.length > 0 && (
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground ml-1">
            <CalendarClock className="h-3.5 w-3.5" />
            <span>Актуальні завдання</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            {relevantTasks
              .slice(0, 4)
              .map((task) => {
                const isOverdue = task.group === "overdue";
                const isTodayTask = task.group === "today";
                const isTomorrowTask = task.group === "tomorrow";

                let badgeLabel = "";
                let badgeClass = "bg-muted text-muted-foreground";

                if (isOverdue) {
                  badgeLabel = task.dueAt ? dfFormat(new Date(task.dueAt), "d MMM", { locale: uk }) : "Прострочено";
                  badgeClass = "bg-transparent text-destructive border-transparent";
                } else if (isTodayTask) {
                  badgeLabel = task.dueAt ? `Сьогодні · ${dfFormat(new Date(task.dueAt), "d MMM", { locale: uk })}` : "Сьогодні";
                  badgeClass = "bg-muted/40 text-muted-foreground border-muted/20";
                } else if (isTomorrowTask) {
                  badgeLabel = task.dueAt ? `Завтра · ${dfFormat(new Date(task.dueAt), "d MMM", { locale: uk })}` : "Завтра";
                  badgeClass = "bg-muted/20 text-muted-foreground/80 border-muted/10";
                } else if (task.group === "later") {
                  badgeLabel = task.dueAt ? dfFormat(new Date(task.dueAt), "d MMM", { locale: uk }) : "Пізніше";
                  badgeClass = "bg-muted/40 text-muted-foreground border-muted/20";
                } else {
                  badgeLabel = "Без дати";
                  badgeClass = "bg-muted/20 text-muted-foreground/80 border-muted/10";
                }

                return (
                  <Button
                    key={task.id}
                    variant="outline"
                    size="sm"
                    className={cn(
                      "h-12 w-full px-4 rounded-xl bg-background/40 hover:bg-muted/30 transition-all border-muted-foreground/10 flex items-center gap-4 group/task",
                      isOverdue && "border-destructive/30 bg-destructive/[0.03]"
                    )}
                    onClick={() => {
                      startTransition(async () => {
                        await startWork({
                          projectId: task.projectId,
                          taskId: task.id,
                          note: "",
                        });
                        router.refresh();
                      });
                    }}
                    disabled={pending}
                  >
                    <div className="flex items-center gap-4 overflow-hidden w-full">
                      <Play className={cn(
                        "h-4 w-4 fill-current shrink-0 transition-transform group-hover/task:scale-110",
                        isOverdue ? "text-destructive" : "text-primary"
                      )} />
                      <div className="flex flex-col items-start min-w-0 flex-1 leading-tight">
                        <span className="truncate text-[14px] font-semibold w-full text-left text-foreground/90 group-hover/task:text-foreground">
                          {task.title}
                        </span>
                        <div className="flex items-center gap-2.5 mt-0.5">
                          {task.projectName && (
                            <span className="shrink-0 text-[11px] font-medium text-muted-foreground/70 uppercase tracking-tighter">
                              {task.projectName}
                            </span>
                          )}
                          {badgeLabel && (
                            <span className={cn("text-[10px] px-1.5 py-0 rounded-[4px] border uppercase tracking-wider font-bold", badgeClass)}>
                              {badgeLabel}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </Button>
                );
              })}
          </div>
        </div>
      )}


      {/* Timeline */}
      <Card className="p-4 gap-0">
        <div className="flex items-start justify-between gap-6">
          <div className="flex flex-col gap-1">
            <div className="text-sm text-muted-foreground">Робота</div>
            <div className="text-2xl font-semibold">{formatDurationUa(totals.work + activeDurationSec)}</div>

            <div className="text-sm text-muted-foreground pt-1">
              Перерва: <span className="text-foreground font-medium">{formatDurationUa(totals.brk)}</span>
            </div>
          </div>

          <div className="ml-auto flex items-end gap-8">
            {/* Weekly Activity Block */}
            <div className="hidden lg:flex pb-1">
              <WeeklySparkline data={weeklyData} selectedDateISO={dateISO} />
            </div>

            <div className="text-right">
              {/* Progress Bar (Goal) moved to right */}
              <div className="w-64 text-left">
                <div className="flex justify-between items-center text-[10px] uppercase font-bold text-muted-foreground mb-1 tracking-wider">
                  <Button
                    variant="ghost"
                    className="h-auto p-0 text-[10px] uppercase font-bold text-muted-foreground hover:text-primary transition-colors flex items-center gap-1 group"
                    onClick={handleGoalChange}
                    title="Змінити ціль"
                  >
                    Денна ціль: {goalHours} год
                    <History className="h-2.5 w-2.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </Button>
                  <span>{Math.min(100, Math.floor(((totals.work + activeDurationSec) / GOAL_SEC) * 100))}%</span>
                </div>
                <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary transition-all duration-1000 ease-out"
                    style={{ width: `${Math.min(100, Math.floor(((totals.work + activeDurationSec) / GOAL_SEC) * 100))}%` }}
                  />
                </div>
                <div className="mt-1 text-[10px] text-muted-foreground italic truncate">
                  {totals.work + activeDurationSec >= GOAL_SEC
                    ? "Ціль досягнута! 🎉"
                    : `Залишилось: ${formatDurationUa(GOAL_SEC - (totals.work + activeDurationSec))}`
                  }
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="mt-4">
          <TimeTimeline
            entries={timelineEntries}
            activeTimer={timelineActiveTimer}
            dateISO={dateISO}
            timezone={timezone}
            highlightedId={highlightedId}
            onSelectWorkRangeAction={(range) => {
              setEditingWorkEntryId(null);
              setWorkInitialRange(range);
              setWorkDialogOpen(true);
            }}
            onEditEntryAction={(entryId) => {
              setWorkInitialRange(null);
              setEditingWorkEntryId(entryId);
              setWorkDialogOpen(true);
            }}
            onResizeEntryAction={(entryId, range) => {
              startTransition(async () => {
                await updateWorkEntry({
                  entryId,
                  startISO: toLocalMinuteISO(range.startAt),
                  endISO: toLocalMinuteISO(range.endAt),
                  // meta не змінюємо при ресайзі
                  projectId: undefined,
                  taskId: undefined,
                  note: undefined,
                });
                router.refresh();
              });
            }}
          />

        </div>
      </Card>

      {/* List */}
      <div className="flex flex-col gap-4">

        {/* Idle Detection Dialog */}
        <AlertDialog open={isIdleDialogOpen} onOpenChange={setIsIdleDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Ви на місці?</AlertDialogTitle>
              <AlertDialogDescription>
                Таймер працює, але ми помітили, що ви були неактивні більше 5 хвилин.
                Що зробити з цим часом?
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="sm:justify-between flex-col sm:flex-row gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  // Keep time, just close
                  setIsIdleDialogOpen(false);
                }}
              >
                Залишити як є
              </Button>
              <AlertDialogAction
                className="bg-destructive hover:bg-destructive/90"
                onClick={() => {
                  // Discard idle time: we move startedAt to now()
                  startTransition(async () => {
                    await patchActiveTimer({
                      startedAt: new Date(), // Reset start to now
                    });
                    setIsIdleDialogOpen(false);
                    router.refresh();
                  });
                }}
              >
                Відкинути неактивний час
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
        <div className="flex items-center justify-end">
          {/* Optional toolbar if needed, or keep clean */}
        </div>

        <TimeEntriesList
          entries={displayEntries}
          projects={projects}
          getTasksForProjectAction={getTasksForProject}
          activeTimer={
            hydratedActiveTimer
              ? {
                mode: hydratedActiveTimer.mode,
                startedAt: hydratedActiveTimer.startedAt,
                note: hydratedActiveTimer.note,
                project: hydratedActiveTimer.project,
                task: hydratedActiveTimer.task,
              }
              : null
          }
          onStopActiveAction={() => {
            startTransition(async () => {
              await stopActive();
              router.refresh();
            });
          }}
          onResumeWorkAction={(item) => {
            startTransition(async () => {
              await startWork({
                projectId: item.project?.id ?? null,
                taskId: item.task?.id ?? null,
                note: item.note ?? null,
              });
              router.refresh();
            });
          }}
          onEditWorkEntryAction={(entryId) => {
            setWorkInitialRange(null);
            setEditingWorkEntryId(entryId);
            setWorkDialogOpen(true);
          }}
          onPatchActiveTimerAction={(patch) => {
            startTransition(async () => {
              await patchActiveTimer(patch);
              router.refresh();
            });
          }}
          onCreateTaskAction={(projectId) => {
            setTaskDialogProjectId(projectId);
            setTaskDialogOpen(true);
          }}
          onBulkUpdateAction={async (payload: { ids: string[]; projectId?: string | null; taskId?: string | null }) => {
            startTransition(async () => {
              await bulkUpdateTimeEntries(payload);
              router.refresh();
            });
          }}
          onHighlightAction={setHighlightedId}
        />
      </div>

      {/* Work entry dialog (create/edit) */}
      <WorkEntryDialog
        open={workDialogOpen}
        onOpenChangeAction={(v: boolean) => {
          setWorkDialogOpen(v);
          if (!v) {
            setWorkInitialRange(null);
            setEditingWorkEntryId(null);
          }
        }}
        day={date}
        projects={projects}
        tags={tags}
        getTasksForProjectAction={getTasksForProject}
        onCreateTaskAction={(pid: string | null) => {
          setTaskDialogProjectId(pid);
          setTaskDialogOpen(true);
        }}
        initialRange={workInitialRange}
        entryId={editingWorkEntryId}
        defaultProjectId={editingWorkEntry?.project?.id ?? null}
        defaultTaskId={editingWorkEntry?.task?.id ?? null}
        defaultStartAt={editingWorkEntry?.startAt ?? undefined}
        defaultEndAt={editingWorkEntry?.endAt ?? undefined}
        onSaveAction={(payload: { startAt: Date; endAt: Date; projectId?: string | null; taskId?: string | null; note?: string | null }) => {
          startTransition(async () => {
            if (editingWorkEntryId) {
              await updateWorkEntry({
                entryId: editingWorkEntryId,
                startISO: toLocalMinuteISO(payload.startAt),
                endISO: toLocalMinuteISO(payload.endAt),
                projectId: payload.projectId ?? null,
                taskId: payload.taskId ?? null,
                note: payload.note ?? null,
              });
            } else {
              await createManualWorkEntry({
                dateISO,
                startISO: toLocalMinuteISO(payload.startAt),
                endISO: toLocalMinuteISO(payload.endAt),
                projectId: payload.projectId ?? null,
                taskId: payload.taskId ?? null,
                note: payload.note ?? null,
              });
            }
            router.refresh();
          });
        }}
        onDeleteAction={async (id) => {
          startTransition(async () => {
            await deleteTimeEntry(id);
            router.refresh();
          });
        }}
        onStartTimerAction={async (payload: { projectId?: string | null; taskId?: string | null }) => {
          startTransition(async () => {
            await startWork(payload);
            router.refresh();
          });
        }}
      />




      {/* TaskDialog (Tasks module) */}
      <TaskDialog
        open={taskDialogOpen}
        onOpenChange={(v) => {
          setTaskDialogOpen(v);
          if (!v) router.refresh();
        }}
        task={null}
        projects={projects}
        tags={tags}
        defaultProjectId={taskDialogProjectId}
      />

      {/* Shortcuts Legend */}
      <div className="mt-auto pt-8 flex justify-center items-center gap-8 text-[11px] text-muted-foreground/30 select-none pointer-events-none font-medium">
        <div className="flex items-center gap-2">
          <Kbd className="bg-transparent border-muted-foreground/15">S</Kbd>
          <span>Старт/Стоп</span>
        </div>
        <div className="flex items-center gap-2">
          <Kbd className="bg-transparent border-muted-foreground/15">N</Kbd>
          <span>Новий запис</span>
        </div>
      </div>

    </div>
  );
}
