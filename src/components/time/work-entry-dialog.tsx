"use client";

import * as React from "react";
import { differenceInMinutes, format, parse } from "date-fns";
import { Check, ChevronsUpDown, Plus } from "lucide-react";

import { cn } from "@/lib/utils";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command";
import { TimePicker } from "@/components/ui/time-picker";

type Project = { id: string; name: string };
type Task = { id: string; title: string };

type SavePayload = {
  projectId?: string | null;
  taskId?: string | null;
  note?: string | null;
  startAt: Date;
  endAt: Date;
};

type Props = {
  open: boolean;
  onOpenChangeAction: (open: boolean) => void;

  /** day is used to build Date objects from HH:mm inputs */
  day: Date;

  projects: Project[];
  tags: Array<{ id: string; name: string }>;

  /** Called when project changes; should return all tasks for this project */
  getTasksForProjectAction: (projectId: string) => Promise<Task[]>;

  /** Open existing task create dialog (from Tasks module) */
  onCreateTaskAction?: (projectId: string | null) => void;

  /** When a task is created in TaskDialog, we can auto-select it */
  taskCreated?: { id: string; projectId: string | null } | null;
  onTaskCreatedConsumedAction?: () => void;

  /** Optional defaults */
  defaultProjectId?: string | null;
  defaultTaskId?: string | null;
  defaultTagIds?: string[];
  defaultStartAt?: Date;
  defaultEndAt?: Date;

  /** NEW: prefill from timeline selection (optional, non-breaking) */
  initialRange?: { startAt: Date; endAt: Date } | null;

  /** Optional: if set -> dialog acts as "edit" */
  entryId?: string | null;

  onSaveAction: (payload: SavePayload) => Promise<void> | void;
  onDeleteAction?: (entryId: string) => Promise<void>;
  onStartTimerAction?: (payload: { projectId?: string | null; taskId?: string | null }) => Promise<void>;

  className?: string;
};

function toTimeString(d: Date) {
  return format(d, "HH:mm");
}

function parseTimeOnDay(day: Date, time: string) {
  return parse(time, "HH:mm", day);
}

function formatDurationMinutes(mins: number) {
  const safe = Math.max(0, Math.floor(mins));
  const h = Math.floor(safe / 60);
  const m = safe % 60;

  if (h <= 0) return `${m} хв`;
  if (m <= 0) return `${h} год`;
  return `${h} год ${m} хв`;
}

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
  onChange: (next: string) => void;
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
          <CommandEmpty>{emptyText}</CommandEmpty>

          <CommandGroup>
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
        </Command>
      </PopoverContent>
    </Popover>
  );
}

export default function WorkEntryDialog({
  open,
  onOpenChangeAction,
  day,
  projects,
  getTasksForProjectAction,
  onCreateTaskAction,
  taskCreated,
  onTaskCreatedConsumedAction,
  defaultProjectId,
  defaultTaskId,
  defaultStartAt,
  defaultEndAt,
  initialRange,
  entryId,
  onSaveAction,
  onDeleteAction,
  onStartTimerAction: _onStartTimerAction,
  className,
}: Props) {
  const [projectId, setProjectId] = React.useState<string | null>(null);
  const [tasks, setTasks] = React.useState<Task[]>([]);
  const [tasksLoading, setTasksLoading] = React.useState(false);
  const [taskId, setTaskId] = React.useState<string | null>(null);

  const [start, setStart] = React.useState("09:00");
  const [end, setEnd] = React.useState("10:00");
  const [durationInput, setDurationInput] = React.useState("1:00");

  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!open) return;

    // ✅ highest priority: initialRange (from timeline selection)
    const sAt = initialRange?.startAt ?? defaultStartAt ?? new Date();
    const eAt =
      initialRange?.endAt ??
      defaultEndAt ??
      new Date(sAt.getTime() + 60 * 60 * 1000);

    setStart(toTimeString(sAt));
    setEnd(toTimeString(eAt));
    setDurationInput(formatDurationMinutes(differenceInMinutes(eAt, sAt)));

    setProjectId(defaultProjectId ?? null);
    setTaskId(defaultTaskId ?? null);

    setError(null);
  }, [
    open,
    defaultProjectId,
    defaultTaskId,
    defaultStartAt,
    defaultEndAt,
    initialRange?.startAt,
    initialRange?.endAt,
  ]);

  // load tasks when project changes
  React.useEffect(() => {
    let cancelled = false;

    async function run() {
      if (!open) return;

      if (!projectId) {
        setTasks([]);
        setTaskId(null);
        return;
      }

      try {
        setTasksLoading(true);
        const list = await getTasksForProjectAction(projectId);
        if (cancelled) return;
        setTasks(list);

        if (taskId && !list.some((t: Task) => t.id === taskId)) setTaskId(null);
      } catch {
        if (!cancelled) setTasks([]);
      } finally {
        if (!cancelled) setTasksLoading(false);
      }
    }

    run();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId, open]);

  // after task created via TaskDialog -> refetch and auto-select
  React.useEffect(() => {
    let cancelled = false;

    async function apply() {
      if (!open) return;
      if (!taskCreated?.id) return;
      if (!projectId) return;
      if (taskCreated.projectId !== projectId) return;

      try {
        setTasksLoading(true);
        const list = await getTasksForProjectAction(projectId);
        if (cancelled) return;
        setTasks(list);
        setTaskId(taskCreated.id);
      } finally {
        if (!cancelled) setTasksLoading(false);
        onTaskCreatedConsumedAction?.();
      }
    }

    apply();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [taskCreated?.id, taskCreated?.projectId, open, projectId]);

  const durationMins = React.useMemo(() => {
    const s = parseTimeOnDay(day, start);
    const e = parseTimeOnDay(day, end);
    return differenceInMinutes(e, s);
  }, [day, start, end]);

  const canSave = durationMins > 0 && !saving;

  const handleDurationChange = (val: string) => {
    setDurationInput(val);
    // try parse "H:mm" or "M"
    let mins = 0;
    if (val.includes(":")) {
      const [h, m] = val.split(":").map(Number);
      mins = (h || 0) * 60 + (m || 0);
    } else {
      mins = Number(val) || 0;
    }

    if (mins > 0) {
      const s = parseTimeOnDay(day, start);
      const e = new Date(s.getTime() + mins * 60 * 1000);
      setEnd(toTimeString(e));
    }
  };

  const handleStartChange = (val: string) => {
    setStart(val);
    // keep duration, move end
    const mins = durationMins;
    if (mins > 0) {
      const s = parseTimeOnDay(day, val);
      const e = new Date(s.getTime() + mins * 60 * 1000);
      setEnd(toTimeString(e));
    }
  };

  const handleEndChange = (val: string) => {
    setEnd(val);
    const s = parseTimeOnDay(day, start);
    const e = parseTimeOnDay(day, val);
    const m = differenceInMinutes(e, s);
    if (m > 0) setDurationInput(formatDurationMinutes(m));
  };

  const handleSave = async () => {
    setError(null);
    const startAt = parseTimeOnDay(day, start);
    const endAt = parseTimeOnDay(day, end);

    if (endAt <= startAt) {
      setError("Час закінчення має бути пізніше за час початку.");
      return;
    }

    const now = new Date();
    if (endAt.getTime() > now.getTime() + 60000) {
      setError("Запис не може закінчуватися у майбутньому.");
      return;
    }

    const payload: SavePayload = {
      projectId: projectId ?? null,
      taskId: projectId ? (taskId ?? null) : null,
      note: null,
      startAt,
      endAt,
    };

    try {
      setSaving(true);
      await onSaveAction(payload);
      onOpenChangeAction(false);
    } catch {
      setError("Не вдалося зберегти запис. Спробуй ще раз.");
    } finally {
      setSaving(false);
    }
  };



  const projectItems = React.useMemo(
    () => projects.map((p) => ({ value: p.id, label: p.name })),
    [projects]
  );

  const taskItems = React.useMemo(
    () => tasks.map((t) => ({ value: t.id, label: t.title })),
    [tasks]
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChangeAction}>
      <DialogContent className={cn("sm:max-w-[700px]", className)}>
        <DialogHeader>
          <DialogTitle>{entryId ? "Редагувати запис часу" : "Додати запис часу"}</DialogTitle>
        </DialogHeader>

        <div className="grid gap-6">
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
            {/* ✅ Проєкт — ВИЩЕ */}
            <div className="lg:col-span-6 grid gap-2">
              <Label>Проєкт</Label>
              <Combobox
                value={projectId}
                onChange={(v) => {
                  setProjectId(v);
                  setTaskId(null);
                }}
                items={projectItems}
                placeholder="Вибрати проєкт"
                emptyText="Немає проєктів"
              />
            </div>

            {/* ✅ Задача — ПІСЛЯ проєкту */}
            <div className="lg:col-span-6 grid gap-2">
              <Label>Задача</Label>
              <Combobox
                value={taskId}
                onChange={(v) => setTaskId(v)}
                items={taskItems}
                placeholder={projectId ? "Вибрати задачу" : "Спочатку вибери проєкт"}
                emptyText={projectId ? "Немає задач" : "Вибери проєкт"}
                disabled={!projectId || tasksLoading}
                actionLabel="+ Створити задачу"
                actionDisabled={!projectId}
                onAction={() => onCreateTaskAction?.(projectId)}
              />
            </div>

            {/* Час */}
            <div className="lg:col-span-4 grid gap-2">
              <Label>Час початку</Label>
              <TimePicker
                value={start}
                onChangeAction={handleStartChange}
              />
            </div>

            <div className="lg:col-span-4 grid gap-2">
              <Label>Час закінчення</Label>
              <TimePicker
                value={end}
                onChangeAction={handleEndChange}
              />
            </div>

            <div className="lg:col-span-4 grid gap-2">
              <Label htmlFor="work-duration">Тривалість</Label>
              <Input
                id="work-duration"
                value={durationInput}
                onChange={(e) => handleDurationChange(e.target.value)}
                placeholder="Г:ХХ"
              />
            </div>
          </div>

          {error ? <div className="text-sm text-destructive">{error}</div> : null}

          <div className="flex flex-col-reverse sm:flex-row sm:justify-between gap-2 border-t pt-4">
            <div className="flex gap-2">
              <Button type="button" onClick={handleSave} disabled={!canSave}>
                Зберегти
              </Button>
              <Button type="button" variant="ghost" onClick={() => onOpenChangeAction(false)}>
                Скасувати
              </Button>
            </div>

            {entryId && onDeleteAction && (
              <Button
                type="button"
                variant="ghost"
                className="text-destructive hover:text-destructive hover:bg-destructive/10"
                onClick={async () => {
                  setSaving(true);
                  try {
                    await onDeleteAction(entryId);
                    onOpenChangeAction(false);
                  } catch {
                    setError("Не вдалося видалити запис.");
                  } finally {
                    setSaving(false);
                  }
                }}
                disabled={saving}
              >
                Видалити
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
