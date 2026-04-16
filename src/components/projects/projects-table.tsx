"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { archiveProject, restoreProject, deleteProject } from "@/app/dashboard/projects/actions";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { Archive, RotateCcw, ChevronRight, Folder, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { uk } from "date-fns/locale";

type ProjectRow = {
  id: string;
  name: string;
  status: "active" | "completed" | "archived";
  createdAt: Date;
  updatedAt: Date;
};

const statusConfig = {
  active: { label: "Активний", className: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" },
  completed: { label: "Завершений", className: "bg-blue-500/10 text-primary border-blue-500/20" },
  archived: { label: "Архів", className: "bg-slate-500/10 text-slate-600 border-slate-500/20" },
};

function StatusBadge({ status }: { status: ProjectRow["status"] }) {
  const config = statusConfig[status];
  return (
    <Badge variant="outline" className={cn("text-[10px] uppercase tracking-wider font-bold px-2 py-0 border", config.className)}>
      {config.label}
    </Badge>
  );
}

export default function ProjectsTable({ projects }: { projects: ProjectRow[] }) {
  const router = useRouter();
  const [pendingId, setPendingId] = React.useState<string | null>(null);

  async function onArchive(id: string) {
    try {
      setPendingId(id);
      await archiveProject(id);
      router.refresh();
    } finally {
      setPendingId(null);
    }
  }

  async function onRestore(id: string) {
    try {
      setPendingId(id);
      await restoreProject(id);
      router.refresh();
    } finally {
      setPendingId(null);
    }
  }

  async function onDelete(id: string) {
    if (!confirm("Видалити цей проєкт назавжди?")) return;
    
    try {
      setPendingId(id);
      await deleteProject(id);
      router.refresh();
    } catch (err) {
      alert("Помилка при видаленні");
    } finally {
      setPendingId(null);
    }
  }

  return (
    <div className="flex-1 min-h-0 flex flex-col h-full overflow-hidden">
      {/* Mobile View: Cards */}
      <div className="grid grid-cols-1 gap-4 md:hidden overflow-y-auto flex-1 p-1 scrollbar-hide">
        {projects.map((p) => (
          <div key={p.id} className="rounded-2xl border bg-card/50 p-4 shadow-sm backdrop-blur-sm">
            <div className="flex items-start justify-between">
              <div className="min-w-0 flex-1">
                <Link
                  href={`/dashboard/projects/${p.id}`}
                  className="block truncate text-lg font-bold hover:text-primary transition-colors"
                >
                  {p.name}
                </Link>
                <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-muted-foreground font-medium">
                  <span className="flex items-center gap-1">
                    Створено: {format(new Date(p.createdAt), "d MMM yyyy", { locale: uk })}
                  </span>
                </div>
              </div>
              <div className="ml-4 shrink-0"><StatusBadge status={p.status} /></div>
            </div>
            <div className="mt-4 flex items-center justify-between border-t border-border/50 pt-3">
               <Link href={`/dashboard/projects/${p.id}`} className="text-xs font-bold text-primary flex items-center gap-1">
                  Відкрити <ChevronRight className="h-3 w-3" />
               </Link>

              <div className="flex items-center gap-2">
                {p.status === "archived" ? (
                    <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 rounded-lg text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                    disabled={pendingId === p.id}
                    onClick={() => onRestore(p.id)}
                    >
                    <RotateCcw className="h-4 w-4 mr-1.5" />
                    Відновити
                    </Button>
                ) : (
                    <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 rounded-lg text-slate-500 hover:text-slate-700 hover:bg-slate-100"
                    disabled={pendingId === p.id}
                    onClick={() => onArchive(p.id)}
                    >
                    <Archive className="h-4 w-4 mr-1.5" />
                    В архів
                    </Button>
                )}
                <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 rounded-lg text-destructive hover:bg-destructive/10"
                    disabled={pendingId === p.id}
                    onClick={() => onDelete(p.id)}
                >
                    <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        ))}
        
        {projects.length === 0 && (
          <div className="py-20 text-center flex flex-col items-center">
            <Folder className="h-10 w-10 text-muted-foreground/30 mb-2" />
            <div className="text-sm font-medium text-muted-foreground">Нічого не знайдено</div>
          </div>
        )}
      </div>

      {/* Desktop View: Table */}
      <div className="hidden flex-1 md:flex flex-col min-h-0 h-full overflow-hidden">
        <div className="flex-1 overflow-auto w-full relative min-h-0 scrollbar-hide rounded-2xl border border-border/50 bg-card/50 backdrop-blur-sm shadow-sm">
          <Table className="relative min-w-[800px]">
            <TableHeader className="relative z-30">
              <TableRow className="hover:bg-transparent border-b-0">
                <TableHead className="sticky top-0 z-30 font-bold text-[11px] uppercase tracking-wider pl-6 py-4 bg-background border-b border-border/50 shadow-[0_1px_0_0_rgba(0,0,0,0.1)]">Проєкт</TableHead>
                <TableHead className="sticky top-0 z-30 w-[140px] font-bold text-[11px] uppercase tracking-wider bg-background border-b border-border/50 shadow-[0_1px_0_0_rgba(0,0,0,0.1)]">Статус</TableHead>
                <TableHead className="sticky top-0 z-30 w-[180px] font-bold text-[11px] uppercase tracking-wider bg-background border-b border-border/50 shadow-[0_1px_0_0_rgba(0,0,0,0.1)]">Створено</TableHead>
                <TableHead className="sticky top-0 z-30 w-[180px] font-bold text-[11px] uppercase tracking-wider bg-background border-b border-border/50 shadow-[0_1px_0_0_rgba(0,0,0,0.1)]">Оновлено</TableHead>
                <TableHead className="sticky top-0 z-30 w-[120px] text-right pr-6 font-bold text-[11px] uppercase tracking-wider bg-background border-b border-border/50 shadow-[0_1px_0_0_rgba(0,0,0,0.1)]">Дії</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {projects.map((p) => (
                <TableRow 
                  key={p.id} 
                  className="group transition-colors hover:bg-primary/[0.02] border-b-border/40 cursor-pointer"
                  onClick={() => router.push(`/dashboard/projects/${p.id}`)}
                >
                  <TableCell className="font-bold pl-6">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-primary/5 flex items-center justify-center group-hover:bg-primary/10 transition-colors">
                        <Folder className="h-4 w-4 text-primary/70 group-hover:text-primary transition-colors" />
                      </div>
                      <span className="group-hover:text-primary transition-colors">
                        {p.name}
                      </span>
                    </div>
                  </TableCell>

                  <TableCell><StatusBadge status={p.status} /></TableCell>

                  <TableCell className="text-xs text-muted-foreground font-medium tabular-nums">
                    {format(new Date(p.createdAt), "d MMM yyyy", { locale: uk })}
                  </TableCell>

                  <TableCell className="text-xs text-muted-foreground font-medium tabular-nums">
                     {format(new Date(p.updatedAt), "d MMM yyyy", { locale: uk })}
                  </TableCell>

                  <TableCell className="text-right pr-6">
                    <div 
                      className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {p.status === "archived" ? (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 rounded-lg text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                          title="Відновити"
                          disabled={pendingId === p.id}
                          onClick={() => onRestore(p.id)}
                        >
                          <RotateCcw className="h-4 w-4" />
                        </Button>
                      ) : (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
                          title="В архів"
                          disabled={pendingId === p.id}
                          onClick={() => onArchive(p.id)}
                        >
                          <Archive className="h-4 w-4" />
                        </Button>
                      )}
                      <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 rounded-lg text-destructive hover:bg-destructive/10"
                          title="Видалити"
                          disabled={pendingId === p.id}
                          onClick={() => onDelete(p.id)}
                      >
                          <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}

              {projects.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="py-20 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <Folder className="h-10 w-10 text-muted-foreground/30" />
                      <div className="text-sm font-medium text-muted-foreground">
                        Нічого не знайдено.
                      </div>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
