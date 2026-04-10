"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { stopActive } from "@/app/dashboard/time/actions";
import { Button } from "@/components/ui/button";
import { Briefcase, Coffee, Square } from "lucide-react";
import { cn } from "@/lib/utils";

type ActiveTimerDTO = {
  id: string;
  mode: "work" | "break";
  startedAt: Date;
  project?: { id: string; name: string } | null;
  task?: { id: string; title: string } | null;
  note?: string | null;
} | null;

function pad(n: number) {
  return String(n).padStart(2, "0");
}

function formatElapsed(ms: number) {
  const total = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  return `${pad(h)}:${pad(m)}:${pad(s)}`;
}

export default function ActiveTimerPill({ active }: { active: any }) {
  const router = useRouter();
  const [mounted, setMounted] = React.useState(false);
  const [now, setNow] = React.useState(() => Date.now());
  const [pending, setPending] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
    if (!active) return;
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [active]);

  if (!active) return null;

  const elapsed = mounted
    ? formatElapsed(now - new Date(active.startedAt).getTime())
    : "00:00:00";

  const isWork = active.mode === "work";

  async function onStop() {
    try {
      setPending(true);
      await stopActive();
      router.refresh();
    } finally {
      setPending(false);
    }
  }

  return (
    <div className={cn(
      "flex items-center gap-2 rounded-full border px-1.5 py-1 pr-2 transition-all shadow-sm",
      isWork ? "bg-primary/5 border-primary/20" : "bg-muted border-muted-foreground/20"
    )}>
      <div className={cn(
        "flex h-7 w-7 items-center justify-center rounded-full text-white",
        isWork ? "bg-primary animate-pulse" : "bg-muted-foreground"
      )}>
        {isWork ? <Briefcase className="h-3.5 w-3.5" /> : <Coffee className="h-3.5 w-3.5" />}
      </div>

      <div className="flex flex-col leading-tight min-w-[70px]">
        <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
          {isWork ? (active.project?.name || "Робота") : "Перерва"}
        </span>
        <span className="text-sm font-medium tabular-nums font-mono">
          {elapsed}
        </span>
      </div>

      <Button
        size="icon"
        variant="ghost"
        className="h-8 w-8 rounded-full hover:bg-destructive hover:text-destructive-foreground transition-colors"
        onClick={onStop}
        disabled={pending}
        title="Зупинити таймер"
      >
        <Square className="h-3.5 w-3.5 fill-current" />
      </Button>
    </div>
  );
}
