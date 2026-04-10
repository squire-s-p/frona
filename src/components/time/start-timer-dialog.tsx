"use client";

import * as React from "react";
import { useRouter } from "next/navigation";

import { startTimer } from "@/app/dashboard/time/actions";
import { Button } from "@/components/ui/button";
import { PlayIcon } from "@/components/icons/play-icon";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type ProjectLite = { id: string; name: string };
type TaskLite = { id: string; title: string };

export function StartTimerDialog({
  projects = [],
  tasksByProject = {},
}: {
  projects?: ProjectLite[];
  tasksByProject?: Record<string, TaskLite[]>;
}) {
  const router = useRouter();

  const [open, setOpen] = React.useState(false);
  const [projectId, setProjectId] = React.useState<string>("");
  const [taskId, setTaskId] = React.useState<string>("");
  const [pending, setPending] = React.useState(false);

  const tasks = projectId ? tasksByProject[projectId] ?? [] : [];

  async function onStart() {
    if (!projectId) return;

    try {
      setPending(true);
      await startTimer(projectId, taskId || undefined);

      setOpen(false);
      setProjectId("");
      setTaskId("");
      router.refresh();
    } finally {
      setPending(false);
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        setOpen(v);
        if (!v) {
          setProjectId("");
          setTaskId("");
        }
      }}
    >
      <DialogTrigger asChild>
        <Button
          size="icon"
          variant="outline"
          className="group rounded-xl"
          title="Почати облік часу"
          aria-label="Почати облік часу"
        >
          <PlayIcon className="h-4 w-4 text-muted-foreground group-hover:text-foreground" />
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Почати облік часу</DialogTitle>
        </DialogHeader>

        {projects.length === 0 ? (
          <div className="space-y-3">
            <div className="rounded-xl border bg-card p-3 text-sm text-muted-foreground">
              Проєкти ще не підʼєднані до Topbar. Потрібно передати їх із
              server layout.
            </div>

            <Button asChild className="w-full rounded-xl">
              <a href="/dashboard/projects">Перейти до проєктів</a>
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Project (required) */}
            <div>
              <div className="mb-1 text-xs text-muted-foreground">
                Проєкт <span className="text-destructive">*</span>
              </div>

              <Select
                value={projectId}
                onValueChange={(v) => {
                  setProjectId(v);
                  setTaskId("");
                }}
              >
                <SelectTrigger className="rounded-xl">
                  <SelectValue placeholder="Оберіть проєкт" />
                </SelectTrigger>

                <SelectContent>
                  {projects.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Task (optional) */}
            <div>
              <div className="mb-1 text-xs text-muted-foreground">
                Завдання (необовʼязково)
              </div>

              <Select
                value={taskId || "__none"}
                onValueChange={(v) => setTaskId(v === "__none" ? "" : v)}
                disabled={!projectId}
              >
                <SelectTrigger className="rounded-xl">
                  <SelectValue placeholder="Без завдання" />
                </SelectTrigger>

                <SelectContent>
                  <SelectItem value="__none">Без завдання</SelectItem>

                  {tasks.map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {!projectId ? (
                <div className="mt-2 text-xs text-muted-foreground">
                  Спочатку обери проєкт.
                </div>
              ) : null}
            </div>

            <Button
              onClick={onStart}
              disabled={!projectId || pending}
              className="w-full rounded-xl"
            >
              Почати
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
