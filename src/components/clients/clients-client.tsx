"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Search, List, Grid, Filter, Receipt } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

import ClientsTable from "./clients-table";
import ClientsGrid from "./clients-grid";
import NewClientDialog from "./new-client-dialog";

type ClientRow = {
  id: string;
  name: string;
  activeProjects: number;
  totalProjects: number;
  createdAt: Date;
};

type ProjectOption = {
  id: string;
  name: string;
  clientId: string | null;
  status: string;
};

type ViewMode = "list" | "grid";
type SortKey = "name" | "createdAt" | "activeProjects" | "totalProjects";
type SortDir = "asc" | "desc";

function loadViewMode(): ViewMode {
  if (typeof window === "undefined") return "list";
  return (window.localStorage.getItem("clients:view") as ViewMode) || "list";
}

function saveViewMode(v: ViewMode) {
  window.localStorage.setItem("clients:view", v);
}

export default function ClientsClient({
  clients: initialClients,
  projects,
}: {
  clients: ClientRow[];
  projects: ProjectOption[];
}) {
  const router = useRouter();
  const [view, setView] = React.useState<ViewMode>("list");
  const [query, setQuery] = React.useState("");
  const [sortKey, setSortKey] = React.useState<SortKey>("name");
  const [sortDir, setSortDir] = React.useState<SortDir>("asc");
  const [open, setOpen] = React.useState(false);

  React.useEffect(() => {
    setView(loadViewMode());
  }, []);

  const filteredAndSorted = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    
    return initialClients
      .filter((c) => {
        if (!q) return true;
        return c.name.toLowerCase().includes(q);
      })
      .sort((a, b) => {
        const dir = sortDir === "asc" ? 1 : -1;
        if (sortKey === "name") return a.name.localeCompare(b.name) * dir;
        if (sortKey === "createdAt") return (a.createdAt.getTime() - b.createdAt.getTime()) * dir;
        if (sortKey === "activeProjects") return (a.activeProjects - b.activeProjects) * dir;
        if (sortKey === "totalProjects") return (a.totalProjects - b.totalProjects) * dir;
        return 0;
      });
  }, [initialClients, query, sortKey, sortDir]);

  return (
    <div className="absolute inset-0 flex flex-col overflow-hidden bg-background">
      {/* TOP TOOLBAR - SYNCED WITH PROJECTS (p-4 pb-0) */}
      <div className="flex-none p-4 pb-0">
        <div className="rounded-2xl border bg-card/50 shadow-sm">
          <div className="flex flex-col gap-4 p-4 lg:flex-row lg:items-center lg:justify-between">
            
            <div className="flex flex-wrap items-center gap-3">
              <Button 
                onClick={() => setOpen(true)} 
                className="w-full sm:w-auto rounded-xl shadow-sm shadow-primary/20 h-9 px-5 font-bold"
              >
                + Новий клієнт
              </Button>

              {/* View Toggle - Sync h-9 and px-3 */}
              <div className="flex items-center gap-1 rounded-xl border p-1 bg-background/50 h-9">
                <Button
                  type="button"
                  variant={view === "list" ? "secondary" : "ghost"}
                  className="h-7 rounded-lg px-3 text-xs"
                  onClick={() => {
                    setView("list");
                    saveViewMode("list");
                  }}
                  title="Список"
                >
                  <List className="h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  variant={view === "grid" ? "secondary" : "ghost"}
                  className="h-7 rounded-lg px-3 text-xs"
                  onClick={() => {
                    setView("grid");
                    saveViewMode("grid");
                  }}
                  title="Плитки"
                >
                  <Grid className="h-4 w-4" />
                </Button>
              </div>

              {/* Invoices Link - Added instead of refresh */}
              <Link href="/dashboard/invoices">
                <Button
                  variant="outline"
                  className="rounded-xl h-9 text-xs sm:text-sm font-medium border-dashed hover:border-solid transition-all px-4"
                >
                  <Receipt className="h-4 w-4 mr-2" />
                  Рахунки
                </Button>
              </Link>
            </div>

            <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
              {/* Sorting - Sync h-9 */}
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
                        <SelectItem value="name:asc">Назва (А-Я)</SelectItem>
                        <SelectItem value="name:desc">Назва (Я-А)</SelectItem>
                        <SelectItem value="createdAt:desc">Спочатку нові</SelectItem>
                        <SelectItem value="activeProjects:desc">Активність</SelectItem>
                    </SelectContent>
                </Select>

                {/* Search - Sync h-9 */}
                <div className="relative w-full lg:w-[200px]">
                    <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground/60" />
                    <Input
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Пошук клієнтів..."
                        className="pl-9 h-9 rounded-xl bg-background/50 border-border/50 focus-visible:ring-primary/20 font-medium text-xs"
                    />
                </div>
            </div>
          </div>
        </div>
      </div>

      {/* CONTENT Area - SYNCED WITH PROJECTS (p-4 pt-2) */}
      <div className="flex-1 min-h-0 p-4 pt-2 flex flex-col">
        {view === "list" ? (
          <ClientsTable clients={filteredAndSorted} />
        ) : (
          <ClientsGrid clients={filteredAndSorted} />
        )}
      </div>

      <NewClientDialog open={open} onOpenChange={setOpen} projects={projects} />
    </div>
  );
}
