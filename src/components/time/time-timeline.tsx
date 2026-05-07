"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

type Entry = {
  id: string;
  type: "work" | "break";
  startAt: Date;
  endAt: Date | null;
};

type ActiveTimer = {
  mode: "work" | "break";
  startedAt: Date;
};

type Range = { startAt: Date; endAt: Date };

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

function minutesToHHMM(totalMin: number) {
  const m = clamp(Math.round(totalMin), 0, 24 * 60);
  const hh = Math.floor(m / 60);
  const mm = m % 60;
  return `${pad2(hh)}:${pad2(mm)}`;
}

function localDateFromDayISOAndHHMM(dateISO: string, hhmm: string) {
  const [y, m, d] = dateISO.split("-").map(Number);
  const [h, min] = hhmm.split(":").map(Number);
  return new Date(y, m - 1, d, h, min, 0);
}

function getPctFromPointer(clientX: number, el: HTMLDivElement) {
  const rect = el.getBoundingClientRect();
  const x = clamp(clientX - rect.left, 0, rect.width);
  return rect.width <= 0 ? 0 : x / rect.width;
}

export default function TimeTimeline({
  entries,
  activeTimer,
  dateISO,
  timezone, // kept for future tooltip math; not used now
  className,

  // selection actions like TMetric (Add work / Add break)
  onSelectWorkRangeAction,
  onSelectBreakRangeAction,

  // click segment -> edit dialog
  onEditEntryAction,
  onResizeEntryAction: _onResizeEntryAction,
  highlightedId,
}: {

  entries: Entry[];
  activeTimer: ActiveTimer | null;
  dateISO: string;
  timezone: string;
  className?: string;

  onSelectWorkRangeAction?: (range: Range) => void;
  onSelectBreakRangeAction?: (range: Range) => void;

  onEditEntryAction?: (entryId: string) => void;
  onResizeEntryAction?: (entryId: string, range: Range) => void;
  highlightedId?: string | null;
}) {
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => setMounted(true), []);

  // stable day window baseline: we need the UTC range that corresponds to 00:00..23:59 in the user's timezone
  const { dayStartMs, dayEndMs: _dayEndMs, rangeMs } = React.useMemo(() => {
    // We reuse the same logic as the server to find the UTC boundaries of the dayISO
    const [y, m, d] = dateISO.split("-").map(Number);
    
    const tz = timezone || "Europe/Kyiv";
    let start = new Date(Date.UTC(y, m - 1, d, 0, 0, 0));
    
    for (let i = 0; i < 2; i++) {
      const local = new Date(start.toLocaleString("en-US", { timeZone: tz }));
      const desired = new Date(y, m - 1, d, 0, 0, 0);
      const diff = local.getTime() - desired.getTime();
      start = new Date(start.getTime() - diff);
    }
    
    const startMs = start.getTime();
    const endMs = startMs + 24 * 3600 * 1000 - 1;
    
    return {
      dayStartMs: startMs,
      dayEndMs: endMs,
      rangeMs: endMs - startMs
    };
  }, [dateISO, timezone]);

  const segments = React.useMemo(() => {
    const list: Array<{
      id: string;
      type: "work" | "break";
      leftPct: number;
      widthPct: number;
      title: string;
    }> = [];

    for (const it of entries) {
      // ✅ entries are already hydrated to Date objects by TimePageClient
      const startMs = it.startAt.getTime();
      const endMs = it.endAt ? it.endAt.getTime() : startMs;
      
      if (!Number.isFinite(startMs) || !Number.isFinite(endMs)) continue;

      const left = clamp(((startMs - dayStartMs) / rangeMs) * 100, 0, 100);
      const right = clamp(((endMs - dayStartMs) / rangeMs) * 100, 0, 100);

      const width = clamp(right - left, 0, 100);
      if (width <= 0) continue;

      list.push({
        id: it.id,
        type: it.type,
        leftPct: Number(left.toFixed(4)),
        widthPct: Number(width.toFixed(4)),
        title: it.type === "break" ? "Перерва" : "Робота",
      });
    }

    return list;
  }, [entries, dayStartMs, rangeMs]);

  const activeSegment = React.useMemo(() => {
    if (!mounted) return null;
    if (!activeTimer) return null;

    const startMs = activeTimer.startedAt.getTime();
    if (!Number.isFinite(startMs)) return null;

    const nowMs = Date.now();

    const left = clamp(((startMs - dayStartMs) / rangeMs) * 100, 0, 100);
    const right = clamp(((nowMs - dayStartMs) / rangeMs) * 100, 0, 100);
    const width = clamp(right - left, 0, 100);

    if (width <= 0) return null;

    return {
      id: "active",
      type: activeTimer.mode,
      leftPct: Number(left.toFixed(4)),
      widthPct: Number(width.toFixed(4)),
      title: activeTimer.mode === "break" ? "Перерва (активно)" : "Робота (активно)",
    };
  }, [mounted, activeTimer, dateISO, dayStartMs, rangeMs]);

  const ticks = React.useMemo(() => Array.from({ length: 24 }, (_, i) => i), []);
  const mobileTicks = React.useMemo(() => [0, 3, 6, 9, 12, 15, 18, 21], []);

  // ===== Selection (drag) + popup =====
  const barRef = React.useRef<HTMLDivElement | null>(null);
  const hasSelectionActions = Boolean(onSelectWorkRangeAction || onSelectBreakRangeAction);

  // Selection state
  const [isSelecting, setIsSelecting] = React.useState(false);
  const [selStartMin, setSelStartMin] = React.useState<number | null>(null);
  const [selEndMin, setSelEndMin] = React.useState<number | null>(null);

  const [pendingRange, setPendingRange] = React.useState<{
    fromMin: number;
    toMin: number;
    leftPct: number;
    widthPct: number;
    anchorPct: number;
  } | null>(null);

  const selection = React.useMemo(() => {
    if (selStartMin == null || selEndMin == null) return null;
    const from = Math.min(selStartMin, selEndMin);
    const to = Math.max(selStartMin, selEndMin);
    if (to - from < 1) return null;

    const leftPct = (from / (24 * 60)) * 100;
    const widthPct = ((to - from) / (24 * 60)) * 100;

    return {
      fromMin: from,
      toMin: to,
      leftPct: Number(leftPct.toFixed(4)),
      widthPct: Number(widthPct.toFixed(4)),
    };
  }, [selStartMin, selEndMin]);

  // Selection restriction: max minute based on real-time
  const selectableMaxMinute = React.useMemo(() => {
    const now = new Date();
    const todayStartTime = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const viewedDayStartTime = dayStartMs; // this is already the start of dateISO in UTC ms

    if (viewedDayStartTime > todayStartTime + 86400000) return -1;
    if (viewedDayStartTime < todayStartTime) return 24 * 60;
    return now.getHours() * 60 + now.getMinutes();
  }, [dayStartMs]);

  function minuteFromClientX(clientX: number) {
    const el = barRef.current;
    if (!el) return 0;
    const pct = getPctFromPointer(clientX, el);
    const m = clamp(Math.round(pct * 24 * 60), 0, 24 * 60);

    // CAPPING: cannot select beyond present
    return clamp(m, 0, selectableMaxMinute);
  }

  const clearDrag = () => {
    setIsSelecting(false);
    setSelStartMin(null);
    setSelEndMin(null);
  };

  const clearPending = () => setPendingRange(null);

  const toRangeDates = (fromMin: number, toMin: number): Range | null => {
    if (toMin - fromMin < 1) return null;

    const startAt = localDateFromDayISOAndHHMM(dateISO, minutesToHHMM(fromMin));
    const endAt = localDateFromDayISOAndHHMM(dateISO, minutesToHHMM(toMin));
    if (isNaN(startAt.getTime()) || isNaN(endAt.getTime()) || endAt <= startAt) return null;

    return { startAt, endAt };
  };

  // Pointer-events + capture: щоб selection не “залипав”, якщо мишка вийшла за межі
  const onPointerDownBar = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!hasSelectionActions) return;
    if (e.button !== 0) return;
    if (selectableMaxMinute < 0) return; // Future day - no selection

    // close popup first
    if (pendingRange) clearPending();

    const el = barRef.current;
    if (!el) return;

    try {
      el.setPointerCapture(e.pointerId);
    } catch {
      // ignore
    }

    const m = minuteFromClientX(e.clientX);
    setIsSelecting(true);
    setSelStartMin(m);
    setSelEndMin(m);
  };

  const onPointerMoveBar = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isSelecting) return;
    const m = minuteFromClientX(e.clientX);
    setSelEndMin(m);
  };

  const finishSelection = (pointerId?: number) => {
    const el = barRef.current;
    if (el && pointerId != null) {
      try {
        el.releasePointerCapture(pointerId);
      } catch {
        // ignore
      }
    }

    if (!isSelecting) return;

    setIsSelecting(false);

    if (!selection) {
      clearDrag();
      return;
    }

    const r = toRangeDates(selection.fromMin, selection.toMin);
    if (!r) {
      clearDrag();
      return;
    }

    const anchorPct = clamp(selection.leftPct + selection.widthPct, 0, 100);

    setPendingRange({
      fromMin: selection.fromMin,
      toMin: selection.toMin,
      leftPct: selection.leftPct,
      widthPct: selection.widthPct,
      anchorPct: Number(anchorPct.toFixed(4)),
    });

    clearDrag();
  };

  const onPointerUpBar = (e: React.PointerEvent<HTMLDivElement>) => {
    finishSelection(e.pointerId);
  };

  const onPointerCancelBar = (e: React.PointerEvent<HTMLDivElement>) => {
    // cancel => просто скидаємо
    const el = barRef.current;
    if (el) {
      try {
        el.releasePointerCapture(e.pointerId);
      } catch { }
    }
    clearDrag();
  };

  const applyWork = () => {
    if (!pendingRange) return;
    const r = toRangeDates(pendingRange.fromMin, pendingRange.toMin);
    if (!r) return clearPending();
    onSelectWorkRangeAction?.(r);
    clearPending();
  };

  const applyBreak = () => {
    if (!pendingRange) return;
    const r = toRangeDates(pendingRange.fromMin, pendingRange.toMin);
    if (!r) return clearPending();
    onSelectBreakRangeAction?.(r);
    clearPending();
  };

  const canEditWork = Boolean(onEditEntryAction);

  return (
    <div className={cn("w-full", className)}>
      <div
        ref={barRef}
        className={cn(
          "relative h-10 w-full overflow-hidden rounded-md border bg-muted/20",
          hasSelectionActions && "cursor-crosshair select-none"
        )}
        onPointerDown={onPointerDownBar}
        onPointerMove={onPointerMoveBar}
        onPointerUp={onPointerUpBar}
        onPointerCancel={onPointerCancelBar}
      >
        {/* pending selection highlight */}
        {pendingRange ? (
          <>
            <div
              className="absolute top-0 h-full rounded-sm bg-foreground/10 ring-1 ring-foreground/20"
              style={{ left: `${pendingRange.leftPct}%`, width: `${pendingRange.widthPct}%` }}
              aria-hidden="true"
            />

            {/* action popup */}
            <div
              className="absolute top-1/2 z-10 -translate-y-1/2"
              style={{ left: `calc(${pendingRange.anchorPct}% - 8px)` }}
              onPointerDown={(e) => {
                e.stopPropagation();
              }}
            >
              <div className="flex items-center gap-1 rounded-md border bg-background p-1 shadow-none">
                {onSelectWorkRangeAction ? (
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    className="h-7 px-2 text-xs"
                    onClick={(e) => {
                      e.stopPropagation();
                      applyWork();
                    }}
                  >
                    + Робота
                  </Button>
                ) : null}

                {onSelectBreakRangeAction ? (
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    className="h-7 px-2 text-xs"
                    onClick={(e) => {
                      e.stopPropagation();
                      applyBreak();
                    }}
                  >
                    + Перерва
                  </Button>
                ) : null}


                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  className="h-7 w-7 text-muted-foreground"
                  onClick={(e) => {
                    e.stopPropagation();
                    clearPending();
                  }}
                  aria-label="Закрити"
                >
                  ✕
                </Button>
              </div>
            </div>
          </>
        ) : null}

        {/* live selection highlight while dragging */}
        {selection && isSelecting ? (
          <div
            className="absolute top-0 h-full rounded-sm bg-foreground/10 ring-1 ring-foreground/20"
            style={{ left: `${selection.leftPct}%`, width: `${selection.widthPct}%` }}
            aria-hidden="true"
          />
        ) : null}

        {/* entries */}
        {segments.map((s) => {
          const isWork = s.type === "work";
          const isHighlighted = s.id === highlightedId;

          return (
            <div
              key={s.id}
              title={s.title}
              role={isWork ? "button" : undefined}
              tabIndex={isWork ? 0 : undefined}
              aria-label={s.title}
              className={cn(
                "absolute top-0 h-full rounded-sm transition-all shadow-none",
                s.type === "break" ? "bg-muted" : "bg-primary",
                canEditWork && isWork ? "cursor-pointer hover:ring-2 hover:ring-primary/50" : "",
                isHighlighted && "bg-primary/80 ring-2 ring-primary"
              )}
              style={{ left: `${s.leftPct}%`, width: `${s.widthPct}%` }}
              onPointerDown={(e) => {
                if (canEditWork && isWork) e.stopPropagation();
              }}
              onClick={(e) => {
                if (!canEditWork) return;
                if (!isWork) return;
                e.stopPropagation();
                onEditEntryAction?.(s.id);
              }}
              onKeyDown={(e) => {
                if (!canEditWork || !isWork) return;
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  onEditEntryAction?.(s.id);
                }
              }}
            />
          );
        })}

        {/* active overlay */}
        {activeSegment ? (
          <div
            key={activeSegment.id}
            title={activeSegment.title}
            className={cn(
              "absolute top-0 h-full rounded-sm ring-2 ring-primary/40 animate-pulse",
              activeSegment.type === "break" ? "bg-muted" : "bg-primary/60"
            )}
            style={{ left: `${activeSegment.leftPct}%`, width: `${activeSegment.widthPct}%` }}
          />
        ) : null}

        {/* Future restriction overlay (visual only) */}
        {selectableMaxMinute < 24 * 60 && (
          <div
            className="absolute top-0 right-0 h-full bg-background/20 pointer-events-none"
            style={{
              left: `${Math.max(0, (selectableMaxMinute / (24 * 60)) * 100)}%`,
              width: `${100 - (selectableMaxMinute / (24 * 60)) * 100}%`
            }}
          />
        )}
      </div>

      <div className="mt-2 hidden sm:flex items-center justify-between text-xs text-muted-foreground">
        {ticks.map((h) => (
          <div key={h} className="tabular-nums">
            {String(h).padStart(2, "0")}:00
          </div>
        ))}
      </div>
      <div className="mt-2 flex sm:hidden items-center justify-between text-[10px] text-muted-foreground">
        {mobileTicks.map((h) => (
          <div key={h} className="tabular-nums">
            {String(h).padStart(2, "0")}:00
          </div>
        ))}
      </div>
    </div>
  );
}
