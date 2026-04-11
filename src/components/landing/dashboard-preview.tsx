"use client";

import { useState, useEffect } from "react";
import { Timer, CreditCard, BarChart3, Target, CheckCircle2 } from "lucide-react";

export function DashboardPreview() {
  const [time, setTime] = useState("01:24:45");
  const [pulse, setPulse] = useState(false);

  // Live timer effect
  useEffect(() => {
    const interval = setInterval(() => {
      const parts = time.split(":").map(Number);
      let h = parts[0], m = parts[1], s = parts[2];
      
      s++;
      if (s >= 60) { s = 0; m++; }
      if (m >= 60) { m = 0; h++; }
      
      const newTime = [h, m, s].map(v => v.toString().padStart(2, "0")).join(":");
      setTime(newTime);
      setPulse(true);
      setTimeout(() => setPulse(false), 300);
    }, 1000);
    return () => clearInterval(interval);
  }, [time]);

  return (
    <div className="relative overflow-hidden rounded-xl border border-border/50 bg-card/50 shadow-2xl backdrop-blur-sm p-4 md:p-8 transition-all hover:border-primary/30">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Timer Card */}
          <div className="group rounded-lg border border-border bg-background p-4 shadow-sm transition-all hover:shadow-md">
            <div className="flex items-center gap-2 mb-4">
              <Timer className={`size-4 ${pulse ? 'text-primary scale-110' : 'text-primary/60'} transition-all`} />
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Таймер</span>
            </div>
            <div className="text-3xl font-mono font-bold tracking-tight">{time}</div>
            <div className="mt-2 text-[10px] text-muted-foreground font-medium flex items-center gap-2">
              <div className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Проект: Створення бренду
            </div>
          </div>

          {/* Finance Card */}
          <div className="rounded-lg border border-border bg-background p-4 shadow-sm transition-all hover:shadow-md hover:bg-muted/10 cursor-default">
            <div className="flex items-center gap-2 mb-4">
              <CreditCard className="size-4 text-emerald-500" />
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Фінанси</span>
            </div>
            <div className="text-2xl font-bold">₴12,450.00</div>
            <div className="mt-2 text-[10px] text-emerald-500 font-medium flex items-center gap-1">
              <span>+₴2,300 сьогодні</span>
            </div>
          </div>

          {/* Stats Card */}
          <div className="rounded-lg border border-border bg-background p-4 shadow-sm transition-all hover:shadow-md">
            <div className="flex items-center gap-2 mb-4">
              <BarChart3 className="size-4 text-indigo-500" />
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Ефективність</span>
            </div>
            <div className="flex items-end gap-1.5 h-10">
              {[40, 70, 45, 90, 65, 80, 50].map((h, i) => (
                <div 
                  key={i} 
                  className="flex-1 bg-indigo-500/20 rounded-t-sm transition-all duration-500 hover:bg-indigo-500" 
                  style={{ height: `${h}%` }} 
                />
              ))}
            </div>
          </div>

        </div>
    </div>
  );
}
