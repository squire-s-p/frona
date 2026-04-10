"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { startTimer, stopTimer } from "@/app/dashboard/time/actions";
import { Button } from "@/components/ui/button";
import { Play, Square, Timer } from "lucide-react";
import { cn } from "@/lib/utils";

type ActiveTimerDTO = any;

function pad(n: number) {
  return String(n).padStart(2, "0");
}

function formatElapsed(ms: number) {
  const total = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  return { h: pad(h), m: pad(m), s: pad(s) };
}

export default function ProjectTimer({
  projectId,
  initialActive,
}: {
  projectId: string;
  initialActive: ActiveTimerDTO;
}) {
  const router = useRouter();

  const [active, setActive] = React.useState<ActiveTimerDTO>(initialActive);
  const [now, setNow] = React.useState(() => Date.now());
  const [pending, setPending] = React.useState(false);

  React.useEffect(() => {
    setActive(initialActive);
  }, [initialActive]);

  React.useEffect(() => {
    if (!active) return;
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [active]);

  const isThisProject = active?.projectId === projectId;

  const clock = React.useMemo(() => {
    if (!active) return { h: "00", m: "00", s: "00" };
    // API uses 'startedAt' for active timers
    const start = new Date(active.startedAt || active.startAt).getTime();
    return formatElapsed(now - start);
  }, [active, now]);

  async function onStart() {
    try {
      setPending(true);
      const res = await startTimer(projectId);
      setActive(res);
      router.refresh();
    } finally {
      setPending(false);
    }
  }

  async function onStop() {
    if (!active) return;
    try {
      setPending(true);
      await stopTimer(active.id);
      setActive(null);
      router.refresh();
    } finally {
      setPending(false);
    }
  }

  const isActive = active && isThisProject;

  return (
    <div className={cn(
      "relative flex items-center justify-between gap-6 rounded-2xl border p-6 transition-all duration-500 overflow-hidden shadow-sm",
      isActive 
        ? "bg-primary/[0.05] border-primary/20 ring-1 ring-primary/10" 
        : "bg-card border-border/50"
    )}>
      {/* Background Decor */}
      {isActive && (
        <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-primary/5 blur-3xl animate-pulse" />
      )}

      <div className="flex items-center gap-5">
        <div className={cn(
          "flex h-12 w-12 items-center justify-center rounded-xl transition-colors duration-500",
          isActive ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground"
        )}>
          <Timer className={cn("h-6 w-6", isActive && "animate-spin-[10s]")} />
        </div>

        <div>
          <div className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest mb-1">
            {isActive ? "Проєкт у роботі" : "Таймер готовий"}
          </div>
          
          <div className="flex items-baseline gap-1.5 font-mono text-3xl font-bold tracking-tight text-foreground/90">
             <span className={cn(isActive && "text-primary")}>{clock.h}</span>
             <span className="text-muted-foreground animate-pulse">:</span>
             <span className={cn(isActive && "text-primary")}>{clock.m}</span>
             <span className="text-muted-foreground animate-pulse">:</span>
             <span className={cn(isActive && "text-primary")}>{clock.s}</span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3">
         {active && !isThisProject && (
           <div className="text-[10px] text-muted-foreground bg-muted/50 px-2 py-1 rounded-lg">
             Інший проєкт...
           </div>
         )}
         
         {active ? (
            <Button
              variant={isThisProject ? "destructive" : "secondary"}
              size="lg"
              onClick={onStop}
              disabled={pending || !isThisProject}
              className="h-12 rounded-xl px-6 font-bold shadow-lg shadow-destructive/10"
            >
              <Square className="h-4 w-4 mr-2 fill-current" />
              Stop
            </Button>
         ) : (
            <Button 
              size="lg"
              onClick={onStart} 
              disabled={pending} 
              className="h-12 rounded-xl px-8 font-bold shadow-lg shadow-primary/20 bg-primary hover:bg-primary/90 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <Play className="h-4 w-4 mr-2 fill-current" />
              Start
            </Button>
         )}
      </div>
    </div>
  );
}
