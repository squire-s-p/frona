"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  List,
  Grid,
  Search,
  Plus,
  ArrowUpDown,
} from "lucide-react";

import ProjectsGrid, { ProjectRow } from "@/components/projects/projects-grid";
import ProjectsTable from "@/components/projects/projects-table";
import ProjectCreateDialog from "@/components/projects/project-create-dialog";

import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";

type ViewMode = "list" | "grid";
type StatusFilter = "active" | "completed";
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
    React.useState<StatusFilter>("active");
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
        if (statusFilter === "completed")
          return p.status === "completed" || p.status === "archived";
        return p.status === "active";
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
    <div className="flex flex-col gap-6 h-full">
      {/* Header Section: Новий проєкт + Статус + Вигляд */}
      <div className="flex items-center justify-between px-1 gap-4">
        <div className="flex flex-1 items-center justify-between sm:justify-start sm:gap-6">
          <ProjectCreateDialog
            clients={clients}
            onCreated={() => router.refresh()}
            trigger={
              <Button size="default" className="gap-2">
                <Plus className="h-4 w-4" />
                <span>Новий проєкт</span>
              </Button>
            }
          />

          <Tabs
            value={statusFilter}
            onValueChange={(v) => setStatusFilter(v as StatusFilter)}
            className="w-auto"
          >
            <TabsList variant="line" className="h-10 gap-6">
              <TabsTrigger value="active" className="px-0 text-sm">
                Активні
              </TabsTrigger>
              <TabsTrigger value="completed" className="px-0 text-sm">
                Завершені
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        <div className="hidden sm:flex items-center gap-2">
          <Tabs
            value={view}
            onValueChange={(v) => {
              setView(v as ViewMode);
              saveViewMode(v as ViewMode);
            }}
            className="w-auto"
          >
            <TabsList className="h-9 p-1">
              <TabsTrigger value="list" className="h-7 w-8 p-0" title="Список">
                <List className="h-4 w-4" />
              </TabsTrigger>
              <TabsTrigger value="grid" className="h-7 w-8 p-0" title="Плитки">
                <Grid className="h-4 w-4" />
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

      {/* Toolbar Section: Пошук та Сортування */}
      {/* Unified Projects Card */}
      <Card className="flex-1 flex flex-col min-h-0 sm:rounded-3xl border-none shadow-none dark:shadow-none sm:ring-1 sm:ring-border/50 sm:dark:bg-neutral-900 dark:bg-transparent sm:bg-white bg-transparent backdrop-blur-none sm:backdrop-blur-sm overflow-hidden py-0">
        {/* Filter Section: компактний рядок, прихований на мобілці */}
        <div className="hidden sm:flex px-6 py-3 border-b border-border/50 items-center justify-between gap-4">
          <h3 className="text-sm font-bold tracking-tight dark:text-white text-neutral-600">Фільтри</h3>
          
          <div className="flex items-center gap-4 flex-1 justify-end">
            {/* Sort (тепер перший) */}
            <Select
              value={`${sortKey}:${sortDir}`}
              onValueChange={(val) => {
                const [k, d] = val.split(":");
                setSortKey(k as SortKey);
                setSortDir(d as SortDir);
              }}
            >
              <SelectTrigger className="w-fit min-w-[140px] h-8 text-xs bg-background/40 border-border/50">
                <ArrowUpDown className="h-3 w-3 mr-2 text-muted-foreground" />
                <SelectValue placeholder="Сортування" />
              </SelectTrigger>
              <SelectContent align="start">
                <SelectItem value="updatedAt:desc">Оновлено (нові)</SelectItem>
                <SelectItem value="updatedAt:asc">Оновлено (старі)</SelectItem>
                <SelectItem value="createdAt:desc">Створено (нові)</SelectItem>
                <SelectItem value="name:asc">Назва (A-Z)</SelectItem>
              </SelectContent>
            </Select>

            {/* Search */}
            <div className="flex items-center gap-2 w-64">
              <InputGroup>
                <InputGroupAddon className="h-8 w-8">
                  <Search className="h-3.5 w-3.5 text-muted-foreground" />
                </InputGroupAddon>
                <InputGroupInput
                  placeholder="Пошук..."
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  className="bg-background/40 h-8 text-xs border-border/50"
                />
              </InputGroup>
            </div>

            <div className="h-4 w-px bg-border/50" />

            {/* Grouping */}
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-medium tracking-wider text-muted-foreground/60">Групувати</span>
              <Switch
                id="group-by-client"
                className="scale-75 origin-right"
                checked={groupByClient}
                onCheckedChange={(checked) => {
                  setGroupByClient(checked);
                  saveGroupByClient(checked);
                }}
              />
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar relative">
          <div className="p-0">
            {grouped ? (
              <div className="space-y-10 p-0 pb-20">
                {grouped.map((g) => (
                  <div key={g.clientId ?? "none"} className="space-y-4">
                    <div className="flex items-center justify-between border-b border-border/50 pb-2 px-6">
                      <div className="flex items-center gap-2">
                        {g.clientId ? (
                          <Link
                            href={`/dashboard/clients/${g.clientId}`}
                            className="text-lg font-bold hover:text-primary transition-colors flex items-center gap-2"
                          >
                            {g.title}
                            <span className="text-xs font-normal text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                              {g.items.length}
                            </span>
                          </Link>
                        ) : (
                          <div className="text-lg font-bold flex items-center gap-2">
                            {g.title}
                            <span className="text-xs font-normal text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                              {g.items.length}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="px-0">
                      {view === "grid" ? (
                        <div className="px-6">
                          <ProjectsGrid projects={g.items} />
                        </div>
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
                  </div>
                ))}
              </div>
            ) : view === "grid" ? (
              <div className="p-0 sm:p-6 pb-20">
                <ProjectsGrid projects={filtered} />
              </div>
            ) : (
              <div className="p-0 pb-20">
                <ProjectsTable
                  projects={filtered.map((p) => ({
                    id: p.id,
                    name: p.name,
                    status: p.status,
                    createdAt: new Date(p.createdAt),
                    updatedAt: new Date(p.updatedAt),
                  }))}
                />
              </div>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
}
