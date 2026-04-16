"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Edit3, CalendarDays, Clock3, CheckCircle2 } from "lucide-react";
import { DashboardGrid } from "./dashboard-grid";

interface DashboardPageClientProps {
  initialLayout: any;
  data: any;
}

export function DashboardPageClient({ initialLayout, data }: DashboardPageClientProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const todayHours = Math.round((((data?.todayDuration ?? 0) as number) / 3600) * 10) / 10;
  const completionRate = (data?.taskCompletionRate ?? 0) as number;
  const todayLabel = new Intl.DateTimeFormat("uk-UA", {
    weekday: "long",
    day: "2-digit",
    month: "long",
  }).format(new Date());

  return (
    <div className="flex-1 overflow-y-auto space-y-5 pb-10 scrollbar-hide">
      <div className="flex flex-col gap-4 px-1 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-3">
          <div>
            <div className="text-sm text-muted-foreground font-medium mb-1 tracking-tight">Привіт! Гляньмо на твій прогрес</div>
            <h1 className="text-3xl font-bold tracking-tight leading-none">Огляд панелі</h1>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="inline-flex items-center gap-1.5 rounded-full border bg-background px-3 py-1.5 text-muted-foreground">
              <CalendarDays className="h-3.5 w-3.5" />
              {todayLabel}
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border bg-background px-3 py-1.5">
              <Clock3 className="h-3.5 w-3.5 text-muted-foreground" />
              Сьогодні: <strong className="text-foreground">{todayHours}г</strong>
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border bg-background px-3 py-1.5">
              <CheckCircle2 className="h-3.5 w-3.5 text-muted-foreground" />
              Виконання: <strong className="text-foreground">{completionRate}%</strong>
            </span>
          </div>
        </div>

        <div className="shrink-0">
          {!isEditing ? (
            <Button
              onClick={() => setIsEditing(true)}
              variant="outline"
              size="sm"
              className="gap-2 rounded-xl h-9 px-4 border-foreground/10 hover:border-foreground/20 hover:bg-foreground/[0.03] transition-all font-medium"
            >
              <Edit3 className="h-4 w-4" />
              Налаштувати панель
            </Button>
          ) : (
            <div className="flex items-center gap-2">
               <span className="text-xs font-semibold bg-foreground/5 px-3 py-1.5 rounded-lg border border-foreground/5 mr-1 hidden md:inline-block">
                 Режим редагування
               </span>
               {hasUnsavedChanges && (
                 <span className="text-[10px] font-semibold uppercase tracking-wide text-amber-700 bg-amber-100 border border-amber-200 px-2 py-1 rounded-full dark:text-amber-300 dark:bg-amber-500/10 dark:border-amber-500/30">
                   Незбережено
                 </span>
               )}
            </div>
          )}
        </div>
      </div>

      <DashboardGrid 
        initialLayout={initialLayout} 
        data={data} 
        isEditing={isEditing} 
        setIsEditing={setIsEditing} 
        onDirtyChange={setHasUnsavedChanges}
      />
    </div>
  );
}
