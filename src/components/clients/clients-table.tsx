"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { uk } from "date-fns/locale";
import { User, ChevronRight, Calendar } from "lucide-react";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { DeleteClientDialog } from "./delete-client-dialog";

type ClientRow = {
  id: string;
  name: string;
  activeProjects: number;
  totalProjects: number;
  createdAt: string;
};

export default function ClientsTable({ clients }: { clients: ClientRow[] }) {
  const router = useRouter();

  return (
    <div className="flex-1 min-h-0 flex flex-col h-full overflow-hidden">
      {/* Mobile View: Cards */}
      <div className="grid grid-cols-1 gap-4 md:hidden p-0">
        {clients.map((c) => (
          <div key={c.id} className="rounded-2xl border border-border/60 bg-neutral-100 dark:bg-neutral-900 p-4 shadow-none transition-all hover:border-primary/30">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <div className="w-9 h-9 rounded-xl bg-primary/5 border border-primary/10 flex items-center justify-center shrink-0">
                  <User className="h-4.5 w-4.5 text-primary/70" />
                </div>
                <div className="min-w-0 flex-1">
                  <Link
                    href={`/dashboard/clients/${c.id}`}
                    className="block truncate text-lg font-bold hover:text-primary transition-colors"
                  >
                    {c.name}
                  </Link>
                  <div className="mt-0.5 flex items-center gap-1.5 text-[11px] text-muted-foreground font-medium">
                    <Calendar className="h-3 w-3" />
                    {format(new Date(c.createdAt), "d MMM yyyy", { locale: uk })}
                  </div>
                </div>
              </div>
            </div>
            
            <div className="mt-4 grid grid-cols-2 gap-4 border-t border-border/50 pt-3">
                <div className="space-y-1">
                    <div className="text-[10px] uppercase font-bold text-muted-foreground/50 tracking-wider">Активні</div>
                    <div className="text-sm font-bold text-emerald-600">{c.activeProjects} проєктів</div>
                </div>
                <div className="space-y-1 text-right">
                    <div className="text-[10px] uppercase font-bold text-muted-foreground/50 tracking-wider">Всього</div>
                    <div className="text-sm font-bold text-foreground">{c.totalProjects} проєктів</div>
                </div>
            </div>

            <div className="mt-4 flex items-center justify-between border-t border-border/50 pt-3">
               <Link href={`/dashboard/clients/${c.id}`} className="text-xs font-bold text-primary flex items-center gap-1 hover:underline underline-offset-4">
                  Відкрити <ChevronRight className="h-3 w-3" />
               </Link>

               <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                 <DeleteClientDialog 
                    clientId={c.id} 
                    clientName={c.name} 
                    onDeleted={() => router.refresh()} 
                 />
               </div>
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
      <div className="hidden md:block">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent border-b-border/50 border-t-0">
              <TableHead className="pl-6 h-12 font-bold text-[10px] tracking-tight text-muted-foreground/60">
                Клієнт
              </TableHead>
              <TableHead className="h-12 font-bold text-[10px] tracking-tight text-muted-foreground/60 text-right">
                Активні проєкти
              </TableHead>
              <TableHead className="h-12 font-bold text-[10px] tracking-tight text-muted-foreground/60 text-right">
                Всього проєктів
              </TableHead>
              <TableHead className="h-12 font-bold text-[10px] tracking-tight text-muted-foreground/60">
                Дата створення
              </TableHead>
              <TableHead className="pr-6 h-12 text-right font-bold text-[10px] tracking-tight text-muted-foreground/60">
                Дії
              </TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {clients.map((c) => (
              <TableRow 
                key={c.id} 
                className="group border-b-border/30 hover:bg-white/[0.02] cursor-pointer transition-colors"
                onClick={() => router.push(`/dashboard/clients/${c.id}`)}
              >
                <TableCell className="pl-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/5 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-300">
                      <User className="h-4.5 w-4.5" />
                    </div>
                    <span className="text-sm font-bold group-hover:text-primary transition-colors">
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

                <TableCell className="text-xs text-muted-foreground/70 font-medium tabular-nums">
                  {format(new Date(c.createdAt), "d MMMM yyyy", { locale: uk })}
                </TableCell>

                <TableCell className="text-right pr-6">
                  <div 
                    className="flex justify-end gap-1 items-center transition-opacity"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <DeleteClientDialog 
                       clientId={c.id} 
                       clientName={c.name} 
                       onDeleted={() => router.refresh()} 
                    />
                    <div className="h-8 w-8 rounded-lg flex items-center justify-center text-muted-foreground/30 group-hover:text-primary transition-colors">
                      <ChevronRight className="h-4 w-4" />
                    </div>
                  </div>
                </TableCell>
              </TableRow>
            ))}

            {clients.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="h-64 text-center">
                  <div className="flex flex-col items-center justify-center gap-3 opacity-30">
                    <User className="h-12 w-12" />
                    <p className="text-sm font-medium tracking-tight">Клієнтів не знайдено</p>
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
