"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { setProjectStatus } from "@/app/dashboard/projects/actions";
import { Button } from "@/components/ui/button";
import DeleteProjectDialog from "@/components/projects/delete-project-dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { 
  CheckCircle, 
  RotateCcw, 
  ChevronRight, 
  Folder, 
  Trash2,
  Calendar
} from "lucide-react";
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

function StatusBadge({ status }: { status: ProjectRow["status"] }) {
  const config = statusConfig[status];
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

export default function ProjectsTable({ projects }: { projects: ProjectRow[] }) {
  const router = useRouter();
  const [_pendingId, setPendingId] = React.useState<string | null>(null);

  async function onComplete(id: string) {
    try {
      setPendingId(id);
      await setProjectStatus(id, "completed");
      router.refresh();
    } finally {
      setPendingId(null);
    }
  }

  async function onRestore(id: string) {
    try {
      setPendingId(id);
      await setProjectStatus(id, "active");
      router.refresh();
    } finally {
      setPendingId(null);
    }
  }

  return (
    <div className="w-full">
      {/* Mobile View: Cards */}
      <div className="grid grid-cols-1 gap-4 md:hidden p-0">
        {projects.map((p) => (
          <div
            key={p.id}
            className="rounded-2xl border border-border/60 bg-neutral-100 dark:bg-neutral-900 p-4 shadow-none transition-all hover:border-primary/30"
          >
            <div className="flex items-start justify-between">
              <div className="min-w-0 flex-1">
                <Link
                  href={`/dashboard/projects/${p.id}`}
                  className="block truncate text-lg font-bold hover:text-primary transition-colors"
                >
                  {p.name}
                </Link>
                <div className="mt-1 flex items-center gap-2 text-[11px] text-muted-foreground font-medium">
                  <Calendar className="h-3 w-3" />
                  {format(new Date(p.createdAt), "d MMM yyyy", { locale: uk })}
                </div>
              </div>
              <StatusBadge status={p.status} />
            </div>
            <div className="mt-4 flex items-center justify-between border-t border-border/50 pt-3">
              <Link
                href={`/dashboard/projects/${p.id}`}
                className="text-xs font-bold text-primary flex items-center gap-1 hover:underline underline-offset-4"
              >
                Відкрити <ChevronRight className="h-3 w-3" />
              </Link>

              <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                <DeleteProjectDialog 
                   projectId={p.id} 
                   projectName={p.name} 
                   onDeleted={() => router.refresh()}
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Desktop View: Table */}
      <div className="hidden md:block">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent border-b-border/50 border-t-0">
              <TableHead className="pl-6 h-12 font-bold text-[10px] tracking-tight text-muted-foreground/60">
                Проєкт
              </TableHead>
              <TableHead className="h-12 font-bold text-[10px] tracking-tight text-muted-foreground/60">
                Статус
              </TableHead>
              <TableHead className="h-12 font-bold text-[10px] tracking-tight text-muted-foreground/60">
                Створено
              </TableHead>
              <TableHead className="h-12 font-bold text-[10px] tracking-tight text-muted-foreground/60">
                Оновлено
              </TableHead>
              <TableHead className="pr-6 h-12 text-right font-bold text-[10px] tracking-tight text-muted-foreground/60">
                Дії
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {projects.map((p) => (
              <TableRow
                key={p.id}
                className="group border-b-border/30 hover:bg-white/[0.02] cursor-pointer transition-colors"
                onClick={() => router.push(`/dashboard/projects/${p.id}`)}
              >
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

                <TableCell className="text-xs text-muted-foreground/70 font-medium tabular-nums">
                  {format(new Date(p.createdAt), "d MMMM yyyy", { locale: uk })}
                </TableCell>

                <TableCell className="text-xs text-muted-foreground/70 font-medium tabular-nums">
                  {format(new Date(p.updatedAt), "d MMMM yyyy", { locale: uk })}
                </TableCell>

                <TableCell className="pr-6 text-right">
                  <div className="flex items-center justify-end gap-1 transition-opacity" onClick={(e) => e.stopPropagation()}>
                    {p.status === "completed" ? (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 rounded-lg text-emerald-600 hover:bg-emerald-500/10"
                        title="Відновити"
                        onClick={() => onRestore(p.id)}
                      >
                        <RotateCcw className="h-4 w-4" />
                      </Button>
                    ) : (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 rounded-lg text-primary hover:bg-primary/10"
                        title="Завершити"
                        onClick={() => onComplete(p.id)}
                      >
                        <CheckCircle className="h-4 w-4" />
                      </Button>
                    )}
                    <DeleteProjectDialog 
                       projectId={p.id} 
                       projectName={p.name} 
                       onDeleted={() => router.refresh()}
                       trigger={
                         <Button
                           variant="ghost"
                           size="icon"
                           className="h-8 w-8 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                         >
                           <Trash2 className="h-4 w-4" />
                         </Button>
                       }
                    />
                    <div className="h-8 w-8 rounded-lg flex items-center justify-center text-muted-foreground/30 group-hover:text-primary transition-colors">
                      <ChevronRight className="h-4 w-4" />
                    </div>
                  </div>
                </TableCell>
              </TableRow>
            ))}

            {projects.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="h-64 text-center">
                  <div className="flex flex-col items-center justify-center gap-3 opacity-30">
                    <Folder className="h-12 w-12" />
                    <p className="text-sm font-medium tracking-tight">Проєктів не знайдено</p>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
