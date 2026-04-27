"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { TaskDialog } from "@/components/tasks/task-dialog";
import type { TaskRow } from "@/components/tasks/tasks-client";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Check, Trash2, Plus } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import {
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";

import { createTask, updateTask, deleteTask } from "@/server/tasks/actions";

type ProjectOption = { id: string; name: string };

function normalizeTasks(tasks: any[]): TaskRow[] {
  return tasks.map((t) => ({
    id: t.id,
    title: t.title,
    description: t.description ?? null,
    status:
      (typeof t.status === "string" ? t.status.toUpperCase() : "TODO") as TaskRow["status"],
    priority:
      (typeof t.priority === "string" ? t.priority.toUpperCase() : "MEDIUM") as TaskRow["priority"],
    startDate: t.startAt ? new Date(t.startAt).toISOString() : null,
    endDate: t.endAt ? new Date(t.endAt).toISOString() : null,
    updatedAt: new Date(t.updatedAt).toISOString(),
    createdAt: new Date(t.createdAt).toISOString(),
    project: t.project ?? null,
    _count: t._count ?? { comments: 0 },
    isPinned: t.isPinned ?? false,
    isTemplate: t.isTemplate ?? false,
    recurrenceRule: t.recurrenceRule ?? null,
    parentTaskId: t.parentTaskId ?? null,
    tags: t.tags ?? [],
  }));
}

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("uk-UA", { day: "2-digit", month: "2-digit", year: "numeric" });
}

export default function ProjectTasksClient({
  initialTasks,
  projects,
  projectId,
}: {
  initialTasks: any[];
  projects: ProjectOption[];
  projectId: string;
}) {
  const router = useRouter();
  const [taskTitle, setTaskTitle] = React.useState("");
  const [isCreating, setIsCreating] = React.useState(false);

  const tasks = React.useMemo(() => normalizeTasks(initialTasks), [initialTasks]);

  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<TaskRow | null>(null);
  const [taskToDelete, setTaskToDelete] = React.useState<string | null>(null);

  const [pending, startTransition] = React.useTransition();

  async function handleQuickAdd() {
    const title = taskTitle.trim();
    if (!title || pending) return;

    startTransition(async () => {
      try {
        await createTask({
          title,
          projectId,
          status: "TODO",
          priority: "NONE",
        } as any);
        setTaskTitle("");
        router.refresh();
      } catch (e) {
        console.error(e);
      }
    });
  }

  async function handleToggleTask(task: TaskRow) {
    const nextStatus = task.status === "DONE" ? "TODO" : "DONE";
    startTransition(async () => {
      try {
        await updateTask(task.id, { status: nextStatus } as any);
        router.refresh();
      } catch (e) {
        console.error(e);
      }
    });
  }

  async function handleDeleteTask(taskId: string) {
    startTransition(async () => {
      try {
        await deleteTask(taskId);
        setTaskToDelete(null);
        router.refresh();
        toast.success("Завдання видалено");
      } catch (e) {
        console.error(e);
        toast.error("Помилка при видаленні");
      }
    });
  }

  return (
    <>
      <div className="px-5 py-4">
        <div className="flex items-center gap-2">
          <Input
            placeholder="Додати нову задачу..."
            className="h-10 flex-1 bg-neutral-100 dark:bg-neutral-900/50 border border-black/5 dark:border-white/10 rounded-[calc(var(--radius)+4px)] px-5 text-sm placeholder:text-muted-foreground/50 transition-all focus-visible:ring-1 focus-visible:ring-black/5 dark:focus-visible:ring-white/20 shadow-none"
            value={taskTitle}
            onChange={(e) => setTaskTitle(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleQuickAdd()}
            disabled={pending}
          />
          <Button
            size="icon"
            className={cn(
              "h-10 w-10 shrink-0 transition-all border-none bg-black dark:bg-white text-white dark:text-black hover:bg-black/90 dark:hover:bg-white/90 rounded-[calc(var(--radius)+4px)] shadow-sm",
              taskTitle.trim() 
                ? "opacity-100 scale-100 cursor-pointer" 
                : "opacity-50 scale-100 cursor-default"
            )}
            onClick={handleQuickAdd}
            disabled={pending || !taskTitle.trim()}
          >
            <Plus className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {tasks.length === 0 ? (
        <div className="px-5 py-12 text-center">
          <p className="text-sm text-muted-foreground/60 font-medium">Список задач порожній</p>
        </div>
      ) : (
        <div className="divide-y divide-border/40">
          {tasks.map((task) => {
          const dateStr = task.endDate
            ? formatDate(task.endDate)
            : task.startDate
            ? formatDate(task.startDate)
            : null;

          return (
            <div
              key={task.id}
              className="flex items-center justify-between gap-4 px-5 py-3 cursor-pointer hover:bg-neutral-100/50 dark:hover:bg-neutral-800/30 transition-colors group"
            >
              <div className="flex items-center gap-4 min-w-0 flex-1" onClick={() => {
                setEditing(task);
                setDialogOpen(true);
              }}>
                <div 
                  className={cn(
                    "h-5 w-5 rounded-lg border-2 border-border/60 flex items-center justify-center transition-all shrink-0 hover:border-foreground/40",
                    task.status === "DONE" ? "bg-foreground border-foreground shadow-none" : "bg-transparent"
                  )}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleToggleTask(task);
                  }}
                >
                  {task.status === "DONE" && <Check className="h-3 w-3 text-background" />}
                </div>
                <span
                  className={cn(
                    "text-sm font-medium truncate transition-colors",
                    task.status === "DONE" ? "text-muted-foreground" : "text-foreground"
                  )}
                >
                  {task.title}
                </span>
              </div>

              <div className="flex items-center gap-4 shrink-0">
                {dateStr && (
                  <span className="text-[10px] font-medium text-muted-foreground/60 tabular-nums uppercase tracking-wider">
                    {dateStr}
                  </span>
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 rounded-xl opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all"
                  onClick={(e) => {
                    e.stopPropagation();
                    setTaskToDelete(task.id);
                  }}
                  disabled={pending}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          );
        })}
      </div>
      )}

      <TaskDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        task={editing}
        projects={projects}
        tags={[]}
      />

      <Dialog open={!!taskToDelete} onOpenChange={(open) => !open && setTaskToDelete(null)}>
        <DialogContent size="sm" className="[&>button]:hidden">
          <div className="grid grid-rows-[auto_1fr] place-items-center gap-1.5 text-center sm:place-items-start sm:text-left">
            <div className="mb-2 inline-flex size-16 items-center justify-center rounded-md bg-destructive/10 text-destructive dark:bg-destructive/20 dark:text-destructive">
              <Trash2 className="size-8" />
            </div>
            <DialogTitle className="text-lg font-semibold text-white">Видалити задачу?</DialogTitle>
          </div>
          <DialogFooter className="flex flex-row gap-3 sm:justify-center">
            <DialogClose asChild>
              <Button 
                variant="outline"
                disabled={pending}
                className="flex-1 mt-0 bg-transparent border border-white/10 text-white hover:bg-white/5 h-11 rounded-xl font-medium transition-colors"
              >
                Скасувати
              </Button>
            </DialogClose>
            <Button
              onClick={(e) => {
                e.preventDefault();
                if (taskToDelete) handleDeleteTask(taskToDelete);
              }}
              className="flex-1 bg-[#a34444] text-white hover:bg-[#b54d4d] h-11 rounded-xl font-medium transition-colors border-none shadow-none"
              disabled={pending}
            >
              {pending ? "Видалення..." : "Видалити"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
