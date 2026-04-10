"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowDownAZ, ArrowUpAZ, Link2Off, Loader2, Search } from "lucide-react";

import { setProjectClient } from "@/app/dashboard/projects/actions";

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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

const statusColors = {
    active: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
    completed: "bg-blue-500/10 text-blue-600 border-blue-500/20",
    archived: "bg-slate-500/10 text-slate-600 border-slate-500/20",
};

const statusLabels = {
    active: "Активний",
    completed: "Завершений",
    archived: "Архів",
};

function statusLabel(status: string) {
  if (status === "active") return "active";
  if (status === "completed") return "completed";
  if (status === "archived") return "archived";
  return status;
}

type StatusFilter = "all" | "active" | "completed" | "archived";

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

    if (status !== "all") {
      list = list.filter((p) => p.status === status);
    }

    if (q) {
      list = list.filter((p) => p.name.toLowerCase().includes(q));
    }

    list.sort((a, b) => {
      const at = new Date(a.updatedAt).getTime();
      const bt = new Date(b.updatedAt).getTime();
      return sort === "desc" ? bt - at : at - bt;
    });

    return list;
  }, [projects, query, status, sort]);

  function FilterButton({
    value,
    label,
    count,
  }: {
    value: StatusFilter;
    label: string;
    count: number;
  }) {
    const active = status === value;
    return (
        <Button
          type="button"
          variant={active ? "secondary" : "ghost"}
          size="sm"
          onClick={() => setStatus(value)}
          className={cn(
            "h-7 rounded-lg px-3 text-[10px] font-bold uppercase tracking-wider transition-all",
            active ? "bg-primary/10 text-primary shadow-sm" : "text-muted-foreground hover:bg-muted"
          )}
        >
          {label}
          <span className={cn("ml-1.5 rounded-full px-1.5 py-0.5 text-[9px]", active ? "bg-primary/20" : "bg-muted-foreground/10")}>
            {count}
          </span>
        </Button>
    );
  }

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
    <Card className="rounded-2xl border bg-card shadow-sm overflow-hidden p-0">
      {/* Unified section header */}
      <div className="flex flex-col gap-4 px-4 pt-4 pb-3 border-b border-border/50">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-base font-bold tracking-tight text-foreground">Проєкти клієнта</h2>

          <div className="flex flex-wrap items-center gap-2">
            <div className="relative w-full sm:w-[220px]">
                <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground/60" />
                <Input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Пошук..."
                    className="pl-9 h-9 rounded-lg bg-background/50 border-border/50 text-xs"
                />
            </div>

            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-9 rounded-lg border-border/40 px-3 text-xs font-medium"
              onClick={() => setSort((s) => (s === "desc" ? "asc" : "desc"))}
            >
              {sort === "desc" ? <ArrowDownAZ className="h-3.5 w-3.5 mr-1.5" /> : <ArrowUpAZ className="h-3.5 w-3.5 mr-1.5" />}
              {sort === "desc" ? "Новіші" : "Старіші"}
            </Button>
          </div>
        </div>

        <div className="flex flex-wrap gap-1.5">
          <FilterButton value="all" label="Всі" count={counts.all} />
          <FilterButton value="active" label="Активні" count={counts.active} />
          <FilterButton value="completed" label="Завершені" count={counts.completed} />
          <FilterButton value="archived" label="Архів" count={counts.archived} />
        </div>

        {error ? (
          <div className="rounded-md border border-destructive/40 bg-destructive/10 p-2 text-xs text-destructive">
            {error}
          </div>
        ) : null}
      </div>

      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent border-b-border/50 bg-muted/5">
              <TableHead className="font-bold text-[10px] uppercase tracking-wider pl-6 py-3">Проєкт</TableHead>
              <TableHead className="w-[140px] font-bold text-[10px] uppercase tracking-wider py-3">Статус</TableHead>
              <TableHead className="w-[180px] text-right font-bold text-[10px] uppercase tracking-wider py-3">Оновлено</TableHead>
              <TableHead className="w-[120px] text-right pr-6 font-bold text-[10px] uppercase tracking-wider py-3">Дії</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="py-12 text-center text-muted-foreground italic text-sm">
                  {projects.length === 0
                    ? "У цього клієнта поки немає проєктів"
                    : "Нічого не знайдено за вашим запитом"}
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((p) => {
                const isRowPending = pendingId === p.id;
                const isArchived = p.status === "archived";
                const pStatus = statusLabel(p.status) as "active" | "completed" | "archived";

                return (
                  <TableRow key={p.id} className="group hover:bg-primary/[0.02] border-b-border/40 transition-colors">
                    <TableCell className="font-bold pl-6">
                      <Link
                        href={`/dashboard/projects/${p.id}`}
                        className="hover:text-primary transition-colors underline-offset-4 decoration-primary/30"
                      >
                        {p.name}
                      </Link>
                    </TableCell>

                    <TableCell>
                      <Badge variant="outline" className={cn("text-[10px] uppercase tracking-wider font-bold px-2 py-0 border", statusColors[pStatus] || statusColors.active)}>
                        {statusLabels[pStatus] || pStatus}
                      </Badge>
                    </TableCell>

                    <TableCell className="text-right text-muted-foreground text-xs font-medium tabular-nums px-4">
                      {new Intl.DateTimeFormat("uk-UA", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      }).format(new Date(p.updatedAt))}
                    </TableCell>

                    <TableCell className="text-right pr-6">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 rounded-lg text-slate-400 hover:text-destructive hover:bg-destructive/10 opacity-0 group-hover:opacity-100 transition-opacity p-0 flex items-center justify-center ml-auto"
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
