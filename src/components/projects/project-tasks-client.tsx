"use client";

import * as React from "react";
import { TaskDialog } from "@/components/tasks/task-dialog";
import type { TaskRow } from "@/components/tasks/tasks-client";
import { cn } from "@/lib/utils";

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

function statusDot(status: TaskRow["status"]) {
  if (status === "DONE") return "bg-emerald-500";
  return "bg-amber-400";
}

export default function ProjectTasksClient({
  initialTasks,
  projects,
}: {
  initialTasks: any[];
  projects: ProjectOption[];
}) {
  const tasks = React.useMemo(() => normalizeTasks(initialTasks), [initialTasks]);

  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<TaskRow | null>(null);

  if (tasks.length === 0) {
    return (
      <div className="px-5 py-8 text-center text-sm text-muted-foreground">
        Немає задач для цього проєкту
      </div>
    );
  }

  return (
    <>
      <div className="divide-y divide-border/40">
        {tasks.map((task) => {
          const dateStr = task.endDate
            ? formatDate(task.endDate)
            : task.startDate
            ? formatDate(task.startDate)
            : "—";

          return (
            <div
              key={task.id}
              className="flex items-center justify-between gap-4 px-5 py-3.5 cursor-pointer hover:bg-muted/20 transition-colors group"
              onClick={() => {
                setEditing(task);
                setDialogOpen(true);
              }}
            >
              {/* Left: status dot + title */}
              <div className="flex items-center gap-3 min-w-0">
                <span className={cn("h-1.5 w-1.5 rounded-full shrink-0", statusDot(task.status))} />
                <span
                  className={cn(
                    "text-sm font-medium truncate",
                    task.status === "DONE" && "line-through text-muted-foreground"
                  )}
                >
                  {task.title}
                </span>
              </div>

              {/* Right: date */}
              <span className="text-xs text-muted-foreground shrink-0 tabular-nums">
                {dateStr}
              </span>
            </div>
          );
        })}
      </div>

      <TaskDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        task={editing}
        projects={projects}
        tags={[]}
      />
    </>
  );
}
