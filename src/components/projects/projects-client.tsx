"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { List, Grid, Archive } from "lucide-react";

import ProjectsGrid, { ProjectRow } from "@/components/projects/projects-grid";
import ProjectsTable from "@/components/projects/projects-table";
import ProjectCreateDialog from "@/components/projects/project-create-dialog";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

type ViewMode = "list" | "grid";
type StatusFilter = "active_completed" | "archived";
type SortKey = "name" | "createdAt" | "updatedAt" | "status";
type SortDir = "asc" | "desc";

type ProjectStatus = "active" | "completed" | "archived";

type ClientOption = { id: string; name: string };
type ClientMini = { id: string; name: string } | null;

type ProjectClientRow = ProjectRow & {
  status: ProjectStatus;
  clientName: string | null;
  client?: ClientMini;
  createdAt: string | Date;
  updatedAt: string | Date;
};

function loadViewMode(): ViewMode {
  if (typeof window === "undefined") return "list";
  const v = window.localStorage.getItem("projects:view");
  return v === "grid" ? "grid" : "list";
}

function saveViewMode(v: ViewMode) {
  window.localStorage.setItem("projects:view", v);
}

function loadGroupByClient(): boolean {
  if (typeof window === "undefined") return false;
  return window.localStorage.getItem("projects:groupByClient") === "1";
}

function saveGroupByClient(v: boolean) {
  window.localStorage.setItem("projects:groupByClient", v ? "1" : "0");
}

function toMs(d: string | Date) {
  return typeof d === "string" ? new Date(d).getTime() : d.getTime();
}

function clientLabel(client?: ClientMini) {
  const s = (client?.name ?? "").trim();
  return s ? s : "Без клієнта";
}

export default function ProjectsClient({
  projects,
  clients = [],
}: {
  projects: ProjectClientRow[];
  clients?: ClientOption[];
}) {
  const router = useRouter();

  const [view, setView] = React.useState<ViewMode>("list");
  const [statusFilter, setStatusFilter] =
    React.useState<StatusFilter>("active_completed");
  const [q, setQ] = React.useState("");
  const [sortKey, setSortKey] = React.useState<SortKey>("updatedAt");
  const [sortDir, setSortDir] = React.useState<SortDir>("desc");

  const [groupByClient, setGroupByClient] = React.useState(false);

  React.useEffect(() => {
    setView(loadViewMode());
    setGroupByClient(loadGroupByClient());
  }, []);

  const filtered = React.useMemo(() => {
    const query = q.trim().toLowerCase();

    return projects
      .filter((p) => {
        if (statusFilter === "archived") return p.status === "archived";
        return p.status === "active" || p.status === "completed";
      })
      .filter((p) => {
        if (!query) return true;

        const hay = [
          p.name,
          p.source ?? "",
          p.site ?? "",
          p.client?.name ?? "",
          p.clientName ?? "",
          p.status,
        ]
          .join(" ")
          .toLowerCase();

        return hay.includes(query);
      })
      .sort((a, b) => {
        const dir = sortDir === "asc" ? 1 : -1;

        if (sortKey === "name") return a.name.localeCompare(b.name) * dir;
        if (sortKey === "status") return a.status.localeCompare(b.status) * dir;
        if (sortKey === "createdAt")
          return (toMs(a.createdAt) - toMs(b.createdAt)) * dir;
        if (sortKey === "updatedAt")
          return (toMs(a.updatedAt) - toMs(b.updatedAt)) * dir;

        return 0;
      });
  }, [projects, q, statusFilter, sortKey, sortDir]);

  const grouped = React.useMemo(() => {
    if (!groupByClient) return null;

    const map = new Map<
      string,
      { clientId: string | null; title: string; items: ProjectClientRow[] }
    >();

    for (const p of filtered) {
      const id = p.client?.id ?? null;
      const key = id ?? "none";
      const title = clientLabel(p.client ?? null);

      const g = map.get(key);
      if (g) g.items.push(p);
      else map.set(key, { clientId: id, title, items: [p] });
    }

    const groups = Array.from(map.values()).sort((a, b) => {
      if (a.clientId === null) return 1;
      if (b.clientId === null) return -1;
      return a.title.localeCompare(b.title, "uk");
    });

    return groups;
  }, [filtered, groupByClient]);

  return (
    <div className="absolute inset-0 flex flex-col overflow-hidden bg-background">
      {/* TOP TOOLBAR - Restore original spacing */}
      <div className="flex-none p-4 pb-0">
        <div className="rounded-2xl border bg-card/50 shadow-sm">
          <div className="flex flex-col gap-4 p-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-wrap items-center gap-3">
              <ProjectCreateDialog
                clients={clients}
                onCreated={() => router.refresh()}
                trigger={
                  <Button className="w-full rounded-xl sm:w-auto shadow-sm shadow-primary/20">
                    + Новий проєкт
                  </Button>
                }
              />

              {statusFilter !== "archived" ? (
                <Button
                  type="button"
                  variant="outline"
                  className="rounded-xl h-9 text-xs sm:text-sm font-medium border-dashed hover:border-solid transition-all"
                  onClick={() => setStatusFilter("archived")}
                >
                  <Archive className="h-4 w-4 mr-2" />
                  Архів
                </Button>
              ) : (
                <Button
                  type="button"
                  variant="secondary"
                  className="rounded-xl h-9 text-xs sm:text-sm font-medium"
                  onClick={() => setStatusFilter("active_completed")}
                >
                  ← До проєктів
                </Button>
              )}

              <div className="flex items-center gap-1 rounded-xl border p-1 bg-background/50">
                <Button
                  type="button"
                  variant={view === "list" ? "secondary" : "ghost"}
                  className="h-7 rounded-lg px-3 text-xs"
                  onClick={() => {
                    setView("list");
                    saveViewMode("list");
                  }}
                >
                  Список
                </Button>
                <Button
                  type="button"
                  variant={view === "grid" ? "secondary" : "ghost"}
                  className="h-7 rounded-lg px-3 text-xs"
                  onClick={() => {
                    setView("grid");
                    saveViewMode("grid");
                  }}
                >
                  Плитки
                </Button>
              </div>

              <div className="flex items-center gap-2 rounded-xl border px-3 py-1.5 h-9 bg-background/50">
                <Switch
                  id="group-by-client"
                  checked={groupByClient}
                  onCheckedChange={(checked) => {
                    setGroupByClient(checked);
                    saveGroupByClient(checked);
                  }}
                />
                <Label
                  htmlFor="group-by-client"
                  className="text-xs font-medium cursor-pointer whitespace-nowrap"
                >
                  Групувати
                </Label>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
              <Select
                value={statusFilter}
                onValueChange={(val) => setStatusFilter(val as StatusFilter)}
              >
                <SelectTrigger className="h-9 w-full sm:w-[160px] rounded-xl bg-background/50 border-border/50">
                  <SelectValue placeholder="Статус" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active_completed">Активні</SelectItem>
                  <SelectItem value="archived">Архів</SelectItem>
                </SelectContent>
              </Select>

              <Select
                value={`${sortKey}:${sortDir}`}
                onValueChange={(val) => {
                  const [k, d] = val.split(":");
                  setSortKey(k as SortKey);
                  setSortDir(d as SortDir);
                }}
              >
                <SelectTrigger className="h-9 w-full sm:w-[160px] rounded-xl bg-background/50 border-border/50">
                  <SelectValue placeholder="Сортування" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="updatedAt:desc">Оновлено</SelectItem>
                  <SelectItem value="createdAt:desc">Створено</SelectItem>
                  <SelectItem value="name:asc">Назва (A-Z)</SelectItem>
                </SelectContent>
              </Select>

              <Input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Пошук..."
                className="w-full lg:w-[180px] h-9 rounded-xl bg-background/50 border-border/50"
              />
            </div>
          </div>
        </div>
      </div>

      {/* CONTENT area - Fills remaining space, NO independent scroll here to let inner components handle it */}
      <div className="flex-1 min-h-0 p-4 pt-2 flex flex-col">
      {grouped ? (
        <div className="space-y-6">
          {grouped.map((g) => (
            <div key={g.clientId ?? "none"} className="space-y-2">
              <div className="flex items-center justify-between">
                {g.clientId ? (
                  <Link
                    href={`/dashboard/clients/${g.clientId}`}
                    className="text-sm font-medium hover:underline underline-offset-4"
                  >
                    {g.title}
                  </Link>
                ) : (
                  <div className="text-sm font-medium">{g.title}</div>
                )}

                <div className="text-xs text-muted-foreground">
                  {g.items.length}
                </div>
              </div>

              {view === "grid" ? (
                <ProjectsGrid projects={g.items} />
              ) : (
                <ProjectsTable
                  projects={g.items.map((p) => ({
                    id: p.id,
                    name: p.name,
                    status: p.status,
                    createdAt: new Date(p.createdAt),
                    updatedAt: new Date(p.updatedAt),
                  }))}
                />
              )}
            </div>
          ))}
        </div>
      ) : view === "grid" ? (
        <ProjectsGrid projects={filtered} />
      ) : (
        <ProjectsTable
          projects={filtered.map((p) => ({
            id: p.id,
            name: p.name,
            status: p.status,
            createdAt: new Date(p.createdAt),
            updatedAt: new Date(p.updatedAt),
          }))}
        />
      )}
      </div>
    </div>
  );
}
