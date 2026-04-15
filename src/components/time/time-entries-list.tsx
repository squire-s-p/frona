"use client";

import * as React from "react";
import { format } from "date-fns";
import { uk } from "date-fns/locale";
import {
  MoreHorizontal,
  Play,
  Briefcase,
  Coffee,
  Square,
  Check,
  Plus,
  Folder,
  Minus,
  ChevronsUpDown,
} from "lucide-react";

import { cn } from "@/lib/utils";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList
} from "@/components/ui/command";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export type TimeEntryType = "work" | "break";

export type TimeEntriesListItem = {
  id: string;
  type: TimeEntryType;

  startAt: Date;
  endAt: Date | null;

  durationSec?: number | null;

  project?: { id: string; name: string } | null;
  task?: { id: string; title: string } | null;

  note?: string | null;
};

type Project = { id: string; name: string };
type Task = { id: string; title: string; status?: string };

type ActiveTimerView = {
  mode: "work" | "break";
  startedAt: Date;
  note: string | null;
  project: { id: string; name: string } | null;
  task: { id: string; title: string } | null;
} | null;

type Props = {
  entries: TimeEntriesListItem[];

  activeTimer?: ActiveTimerView;
  onStopActiveAction?: () => void;
  onResumeWorkAction?: (entry: TimeEntriesListItem) => void;
  onEditWorkEntryAction?: (entryId: string) => void;

  projects: Project[];
  getTasksForProjectAction: (projectId: string) => Promise<Task[]>;
  onPatchActiveTimerAction: (patch: { projectId?: string | null; taskId?: string | null }) => void;
  onCreateTaskAction: (projectId: string | null) => void;
  onBulkUpdateAction: (payload: { ids: string[]; projectId?: string | null; taskId?: string | null }) => Promise<void>;
  onHighlightAction?: (id: string | null) => void;

  className?: string;
};

function safeDate(v: unknown): Date | null {
  const d = new Date(v as any);
  return Number.isFinite(d.getTime()) ? d : null;
}

function formatDurationUa(sec: number) {
  const safe = Math.max(0, Math.floor(sec));
  const h = Math.floor(safe / 3600);
  const m = Math.floor((safe % 3600) / 60);

  if (h <= 0) return `${m} хв`;
  if (m <= 0) return `${h} год`;
  return `${h} год ${m} хв`;
}

function formatTimeRange(startAt: Date, endAt: Date | null) {
  const start = format(startAt, "HH:mm", { locale: uk });
  const end = endAt ? format(endAt, "HH:mm", { locale: uk }) : "…";
  return `${start} - ${end}`;
}

function computeDurationSec(item: TimeEntriesListItem) {
  if (typeof item.durationSec === "number") return item.durationSec;
  if (item.endAt) {
    const ms = item.endAt.getTime() - item.startAt.getTime();
    return Math.max(0, Math.floor(ms / 1000));
  }
  return 0;
}

function getTitle(item: TimeEntriesListItem) {
  if (item.type === "break") return "Перерва";
  if (item.task?.title) return item.task.title;
  if (item.note?.trim()) return item.note.trim();
  return "(Без опису)";
}

// Internal reusable Combobox
function Combobox({
  value,
  onChange,
  items,
  placeholder,
  emptyText,
  disabled,
  actionLabel,
  actionDisabled,
  onAction,
}: {
  value: string | null;
  onChange: (next: string | null) => void;
  items: Array<{ value: string; label: string }>;
  placeholder: string;
  emptyText: string;
  disabled?: boolean;

  actionLabel?: string;
  actionDisabled?: boolean;
  onAction?: () => void;
}) {
  const [open, setOpen] = React.useState(false);
  const selected = items.find((i) => i.value === value) ?? null;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
          disabled={disabled}
        >
          <span className={cn("truncate", !selected && "text-muted-foreground")}>
            {selected ? selected.label : placeholder}
          </span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>

      <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
        <Command>
          <CommandInput placeholder="Пошук..." />
          <CommandList>
            <CommandEmpty>{emptyText}</CommandEmpty>
            <CommandGroup>
              <CommandItem
                value="__clear__"
                onSelect={() => {
                  onChange(null);
                  setOpen(false);
                }}
              >
                <Check className={cn("mr-2 h-4 w-4", value === null ? "opacity-100" : "opacity-0")} />
                <span className="truncate">(Не вибрано)</span>
              </CommandItem>

              {items.map((i) => (
                <CommandItem
                  key={i.value}
                  value={i.label}
                  onSelect={() => {
                    onChange(i.value);
                    setOpen(false);
                  }}
                >
                  <Check className={cn("mr-2 h-4 w-4", value === i.value ? "opacity-100" : "opacity-0")} />
                  <span className="truncate">{i.label}</span>
                </CommandItem>
              ))}

              {actionLabel ? (
                <>
                  <div className="my-1 h-px bg-border" />
                  <CommandItem
                    value={actionLabel}
                    disabled={actionDisabled}
                    onSelect={() => {
                      if (actionDisabled) return;
                      onAction?.();
                      setOpen(false);
                    }}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    {actionLabel}
                  </CommandItem>
                </>
              ) : null}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

function BulkTaskSelector({
  projects,
  getTasksForProjectAction,
  onSave
}: {
  projects: Project[];
  getTasksForProjectAction: (id: string) => Promise<Task[]>;
  onSave: (pid: string | null, tid: string | null) => void;
}) {
  const [projectId, setProjectId] = React.useState<string | null>(null);
  const [taskId, setTaskId] = React.useState<string | null>(null);
  const [tasks, setTasks] = React.useState<Task[]>([]);
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    if (!projectId) {
      setTasks([]);
      return;
    }
    let active = true;
    setLoading(true);
    getTasksForProjectAction(projectId).then(res => {
      if (active) {
        setTasks(res);
        setLoading(false);
      }
    });
    return () => { active = false; };
  }, [projectId, getTasksForProjectAction]);

  const projectItems = React.useMemo(() => projects.map(p => ({ value: p.id, label: p.name })), [projects]);
  const taskItems = React.useMemo(() => tasks.map(t => ({ value: t.id, label: t.title })), [tasks]);

  return (
    <div className="space-y-3">
      <div className="space-y-2">
        <Label>1. Виберіть проєкт</Label>
        <Combobox
          value={projectId}
          onChange={(v) => { setProjectId(v); setTaskId(null); }}
          items={projectItems}
          placeholder="Проєкт..."
          emptyText="Немає проєктів"
        />
      </div>
      <div className="space-y-2">
        <Label>2. Виберіть задачу</Label>
        <Combobox
          value={taskId}
          onChange={setTaskId}
          items={taskItems}
          placeholder="Задача..."
          emptyText={projectId ? "Немає задач" : "Спочатку проєкт"}
          disabled={!projectId || loading}
        />
      </div>
      <div className="flex justify-end pt-2">
        <Button size="sm" onClick={() => onSave(projectId, taskId)}>
          Застосувати
        </Button>
      </div>
    </div>
  );
}

import { bulkDeleteTimeEntries } from "@/app/dashboard/time/actions";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";

export default function TimeEntriesList({
  entries,
  activeTimer,
  onStopActiveAction,
  onResumeWorkAction,
  onEditWorkEntryAction,
  projects,
  getTasksForProjectAction,
  onPatchActiveTimerAction,
  onCreateTaskAction,
  onBulkUpdateAction,
  onHighlightAction,
  className,
}: Props) {
  const router = useRouter();
  const [isPending, startTransition] = React.useTransition();
  const [selectedIds, setSelectedIds] = React.useState<Record<string, boolean>>({});
  const [hideBreaks, setHideBreaks] = React.useState(false);
  const [expandedGroups, setExpandedGroups] = React.useState<Record<string, boolean>>({});

  const ordered = React.useMemo(() => {
    return [...entries].sort((a, b) => b.startAt.getTime() - a.startAt.getTime());
  }, [entries]);

  const groupedEntries = React.useMemo(() => {
    type Group = {
      id: string; // key
      entries: TimeEntriesListItem[];
      totalDuration: number;
      latestStart: Date;
    };

    const groups: Group[] = [];
    const groupMap = new Map<string, Group>();

    for (const entry of ordered) {
      if (entry.type === "break") continue;
      const key = `${entry.project?.id ?? "no-project"}-${entry.task?.id ?? "no-task"}-${entry.note?.trim() ?? "no-note"}`;
      let group = groupMap.get(key);
      if (!group) {
        group = { id: key, entries: [], totalDuration: 0, latestStart: entry.startAt };
        groupMap.set(key, group);
        groups.push(group);
      }
      group.entries.push(entry);
      group.totalDuration += computeDurationSec(entry);
      if (entry.startAt > group.latestStart) group.latestStart = entry.startAt;
    }

    // Sort groups by latest start
    groups.sort((a, b) => b.latestStart.getTime() - a.latestStart.getTime());

    return groups;
  }, [ordered]);

  const allSelected = ordered.length > 0 && ordered.every((e) => selectedIds[e.id]);
  const anySelected = React.useMemo(() => Object.values(selectedIds).some(Boolean), [selectedIds]);

  const toggleAll = (next: boolean) => {
    const map: Record<string, boolean> = {};
    for (const e of ordered) map[e.id] = next;
    setSelectedIds(map);
  };

  const toggleOne = (id: string, next: boolean) => {
    setSelectedIds((prev) => ({ ...prev, [id]: next }));
  };

  // Correct totals calculation (summing Work vs Gaps)
  const totals = React.useMemo(() => {
    let work = 0;
    let brk = 0;
    let selected = 0;

    // 1. Sum explicit work entries
    for (const e of ordered) {
      const d = computeDurationSec(e);
      if (e.type === "work") {
        work += d;
      } else {
        brk += d;
      }
      if (selectedIds[e.id]) {
        selected += d;
      }
    }

    // 2. Sum virtual breaks (gaps)
    const sorted = [...ordered].sort((a, b) => b.startAt.getTime() - a.startAt.getTime());
    for (let i = 0; i < sorted.length - 1; i++) {
      const item = sorted[i]; // Starts LATER
      const nextEarlier = sorted[i + 1]; // Ends EARLIER

      if (nextEarlier.endAt && item.startAt.getTime() > nextEarlier.endAt.getTime() + 60000) {
        const gapSec = Math.floor((item.startAt.getTime() - nextEarlier.endAt.getTime()) / 1000);
        brk += gapSec;
      }
    }

    return { work, brk, total: work + brk, selected };
  }, [ordered, selectedIds]);

  // ✅ Active duration tick (safe + stable)
  const [now, setNow] = React.useState(() => Date.now());
  const activeStartedMs = React.useMemo(() => {
    if (!activeTimer) return null;
    const d = safeDate(activeTimer.startedAt);
    return d ? d.getTime() : null;
  }, [activeTimer]);

  React.useEffect(() => {
    if (!activeStartedMs) return;
    setNow(Date.now());
    const t = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(t);
  }, [activeStartedMs]);

  // Active Timer Editing State
  const [activeEditOpen, setActiveEditOpen] = React.useState(false);
  const [activeProjectId, setActiveProjectId] = React.useState<string | null>(null);
  const [activeTaskId, setActiveTaskId] = React.useState<string | null>(null);
  const [tasks, setTasks] = React.useState<Task[]>([]);
  const [tasksLoading, setTasksLoading] = React.useState(false);

  // Sync state when active timer changes (initial open)
  React.useEffect(() => {
    if (activeEditOpen) {
      setActiveProjectId(activeTimer?.project?.id ?? null);
      setActiveTaskId(activeTimer?.task?.id ?? null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeEditOpen]);

  // Load tasks when project changes
  React.useEffect(() => {
    let cancelled = false;
    async function load() {
      if (!activeEditOpen || !activeProjectId) {
        setTasks([]);
        if (activeEditOpen) setActiveTaskId(null); // Clear task if project clears
        return;
      }
      try {
        setTasksLoading(true);
        const list = await getTasksForProjectAction(activeProjectId);
        if (cancelled) return;
        setTasks(list);
      } finally {
        if (!cancelled) setTasksLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [activeProjectId, activeEditOpen, getTasksForProjectAction]);


  const selectedCount = Object.values(selectedIds).filter(Boolean).length;
  const [deleteAlertOpen, setDeleteAlertOpen] = React.useState(false);

  const performBulkDelete = () => {
    const ids = Object.entries(selectedIds).filter(([_, sel]) => sel).map(([id]) => id);
    if (!ids.length) return;
    startTransition(async () => {
      await bulkDeleteTimeEntries(ids);
      setSelectedIds({});
      setDeleteAlertOpen(false);
      router.refresh();
    });
  };

  const activeDurationSec = activeTimer && activeStartedMs ? Math.max(0, Math.floor((now - activeStartedMs) / 1000)) : 0;
  const activeTitle = activeTimer?.task?.title || (activeTimer?.note?.trim() ? activeTimer.note.trim() : "(Без опису)");
  const activeProjectName = activeTimer?.project?.name;

  const projectItems = React.useMemo(() => projects.map(p => ({ value: p.id, label: p.name })), [projects]);
  const taskItems = React.useMemo(() => tasks.map(t => ({ value: t.id, label: t.title })), [tasks]);

  return (
    <div className="relative font-sans text-sm">
      {/* Floating Bulk Actions */}
      {selectedCount > 0 && (
        <div className="absolute -top-14 left-0 right-0 z-20 flex animate-in fade-in slide-in-from-bottom-2 justify-center pointer-events-none">
          <div className="pointer-events-auto flex items-center gap-2 rounded-lg border bg-secondary/50 p-1 backdrop-blur-sm shadow-xl">
            <div className="flex items-center gap-2 px-3 text-sm font-medium text-foreground/80">
              <span>
                {selectedCount} {selectedCount === 1 ? "запис" : (selectedCount > 1 && selectedCount < 5) ? "записи" : "записів"}
              </span>
              <span className="text-muted-foreground">
                ({formatDurationUa(totals.selected)})
              </span>
            </div>

            <div className="h-6 w-px bg-border/50 mx-1" />

            {/* Bulk Edit (Project/Task) */}
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 gap-2 hover:bg-background/80">
                  <Folder className="h-3.5 w-3.5 opacity-70" />
                  Редагувати
                </Button>
              </PopoverTrigger>
              <PopoverContent className="p-4 w-[320px]" align="center">
                <BulkTaskSelector
                  projects={projects}
                  getTasksForProjectAction={getTasksForProjectAction}
                  onSave={(pid, tid) => {
                    startTransition(async () => {
                      await onBulkUpdateAction({ ids: Object.keys(selectedIds).filter(k => selectedIds[k]), projectId: pid, taskId: tid });
                      router.refresh();
                    });
                  }}
                />
              </PopoverContent>
            </Popover>

            <div className="h-6 w-px bg-border/50 mx-1" />

            <Button variant="ghost" size="sm" className="h-8 gap-2 text-destructive hover:bg-destructive/10" onClick={() => setDeleteAlertOpen(true)} disabled={isPending}>
              <Trash2 className="h-4 w-4" /> Видалити
            </Button>

            <Button variant="ghost" size="sm" className="h-8" onClick={() => setSelectedIds({})}>Скасувати</Button>
          </div>
        </div>
      )}

      <Card className={cn("overflow-hidden border shadow-sm py-0 gap-0", className)}>
        {/* Toolbar */}
        <div className="flex items-center gap-3 border-b px-4 py-2.5 bg-muted/40">
          <div className="w-10 flex justify-center shrink-0">
            <Checkbox
              checked={allSelected}
              onCheckedChange={(v) => toggleAll(Boolean(v))}
              aria-label="Вибрати всі"
            />
          </div>

          <div className="flex items-center gap-6 text-sm text-muted-foreground ml-auto">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 -mr-2 text-muted-foreground">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuCheckboxItem
                  checked={hideBreaks}
                  onCheckedChange={setHideBreaks}
                >
                  Приховати перерви
                </DropdownMenuCheckboxItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* ACTIVE ROW (Sticky or Top) */}
        {activeTimer && activeTimer.mode === "work" ? (
          <Popover open={activeEditOpen} onOpenChange={setActiveEditOpen}>
            <PopoverTrigger asChild>
              <div className="group flex items-center h-14 border-b bg-background border-l-4 border-l-primary transition-colors cursor-pointer hover:bg-muted/30">
                {/* 1. Status / Checkbox placeholder */}
                <div className="w-10 flex justify-center shrink-0">
                  <div className="h-2.5 w-2.5 rounded-full bg-primary animate-pulse ring-4 ring-primary/20" title="Активно" />
                </div>

                {/* 2. Title */}
                <div className="flex-1 min-w-0 pr-4">
                  <div className="font-medium text-foreground truncate">{activeTitle}</div>
                </div>

                {/* 3. Project */}
                <div className="w-[180px] xl:w-[220px] shrink-0 flex items-center gap-2 text-muted-foreground hidden md:flex">
                  {activeProjectName ? (
                    <>
                      <Folder className="h-4 w-4 shrink-0 fill-current opacity-70" />
                      <span className="truncate text-sm">{activeProjectName}</span>
                    </>
                  ) : (
                    <span className="text-xs opacity-50 italic">Вибрати проєкт...</span>
                  )}
                </div>

                {/* 4. Time Range (Running) */}
                <div className="w-[130px] shrink-0 text-right text-muted-foreground hidden sm:block text-[11px] tabular-nums">
                  {activeStartedMs ? format(new Date(activeStartedMs), "HH:mm") : ""} - Зараз
                </div>

                {/* 5. Duration */}
                <div className="w-[120px] shrink-0 text-right font-bold tabular-nums text-foreground px-4 text-sm">
                  {formatDurationUa(activeDurationSec)}
                </div>

                {/* 6. Action */}
                <div className="w-14 shrink-0 flex justify-center" onClick={(e) => e.stopPropagation()}>
                  <Button size="icon" variant="ghost" className="h-9 w-9 text-muted-foreground hover:text-foreground hover:bg-muted" onClick={() => onStopActiveAction?.()}>
                    <Square className="h-4 w-4 fill-current" />
                  </Button>
                </div>
              </div>
            </PopoverTrigger>
            <PopoverContent className="w-[380px] p-4" align="start">
              <div className="flex flex-col gap-4">
                <div className="space-y-2">
                  <h4 className="font-medium leading-none">Редагувати активний запис</h4>
                  <p className="text-sm text-muted-foreground">Змініть проєкт або задачу для поточного таймера.</p>
                </div>
                <div className="grid gap-2">
                  <div className="text-xs font-medium">Проєкт</div>
                  <Combobox
                    value={activeProjectId}
                    onChange={(v) => { setActiveProjectId(v); setActiveTaskId(null); }}
                    items={projectItems}
                    placeholder="Вибрати проєкт"
                    emptyText="Немає проєктів"
                  />
                </div>
                <div className="grid gap-2">
                  <div className="text-xs font-medium">Задача</div>
                  <Combobox
                    value={activeTaskId}
                    onChange={(v) => setActiveTaskId(v)}
                    items={taskItems}
                    placeholder={activeProjectId ? "Вибрати задачу" : "Спочатку вибери проєкт"}
                    emptyText={activeProjectId ? "Немає задач" : "Вибери проєкт"}
                    disabled={!activeProjectId || tasksLoading}
                    actionLabel="+ Створити задачу"
                    actionDisabled={!activeProjectId}
                    onAction={() => onCreateTaskAction?.(activeProjectId!)}
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" size="sm" onClick={() => setActiveEditOpen(false)}>Скасувати</Button>
                  <Button size="sm" onClick={() => {
                    onPatchActiveTimerAction?.({ projectId: activeProjectId, taskId: activeTaskId });
                    setActiveEditOpen(false);
                  }}>Зберегти</Button>
                </div>
              </div>
            </PopoverContent>
          </Popover>
        ) : null}

        <div className="divide-y bg-background">
          {(ordered.length === 0 && !activeTimer) ? (
            <div className="p-12 text-center flex flex-col items-center justify-center text-muted-foreground gap-2">
              <Briefcase className="h-10 w-10 opacity-20" />
              <p>За цей день записів ще немає</p>
            </div>
          ) : (
            <>
              {/* ✅ Break between active timer and first entry */}
              {(() => {
                if (!hideBreaks && activeTimer && activeTimer.mode === "work" && ordered.length > 0) {
                  const sorted = [...ordered].sort((a, b) => b.startAt.getTime() - a.startAt.getTime());
                  const firstEntry = sorted[0];
                  if (firstEntry.endAt && activeStartedMs) {
                    const gap = activeStartedMs - firstEntry.endAt.getTime();
                    if (gap > 60000) {
                      const breakDuration = Math.floor(gap / 1000);
                      return (
                        <div key="brk-active" className="flex items-center h-9 bg-muted/10 text-muted-foreground hover:bg-muted/20 transition-colors border-l-4 border-l-transparent">
                          <div className="w-10 shrink-0" />
                          <div className="flex-1 min-w-0 text-sm italic opacity-70">Перерва</div>
                          <div className="w-[180px] xl:w-[220px] shrink-0 hidden md:flex" />
                          <div className="w-[130px] shrink-0 text-right text-[11px] tabular-nums opacity-70 hidden sm:block">
                            {format(firstEntry.endAt, "HH:mm")} - {format(new Date(activeStartedMs), "HH:mm")}
                          </div>
                          <div className="w-[120px] shrink-0 text-right text-sm px-4 tabular-nums opacity-70">
                            {formatDurationUa(breakDuration)}
                          </div>
                          <div className="w-14 shrink-0 flex justify-center" />
                        </div>
                      );
                    }
                  }
                }
                return null;
              })()}

              {ordered.map((item, idx) => {
                const isWork = item.type === "work";
                if (!isWork && hideBreaks) return null;

                const title = getTitle(item);
                const isNoDescription = isWork && !item.note && !item.task?.title;

                const rows = [];

                // Render work entry
                rows.push(
                  <div
                    key={item.id}
                    className={cn(
                      "group flex items-center h-14 transition-all hover:bg-muted/40 border-l-4 border-l-transparent",
                      selectedIds[item.id] && "bg-muted/40 border-l-foreground",
                      !isWork && "bg-muted/5 italic text-muted-foreground h-10"
                    )}
                    onClick={() => isWork && onEditWorkEntryAction?.(item.id)}
                    onMouseEnter={() => isWork && onHighlightAction?.(item.id)}
                    onMouseLeave={() => isWork && onHighlightAction?.(null)}
                  >
                    <div className="w-10 flex justify-center shrink-0" onClick={e => e.stopPropagation()}>
                      {isWork && (
                        <Checkbox
                          checked={selectedIds[item.id]}
                          onCheckedChange={(v) => toggleOne(item.id, Boolean(v))}
                          className={cn(
                            "transition-opacity data-[state=checked]:opacity-100",
                            !selectedIds[item.id] && "opacity-0 group-hover:opacity-100"
                          )}
                        />
                      )}
                    </div>

                    <div className={cn("flex-1 min-w-0 pr-4 text-sm font-medium truncate", isNoDescription && "text-muted-foreground italic font-normal")}>
                      {title}
                    </div>

                    <div className="w-[180px] xl:w-[220px] shrink-0 flex items-center gap-2 text-muted-foreground hidden md:flex">
                      {isWork && item.project?.name && (
                        <>
                          <Folder className="h-4 w-4 shrink-0 fill-muted-foreground/20 text-muted-foreground/70" />
                          <span className="truncate text-sm">{item.project.name}</span>
                        </>
                      )}
                    </div>

                    <div className="w-[130px] shrink-0 text-right text-muted-foreground hidden sm:block text-[11px] tabular-nums">
                      {formatTimeRange(item.startAt, item.endAt)}
                    </div>

                    <div className="w-[120px] shrink-0 text-right font-medium tabular-nums px-4 text-sm">
                      {formatDurationUa(computeDurationSec(item))}
                    </div>

                    <div className="w-14 shrink-0 flex justify-center" onClick={e => e.stopPropagation()}>
                      {isWork && (
                        <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => onResumeWorkAction?.(item)}>
                          <Play className="h-3.5 w-3.5 fill-current" />
                        </Button>
                      )}
                    </div>
                  </div>
                );

                // Add virtual gap after this entry if next entry starts later (ordered is descending startAt)
                if (!hideBreaks && idx < ordered.length - 1) {
                  const nextEarlier = ordered[idx + 1];
                  if (nextEarlier.endAt && item.startAt.getTime() > nextEarlier.endAt.getTime() + 60000) {
                    const gapSec = Math.floor((item.startAt.getTime() - nextEarlier.endAt.getTime()) / 1000);
                    rows.push(
                      <div key={`gap-${item.id}`} className="flex items-center h-9 bg-muted/10 text-muted-foreground hover:bg-muted/20 transition-colors border-l-4 border-l-transparent">
                        <div className="w-10 shrink-0" />
                        <div className="flex-1 min-w-0 text-sm italic opacity-70">Перерва</div>
                        <div className="w-[180px] xl:w-[220px] shrink-0 hidden md:flex" />
                        <div className="w-[130px] shrink-0 text-right text-[11px] tabular-nums opacity-70 hidden sm:block">
                          {format(nextEarlier.endAt, "HH:mm")} - {format(item.startAt, "HH:mm")}
                        </div>
                        <div className="w-[120px] shrink-0 text-right text-sm px-4 tabular-nums opacity-70">
                          {formatDurationUa(gapSec)}
                        </div>
                        <div className="w-14 shrink-0 flex justify-center" />
                      </div>
                    );
                  }
                }

                return rows;
              })}
            </>
          )}
        </div>
      </Card>

      <AlertDialog open={deleteAlertOpen} onOpenChange={setDeleteAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Видалити записи?</AlertDialogTitle>
            <AlertDialogDescription>
              Ви збираєтесь видалити {selectedCount} записів. Цю дію не можна скасувати.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPending}>Скасувати</AlertDialogCancel>
            <AlertDialogAction onClick={(e) => { e.preventDefault(); performBulkDelete(); }} disabled={isPending} className="bg-destructive hover:bg-destructive/90">
              {isPending ? "Видалення..." : "Видалити"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

