"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Search, List, Grid, Filter, Receipt, Plus, ArrowUpDown } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";

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
    <div className="flex flex-col gap-6 h-full">
      {/* Header Section: Новий клієнт + Рахунки + Вигляд */}
      <div className="flex items-center justify-between px-1 gap-4">
        <div className="flex items-center gap-4">
          <Button onClick={() => setOpen(true)} className="gap-2 rounded-lg">
            <Plus className="h-4 w-4" />
            <span>Новий клієнт</span>
          </Button>

          <Link href="/dashboard/invoices">
            <Button
              variant="outline"
              className="h-9 text-xs font-medium border-dashed hover:border-solid transition-all px-4 rounded-lg"
            >
              <Receipt className="h-4 w-4 mr-2" />
              Рахунки
            </Button>
          </Link>
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

      {/* Unified Clients Card */}
      <Card className="flex-1 flex flex-col min-h-0 sm:rounded-3xl border-none shadow-none dark:shadow-none sm:ring-1 sm:ring-border/50 sm:dark:bg-neutral-900 dark:bg-transparent sm:bg-white bg-transparent backdrop-blur-none sm:backdrop-blur-sm overflow-hidden py-0">
        
        {/* Filter Section */}
        <div className="hidden sm:flex px-6 py-3 border-b border-border/50 items-center justify-between gap-4">
          <h3 className="text-sm font-bold tracking-tight dark:text-white text-neutral-600">Фільтри</h3>
          
          <div className="flex items-center gap-4 flex-1 justify-end">
            {/* Sorting */}
            <Select
              value={`${sortKey}:${sortDir}`}
              onValueChange={(val) => {
                const [k, d] = val.split(":");
                setSortKey(k as SortKey);
                setSortDir(d as SortDir);
              }}
            >
              <SelectTrigger className="w-fit min-w-[140px] h-8 text-xs bg-background/40 border-border/50 rounded-md">
                <ArrowUpDown className="h-3 w-3 mr-2 text-muted-foreground" />
                <SelectValue placeholder="Сортування" />
              </SelectTrigger>
              <SelectContent align="start">
                <SelectItem value="name:asc">Назва (А-Я)</SelectItem>
                <SelectItem value="name:desc">Назва (Я-А)</SelectItem>
                <SelectItem value="createdAt:desc">Спочатку нові</SelectItem>
                <SelectItem value="activeProjects:desc">Активність</SelectItem>
              </SelectContent>
            </Select>

            {/* Search */}
            <div className="flex items-center gap-2 w-64">
              <InputGroup>
                <InputGroupAddon className="h-8 w-8 bg-transparent">
                  <Search className="h-3.5 w-3.5 text-muted-foreground" />
                </InputGroupAddon>
                <InputGroupInput
                  placeholder="Пошук клієнтів..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="bg-background/40 h-8 text-xs border-border/50 rounded-md"
                />
              </InputGroup>
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar relative">
          <div className="p-0 pb-20">
            {view === "list" ? (
              <ClientsTable clients={filteredAndSorted} />
            ) : (
              <div className="p-6">
                <ClientsGrid clients={filteredAndSorted} />
              </div>
            )}
          </div>
        </div>
      </Card>

      <NewClientDialog open={open} onOpenChange={setOpen} projects={projects} />
    </div>
  );
}
