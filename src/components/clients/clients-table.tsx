"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { uk } from "date-fns/locale";
import { User, ChevronRight, Calendar, Briefcase, Trash2 } from "lucide-react";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { deleteClient } from "@/app/dashboard/clients/actions";

type ClientRow = {
  id: string;
  name: string;
  activeProjects: number;
  totalProjects: number;
  createdAt: Date;
};

export default function ClientsTable({ clients }: { clients: ClientRow[] }) {
  const router = useRouter();
  const [pendingId, setPendingId] = React.useState<string | null>(null);

  async function onDelete(id: string) {
    if (!confirm("Видалити цього клієнта? Це також може вплинути на пов'язані проєкти.")) return;
    
    try {
      setPendingId(id);
      await deleteClient(id);
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
        {clients.map((c) => (
          <div key={c.id} className="rounded-2xl border bg-card/50 p-4 shadow-sm backdrop-blur-sm">
            <div className="flex items-start justify-between">
              <div className="min-w-0 flex-1">
                <Link
                  href={`/dashboard/clients/${c.id}`}
                  className="block truncate text-lg font-bold hover:text-primary transition-colors"
                >
                  {c.name}
                </Link>
                <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-muted-foreground font-medium">
                  <span className="flex items-center gap-1">
                    Створено: {format(new Date(c.createdAt), "d MMM yyyy", { locale: uk })}
                  </span>
                </div>
              </div>
            </div>
            
            <div className="mt-4 grid grid-cols-2 gap-4 border-t border-border/50 pt-3">
                <div className="text-center p-2 rounded-xl bg-muted/30">
                    <div className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider mb-0.5">Активні</div>
                    <div className="font-bold">{c.activeProjects}</div>
                </div>
                <div className="text-center p-2 rounded-xl bg-muted/30">
                    <div className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider mb-0.5">Всього</div>
                    <div className="font-bold">{c.totalProjects}</div>
                </div>
            </div>

            <div className="mt-4 flex items-center justify-between border-t border-border/50 pt-3">
               <Link href={`/dashboard/clients/${c.id}`} className="text-xs font-bold text-primary flex items-center gap-1">
                  Відкрити <ChevronRight className="h-3 w-3" />
               </Link>

               <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 rounded-lg text-destructive hover:bg-destructive/10"
                    disabled={pendingId === c.id}
                    onClick={() => onDelete(c.id)}
                >
                    <Trash2 className="h-4 w-4" />
                </Button>
            </div>
          </div>
        ))}
        
        {clients.length === 0 && (
          <div className="py-20 text-center flex flex-col items-center gap-2">
            <User className="h-10 w-10 text-muted-foreground/30" />
            <div className="text-sm font-medium text-muted-foreground">Клієнтів не знайдено</div>
          </div>
        )}
      </div>

      {/* Desktop View: Table */}
      <div className="hidden flex-1 md:flex flex-col min-h-0 h-full overflow-hidden">
        <div className="flex-1 overflow-y-auto w-full relative min-h-0 scrollbar-hide rounded-2xl border border-border/50 bg-card/50 backdrop-blur-sm shadow-sm">
          <Table className="relative min-w-[800px]">
            <TableHeader className="relative z-30">
              <TableRow className="hover:bg-transparent border-b-0">
                <TableHead className="sticky top-0 z-30 font-bold text-[11px] uppercase tracking-wider pl-6 py-4 bg-background border-b border-border/50 shadow-[0_1px_0_0_rgba(0,0,0,0.1)]">Клієнт</TableHead>
                <TableHead className="sticky top-0 z-30 w-[160px] font-bold text-[11px] uppercase tracking-wider bg-background border-b border-border/50 shadow-[0_1px_0_0_rgba(0,0,0,0.1)] text-right">Активні проєкти</TableHead>
                <TableHead className="sticky top-0 z-30 w-[160px] font-bold text-[11px] uppercase tracking-wider bg-background border-b border-border/50 shadow-[0_1px_0_0_rgba(0,0,0,0.1)] text-right">Всього проєктів</TableHead>
                <TableHead className="sticky top-0 z-30 w-[180px] font-bold text-[11px] uppercase tracking-wider bg-background border-b border-border/50 shadow-[0_1px_0_0_rgba(0,0,0,0.1)]">Дата створення</TableHead>
                <TableHead className="sticky top-0 z-30 w-[80px] text-right pr-6 font-bold text-[11px] uppercase tracking-wider bg-background border-b border-border/50 shadow-[0_1px_0_0_rgba(0,0,0,0.1)]">Дії</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {clients.map((c) => (
                <TableRow 
                  key={c.id} 
                  className="group transition-colors hover:bg-primary/[0.02] border-b-border/40 cursor-pointer"
                  onClick={() => router.push(`/dashboard/clients/${c.id}`)}
                >
                  <TableCell className="font-bold pl-6">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-primary/5 flex items-center justify-center group-hover:bg-primary/10 transition-colors">
                        <User className="h-4 w-4 text-primary/70 group-hover:text-primary transition-colors" />
                      </div>
                      <span className="group-hover:text-primary transition-colors">
                        {c.name}
                      </span>
                    </div>
                  </TableCell>

                  <TableCell className="text-right">
                    <Badge variant="secondary" className="rounded-lg tabular-nums font-bold min-w-[40px] justify-center bg-emerald-500/5 text-emerald-600 border-emerald-500/10">
                        {c.activeProjects}
                    </Badge>
                  </TableCell>

                  <TableCell className="text-right">
                    <Badge variant="outline" className="rounded-lg tabular-nums font-bold min-w-[40px] justify-center text-muted-foreground/70">
                        {c.totalProjects}
                    </Badge>
                  </TableCell>

                  <TableCell className="text-xs text-muted-foreground font-medium tabular-nums">
                    {format(new Date(c.createdAt), "d MMM yyyy", { locale: uk })}
                  </TableCell>

                  <TableCell className="text-right pr-6">
                    <div 
                      className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 rounded-lg text-destructive hover:bg-destructive/10"
                          title="Видалити"
                          disabled={pendingId === c.id}
                          onClick={() => onDelete(c.id)}
                      >
                          <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}

              {clients.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="py-20 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <User className="h-10 w-10 text-muted-foreground/30" />
                      <div className="text-sm font-medium text-muted-foreground">
                        Клієнтів не знайдено.
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
