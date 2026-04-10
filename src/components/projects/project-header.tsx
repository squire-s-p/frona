"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import {
  archiveProject,
  restoreProject,
  setProjectStatus,
} from "@/app/dashboard/projects/actions";

import { ArrowLeft } from "lucide-react";

type ProjectStatus = "active" | "completed" | "archived";

type ClientMini = { id: string; name: string } | null;

function statusLabel(status: ProjectStatus) {
  if (status === "active") return "Активний";
  if (status === "completed") return "Завершено";
  return "Архів";
}

function StatusPill({ status }: { status: ProjectStatus }) {
  if (status === "active") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-[11px] font-bold text-emerald-400 shadow-[0_0_12px_-2px_rgba(16,185,129,0.2)]">
        <span className="relative flex h-1.5 w-1.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
        </span>
        {statusLabel(status)}
      </span>
    );
  }

  const cls =
    status === "completed"
      ? "border-blue-500/30 bg-blue-500/10 text-blue-400"
      : "border-zinc-500/30 bg-zinc-500/10 text-zinc-400";

  return (
    <span className={cn("inline-flex items-center rounded-full border px-3 py-1 text-[11px] font-bold uppercase tracking-wider", cls)}>
      {statusLabel(status)}
    </span>
  );
}

function ClientPill({ client }: { client: ClientMini }) {
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
  client,
}: {
  projectId: string;
  name: string;
  status: ProjectStatus;
  client?: ClientMini;
}) {
  const router = useRouter();
  const [pending, startTransition] = React.useTransition();

  const isArchived = status === "archived";

  function onToggleStatus(next: "active" | "completed") {
    startTransition(async () => {
      await setProjectStatus(projectId, next);
      router.refresh();
    });
  }

  function onArchive() {
    startTransition(async () => {
      await archiveProject(projectId);
      router.refresh();
    });
  }

  function onRestore() {
    startTransition(async () => {
      await restoreProject(projectId);
      router.refresh();
    });
  }

  return (
    <div className="mb-8">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
        {/* Left: Navigation and Title */}
        <div className="min-w-0 space-y-2">
          {/* Top row: back button + pills */}
          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="h-7 w-7 shrink-0 rounded-full border-border/40 bg-card hover:bg-muted hover:text-primary transition-all group"
              onClick={() => router.push("/dashboard/projects")}
              disabled={pending}
            >
              <ArrowLeft className="h-3.5 w-3.5 transition-transform group-hover:-translate-x-0.5" />
            </Button>

            <StatusPill status={status} />
            <ClientPill client={client ?? null} />
          </div>

          {/* Bottom row: title */}
          <div className="flex flex-col ml-0.5">
            <h1 className="truncate text-2xl sm:text-4xl font-extrabold tracking-tight text-foreground leading-none">{name}</h1>
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex flex-wrap items-center gap-3 shrink-0">
          {!isArchived ? (
            <>
              {/* Status Toggle Group */}
              <div className="flex items-center gap-1 rounded-2xl border border-border/40 p-1.5 bg-card/50 backdrop-blur-sm h-11">
                <Button
                  type="button"
                  variant={status === "active" ? "secondary" : "ghost"}
                  size="sm"
                  className={cn(
                    "h-8 rounded-xl px-4 text-[11px] font-bold transition-all",
                    status === "active" ? "shadow-sm bg-background" : "text-muted-foreground"
                  )}
                  onClick={() => onToggleStatus("active")}
                  disabled={pending}
                >
                  Активний
                </Button>
                <Button
                  type="button"
                  variant={status === "completed" ? "secondary" : "ghost"}
                  size="sm"
                  className={cn(
                    "h-8 rounded-xl px-4 text-[11px] font-bold transition-all",
                    status === "completed" ? "shadow-sm bg-background" : "text-muted-foreground"
                  )}
                  onClick={() => onToggleStatus("completed")}
                  disabled={pending}
                >
                  Завершено
                </Button>
              </div>

              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-11 rounded-2xl border-border/40 px-5 text-[11px] font-bold hover:bg-zinc-500/5"
                onClick={onArchive}
                disabled={pending}
              >
                В архів
              </Button>
            </>
          ) : (
            <Button
              type="button"
              variant="outline"
              className="h-11 rounded-2xl border-border/40 px-6 text-[11px] font-bold"
              onClick={onRestore}
              disabled={pending}
            >
              Відновити з архіву
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
