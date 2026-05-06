"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import { setProjectStatus } from "@/app/dashboard/projects/actions";

type ProjectStatus = "active" | "completed" | "archived";

type ClientMini = { id: string; name: string } | null;

function statusLabel(status: ProjectStatus) {
  if (status === "active") return "Активний";
  return "Завершено";
}

function _StatusPill({ status }: { status: ProjectStatus }) {
  if (status === "active") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-[11px] font-bold text-emerald-400">
        <span className="relative flex h-1.5 w-1.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
        </span>
        {statusLabel(status)}
      </span>
    );
  }

  const cls =
    status === "completed" || status === "archived"
      ? "border-blue-500/30 bg-blue-500/10 text-blue-400"
      : "border-zinc-500/30 bg-zinc-500/10 text-zinc-400";

  return (
    <span className={cn("inline-flex items-center rounded-full border px-3 py-1 text-[11px] font-bold uppercase tracking-wider", cls)}>
      {statusLabel(status)}
    </span>
  );
}

function _ClientPill({ client }: { client: ClientMini }) {
  if (!client?.id) return null;

  return (
    <div className="inline-flex items-center h-7 rounded-full border border-border/40 bg-zinc-500/5 px-3 py-1 group transition-all hover:bg-zinc-500/10">
      <span className="text-[10px] uppercase font-bold text-muted-foreground mr-1.5 border-r border-border/30 pr-1.5">Клієнт</span>
      <Link
        href={`/dashboard/clients/${client.id}`}
        className="text-[11px] font-medium text-foreground/80 hover:text-primary transition-colors"
      >
        {client.name}
      </Link>
    </div>
  );
}

export default function ProjectHeader({
  projectId,
  name,
  status,
  client: _client,
}: {
  projectId: string;
  name: string;
  status: ProjectStatus;
  client?: ClientMini;
}) {
  const router = useRouter();
  const [pending, startTransition] = React.useTransition();

  const _isArchived = status === "archived";

  function onToggleStatus(next: "active" | "completed") {
    startTransition(async () => {
      await setProjectStatus(projectId, next);
      router.refresh();
    });
  }

  function _onArchive() {
    startTransition(async () => {
      await setProjectStatus(projectId, "completed");
      router.refresh();
    });
  }

  function _onRestore() {
    startTransition(async () => {
      await setProjectStatus(projectId, "active");
      router.refresh();
    });
  }

  return (
    <div className="mb-8">
      <div className="flex items-center justify-between gap-4">
        {/* Left: Title */}
        <div className="flex items-center gap-3 sm:gap-4 min-w-0">
          <h1 className="truncate text-xl sm:text-3xl font-extrabold tracking-tight text-foreground leading-none">
            {name}
          </h1>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="flex items-center gap-1 rounded-2xl border border-border/40 p-1 bg-neutral-100 dark:bg-neutral-900 h-9 sm:h-11 shadow-none">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className={cn(
                "h-7 sm:h-8 rounded-xl px-2 sm:px-4 text-[10px] sm:text-[11px] font-bold transition-all shadow-none",
                status === "active" 
                  ? "bg-white dark:bg-neutral-800 text-foreground hover:bg-white dark:hover:bg-neutral-800" 
                  : "text-muted-foreground hover:text-foreground hover:bg-transparent"
              )}
              onClick={() => onToggleStatus("active")}
              disabled={pending}
            >
              Активний
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className={cn(
                "h-7 sm:h-8 rounded-xl px-2 sm:px-4 text-[10px] sm:text-[11px] font-bold transition-all shadow-none",
                status === "completed" 
                  ? "bg-white dark:bg-neutral-800 text-foreground hover:bg-white dark:hover:bg-neutral-800" 
                  : "text-muted-foreground hover:text-foreground hover:bg-transparent"
              )}
              onClick={() => onToggleStatus("completed")}
              disabled={pending}
            >
              Завершено
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
