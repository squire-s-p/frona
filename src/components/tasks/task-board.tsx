"use client";

import * as React from "react";
import { useRouter } from "next/navigation";

import { createTask, moveTask } from "@/app/dashboard/projects/[projectId]/tasks/actions";
import type { Priority, TaskStatus } from "@prisma/client";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type TaskLite = {
  id: string;
  title: string;
  status: TaskStatus;
  priority: Priority;
  createdAt: string; // ISO (передамо з server як string)
};

const columns: { key: TaskStatus; title: string }[] = [
  { key: "todo", title: "Todo" },
  { key: "doing", title: "Doing" },
  { key: "done", title: "Done" },
];

function nextStatus(s: TaskStatus): TaskStatus {
  if (s === "todo") return "doing";
  if (s === "doing") return "done";
  return "done";
}
function prevStatus(s: TaskStatus): TaskStatus {
  if (s === "done") return "doing";
  if (s === "doing") return "todo";
  return "todo";
}

function priorityLabel(p: Priority) {
  if (p === "high") return "High";
  if (p === "low") return "Low";
  return "Medium";
}

export default function TaskBoard({
  projectId,
  tasks,
}: {
  projectId: string;
  tasks: TaskLite[];
}) {
  const router = useRouter();

  const [title, setTitle] = React.useState("");
  const [priority, setPriority] = React.useState<Priority>("medium");
  const [pending, setPending] = React.useState(false);
  const [movingId, setMovingId] = React.useState<string | null>(null);

  const grouped = React.useMemo(() => {
    const map: Record<TaskStatus, TaskLite[]> = { todo: [], doing: [], done: [] };
    for (const t of tasks) map[t.status].push(t);
    return map;
  }, [tasks]);

  async function onCreate() {
    const clean = title.trim();
    if (!clean) return;

    try {
      setPending(true);
      await createTask({ projectId, title: clean, priority });
      setTitle("");
      setPriority("medium");
      router.refresh();
    } finally {
      setPending(false);
    }
  }

  async function onMove(taskId: string, status: TaskStatus) {
    try {
      setMovingId(taskId);
      await moveTask({ projectId, taskId, status });
      router.refresh();
    } finally {
      setMovingId(null);
    }
  }

  return (
    <div className="space-y-4">
      {/* Create */}
      <Card className="rounded-2xl p-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-center">
          <div className="flex-1">
            <div className="text-xs text-muted-foreground">Нова задача</div>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Напр. Додати оплату / інтеграцію / форму…"
              className="mt-1 rounded-xl"
              onKeyDown={(e) => {
                if (e.key === "Enter") onCreate();
              }}
            />
          </div>

          <div className="w-full md:w-[180px]">
            <div className="text-xs text-muted-foreground">Priority</div>
            <Select value={priority} onValueChange={(v) => setPriority(v as Priority)}>
              <SelectTrigger className="mt-1 rounded-xl">
                <SelectValue placeholder="Priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="high">High</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="md:pt-5">
            <Button onClick={onCreate} disabled={pending || !title.trim()} className="rounded-xl">
              + Додати
            </Button>
          </div>
        </div>
      </Card>

      {/* Board */}
      <div className="grid gap-4 lg:grid-cols-3">
        {columns.map((col) => (
          <Card key={col.key} className="rounded-2xl p-4">
            <div className="flex items-center justify-between">
              <div className="font-semibold">{col.title}</div>
              <div className="text-xs text-muted-foreground">
                {grouped[col.key].length}
              </div>
            </div>

            <div className="mt-3 space-y-2">
              {grouped[col.key].length === 0 ? (
                <div className="rounded-xl border bg-background p-3 text-sm text-muted-foreground">
                  Поки пусто.
                </div>
              ) : (
                grouped[col.key].map((t) => (
                  <div key={t.id} className="rounded-xl border bg-card p-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="text-sm font-medium">{t.title}</div>
                        <div className="mt-1 text-xs text-muted-foreground">
                          {priorityLabel(t.priority)}
                        </div>
                      </div>

                      <div className="flex gap-1">
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 rounded-xl px-2"
                          disabled={movingId === t.id || t.status === "todo"}
                          onClick={() => onMove(t.id, prevStatus(t.status))}
                          title="Назад"
                        >
                          ←
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 rounded-xl px-2"
                          disabled={movingId === t.id || t.status === "done"}
                          onClick={() => onMove(t.id, nextStatus(t.status))}
                          title="Вперед"
                        >
                          →
                        </Button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
