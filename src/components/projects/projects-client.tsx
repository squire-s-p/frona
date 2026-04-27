"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  List,
  Grid,
  Archive,
  Search,
  Plus,
  ArrowUpDown,
  Filter,
} from "lucide-react";

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
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import { Field, FieldLabel } from "@/components/ui/field";

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
      {/* Header Section */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between px-1">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Проєкти
          </h1>
          <p className="text-muted-foreground mt-1">
            Керуйте вашими активними та завершеними проєктами.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <ProjectCreateDialog
            clients={clients}
            onCreated={() => router.refresh()}
            trigger={
              <Button size="lg" className="rounded-xl shadow-lg shadow-primary/20 gap-2">
                <Plus className="h-5 w-5" />
                <span>Новий проєкт</span>
              </Button>
            }
          />
        </div>
      </div>

      {/* Toolbar Section */}
      <Card className="rounded-2xl border-border/50 bg-card/30 backdrop-blur-sm overflow-visible">
        <CardContent className="p-4">
          <div className="flex flex-col gap-6">
            {/* Top row: Filter Tabs & View Mode */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <Tabs
                value={statusFilter}
                onValueChange={(v) => setStatusFilter(v as StatusFilter)}
                className="w-full sm:w-auto"
              >
                <TabsList className="grid w-full grid-cols-2 sm:w-[300px]">
                  <TabsTrigger value="active" className="gap-2">
                    Активні
                    <span className="ml-1 rounded-full bg-primary/10 px-1.5 py-0.5 text-[10px] font-bold text-primary">
                      {projects.filter(p => p.status === 'active').length}
                    </span>
                  </TabsTrigger>
                  <TabsTrigger value="completed" className="gap-2">
                    Завершені
                    <span className="ml-1 rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-bold text-muted-foreground">
                      {projects.filter(p => p.status !== 'active').length}
                    </span>
                  </TabsTrigger>
                </TabsList>
              </Tabs>

              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1 rounded-xl border p-1 bg-background/50">
                  <Button
                    variant={view === "list" ? "secondary" : "ghost"}
                    size="sm"
                    className="h-8 rounded-lg px-3"
                    onClick={() => {
                      setView("list");
                      saveViewMode("list");
                    }}
                  >
                    <List className="h-4 w-4 mr-2" />
                    Список
                  </Button>
                  <Button
                    variant={view === "grid" ? "secondary" : "ghost"}
                    size="sm"
                    className="h-8 rounded-lg px-3"
                    onClick={() => {
                      setView("grid");
                      saveViewMode("grid");
                    }}
                  >
                    <Grid className="h-4 w-4 mr-2" />
                    Плитки
                  </Button>
                </div>
              </div>
            </div>

            {/* Bottom row: Search & Sorting */}
            <div className="grid gap-4 md:grid-cols-[1fr,auto,auto]">
              <InputGroup>
                <InputGroupAddon>
                  <Search className="h-4 w-4 text-muted-foreground" />
                </InputGroupAddon>
                <InputGroupInput
                  placeholder="Пошук за назвою, клієнтом або сайтом..."
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  className="bg-background/50"
                />
              </InputGroup>

              <div className="flex items-center gap-3">
                <Select
                  value={`${sortKey}:${sortDir}`}
                  onValueChange={(val) => {
                    const [k, d] = val.split(":");
                    setSortKey(k as SortKey);
                    setSortDir(d as SortDir);
                  }}
                >
                  <SelectTrigger className="w-full md:w-[180px] rounded-xl bg-background/50 border-border/50">
                    <ArrowUpDown className="h-4 w-4 mr-2 text-muted-foreground" />
                    <SelectValue placeholder="Сортування" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="updatedAt:desc">Оновлено (спочатку нові)</SelectItem>
                    <SelectItem value="updatedAt:asc">Оновлено (спочатку старі)</SelectItem>
                    <SelectItem value="createdAt:desc">Створено (спочатку нові)</SelectItem>
                    <SelectItem value="name:asc">Назва (A-Z)</SelectItem>
                    <SelectItem value="name:desc">Назва (Z-A)</SelectItem>
                  </SelectContent>
                </Select>

                <div className="h-9 w-px bg-border/50" />

                <Field orientation="horizontal" className="gap-2">
                  <Switch
                    id="group-by-client"
                    checked={groupByClient}
                    onCheckedChange={(checked) => {
                      setGroupByClient(checked);
                      saveGroupByClient(checked);
                    }}
                  />
                  <FieldLabel
                    htmlFor="group-by-client"
                    className="text-sm font-medium cursor-pointer whitespace-nowrap"
                  >
                    Групувати
                  </FieldLabel>
                </Field>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Content Area */}
      <div className="flex-1 min-h-0 overflow-y-auto pr-1 scrollbar-hide">
        {grouped ? (
          <div className="space-y-10 pb-20">
            {grouped.map((g) => (
              <div key={g.clientId ?? "none"} className="space-y-4">
                <div className="flex items-center justify-between border-b border-border/50 pb-2">
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
          <div className="pb-20">
            <ProjectsGrid projects={filtered} />
          </div>
        ) : (
          <div className="pb-20">
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
  );
}
