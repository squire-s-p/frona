"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { uk } from "date-fns/locale";
import { 
  ArrowDownAZ, 
  ArrowUpAZ, 
  Link2Off, 
  Loader2, 
  Search, 
  Folder, 
  ChevronRight 
} from "lucide-react";

import { setProjectClient } from "@/app/dashboard/projects/actions";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

type Row = {
  id: string;
  name: string;
  status: "active" | "completed" | "archived" | string;
  updatedAt: Date;
};

type StatusFilter = "all" | "active" | "completed" | "archived";

const statusConfig = {
    active: {
      label: "Активний",
      dotClass: "bg-emerald-500",
      textClass: "text-emerald-500 bg-emerald-500/10",
    },
    completed: {
      label: "Завершений",
      dotClass: "bg-blue-500",
      textClass: "text-blue-500 bg-blue-500/10",
    },
    archived: {
      label: "Архів",
      dotClass: "bg-muted-foreground/50",
      textClass: "text-muted-foreground bg-muted/20",
    },
};

function StatusBadge({ status }: { status: string }) {
    const s = (status === "active" || status === "completed" || status === "archived") ? status : "active";
    const config = statusConfig[s as keyof typeof statusConfig];
    return (
      <div className={cn(
        "inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-[10px] font-bold tracking-tight",
        config.textClass
      )}>
        <span className={cn("h-1.5 w-1.5 rounded-full", config.dotClass)} />
        {config.label}
      </div>
    );
}

export default function ClientProjectsTable({ projects }: { projects: Row[] }) {
  const router = useRouter();

  const [query, setQuery] = React.useState("");
  const [status, setStatus] = React.useState<StatusFilter>("all");
  const [sort, setSort] = React.useState<"desc" | "asc">("desc");

  const [pendingId, setPendingId] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  const counts = React.useMemo(() => {
    const c = { all: projects.length, active: 0, completed: 0, archived: 0 };
    for (const p of projects) {
      if (p.status === "active") c.active++;
      else if (p.status === "completed") c.completed++;
      else if (p.status === "archived") c.archived++;
    }
    return c;
  }, [projects]);

  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = projects.slice();

    if (q) {
      list = list.filter((p) => p.name.toLowerCase().includes(q));
    }

    list.sort((a, b) => {
      const at = new Date(a.updatedAt).getTime();
      const bt = new Date(b.updatedAt).getTime();
      return sort === "desc" ? bt - at : at - bt;
    });

    return list;
  }, [projects, query, sort]);

  async function detach(projectId: string, projectStatus: string) {
    setError(null);
    if (projectStatus === "archived") {
      setError("Архівні проєкти недоступні для змін.");
      return;
    }
    const ok = window.confirm("Відвʼязати проєкт від цього клієнта?");
    if (!ok) return;

    try {
      setPendingId(projectId);
      await setProjectClient(projectId, null);
      router.refresh();
    } catch (e: any) {
      setError(e?.message ?? "Помилка відвʼязки");
    } finally {
      setPendingId(null);
    }
  }

  return (
    <Card className="rounded-2xl border bg-neutral-100 dark:bg-neutral-900 shadow-none overflow-hidden p-0 gap-0 py-0">
      {/* Unified section header */}
      <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-border/50">
        <h2 className="text-base font-bold tracking-tight text-foreground">Проєкти клієнта</h2>

        <div className="flex items-center gap-3">
          <div className="relative w-full sm:w-[200px]">
              <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground/60" />
              <Input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Пошук..."
                  className="pl-9 h-8 rounded-lg bg-background/40 border-border/50 text-xs shadow-none"
              />
          </div>

          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-8 rounded-lg border-border/40 px-3 text-[11px] font-bold shadow-none"
            onClick={() => setSort((s) => (s === "desc" ? "asc" : "desc"))}
          >
            {sort === "desc" ? <ArrowDownAZ className="h-3.5 w-3.5 mr-1.5" /> : <ArrowUpAZ className="h-3.5 w-3.5 mr-1.5" />}
            {sort === "desc" ? "Новіші" : "Старіші"}
          </Button>
        </div>
      </div>

      {error && (
        <div className="px-5 py-3">
          <div className="rounded-xl border border-destructive/40 bg-destructive/10 p-2 text-[10px] font-bold text-destructive">
            {error}
          </div>
        </div>
      )}

      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent border-b-border/50 border-t-0">
              <TableHead className="pl-6 h-12 font-bold text-[10px] tracking-tight text-muted-foreground/60">Проєкт</TableHead>
              <TableHead className="h-12 font-bold text-[10px] tracking-tight text-muted-foreground/60">Статус</TableHead>
              <TableHead className="h-12 text-right font-bold text-[10px] tracking-tight text-muted-foreground/60">Оновлено</TableHead>
              <TableHead className="pr-6 h-12 text-right font-bold text-[10px] tracking-tight text-muted-foreground/60">Дії</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="h-48 text-center">
                  <div className="flex flex-col items-center justify-center gap-3 opacity-30">
                    <Folder className="h-10 w-10" />
                    <p className="text-sm font-medium tracking-tight">Проєктів не знайдено</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((p) => {
                const isRowPending = pendingId === p.id;
                const isArchived = p.status === "archived";

                return (
                  <TableRow key={p.id} className="group border-b-border/30 hover:bg-white/[0.02] cursor-pointer transition-colors" onClick={() => router.push(`/dashboard/projects/${p.id}`)}>
                    <TableCell className="pl-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/5 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-300">
                          <Folder className="h-4.5 w-4.5" />
                        </div>
                        <span className="text-sm font-bold group-hover:text-primary transition-colors">
                          {p.name}
                        </span>
                      </div>
                    </TableCell>

                    <TableCell>
                      <StatusBadge status={p.status} />
                    </TableCell>

                    <TableCell className="text-right text-xs text-muted-foreground/70 font-medium tabular-nums px-4">
                      {format(new Date(p.updatedAt), "d MMM yyyy", { locale: uk })}
                    </TableCell>

                    <TableCell className="text-right pr-6">
                      <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all shadow-none"
                          onClick={() => detach(p.id, p.status)}
                          disabled={isRowPending || isArchived}
                          title={isArchived ? "Архівні проєкти недоступні для змін" : "Відвʼязати від клієнта"}
                        >
                          {isRowPending ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <Link2Off className="h-3.5 w-3.5" />
                          )}
                        </Button>
                        <div className="h-8 w-8 rounded-lg flex items-center justify-center text-muted-foreground/30 group-hover:text-primary transition-colors">
                          <ChevronRight className="h-4 w-4" />
                        </div>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </Card>
  );
}
