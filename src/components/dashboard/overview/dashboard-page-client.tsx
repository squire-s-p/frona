"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Edit3, Check, X, Plus } from "lucide-react";
import { DashboardGrid } from "./dashboard-grid";

interface DashboardPageClientProps {
  initialLayout: any;
  data: any;
}

export function DashboardPageClient({ initialLayout, data }: DashboardPageClientProps) {
  const [isEditing, setIsEditing] = useState(false);

  return (
    <div className="flex-1 overflow-y-auto space-y-5 pb-10 scrollbar-hide">
      <div className="flex justify-between items-center px-1">
        <div>
          <div className="text-sm text-muted-foreground font-medium mb-1 tracking-tight">Привіт! Гляньмо на твій прогрес</div>
          <h1 className="text-3xl font-bold tracking-tight leading-none">Огляд панелі</h1>
        </div>
        
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
          </div>
        )}
      </div>

      <DashboardGrid 
        initialLayout={initialLayout} 
        data={data} 
        isEditing={isEditing} 
        setIsEditing={setIsEditing} 
      />
    </div>
  );
}
