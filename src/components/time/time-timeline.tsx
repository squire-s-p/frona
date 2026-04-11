"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

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
  onResizeEntryAction,
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
  const { dayStart, dayEnd, rangeMs } = React.useMemo(() => {
    // We use a simplified approach for the timeline:
    // entries are UTC. We need to know where 00:00 of dateISO is in UTC.
    // We can use a trick: parse dateISO as a local date, then convert to UTC.
    
    // This is basically what we need for the UI to align.
    const [y, m, d] = dateISO.split("-").map(Number);
    const localStart = new Date(y, m - 1, d, 0, 0, 0);
    const localEnd = new Date(y, m - 1, d, 23, 59, 59, 999);
    
    return {
      dayStart: localStart,
      dayEnd: localEnd,
      rangeMs: localEnd.getTime() - localStart.getTime()
    };
  }, [dateISO]);

  const segments = React.useMemo(() => {
    const list: Array<{
      id: string;
      type: "work" | "break";
      leftPct: number;
      widthPct: number;
      title: string;
    }> = [];

    const startBoundary = dayStart.getTime();

    for (const it of entries) {
      // ✅ entries are already hydrated to Date objects by TimePageClient
      const startMs = it.startAt.getTime();
      const endMs = it.endAt ? it.endAt.getTime() : startMs;
      
      if (!Number.isFinite(startMs) || !Number.isFinite(endMs)) continue;

      const left = clamp(((startMs - startBoundary) / rangeMs) * 100, 0, 100);
      const right = clamp(((endMs - startBoundary) / rangeMs) * 100, 0, 100);

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
  }, [entries, dayStart, rangeMs]);

  const activeSegment = React.useMemo(() => {
    if (!mounted) return null;
    if (!activeTimer) return null;

    const now = new Date();
    const todayISO = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
    if (todayISO !== dateISO) return null;

    const startMs = activeTimer.startedAt.getTime();
    if (!Number.isFinite(startMs)) return null;

    const nowMs = Date.now();
    const startBoundary = dayStart.getTime();

    const left = clamp(((startMs - startBoundary) / rangeMs) * 100, 0, 100);
    const right = clamp(((nowMs - startBoundary) / rangeMs) * 100, 0, 100);
    const width = clamp(right - left, 0, 100);

    if (width <= 0) return null;

    return {
      id: "active",
      type: activeTimer.mode,
      leftPct: Number(left.toFixed(4)),
      widthPct: Number(width.toFixed(4)),
      title: activeTimer.mode === "break" ? "Перерва (активно)" : "Робота (активно)",
    };
  }, [mounted, activeTimer, dateISO, dayStart, rangeMs]);

  const ticks = React.useMemo(() => Array.from({ length: 24 }, (_, i) => i), []);

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
    const viewedDayStartTime = dayStart.getTime();

    if (viewedDayStartTime > todayStartTime) return -1;
    if (viewedDayStartTime < todayStartTime) return 24 * 60;
    return now.getHours() * 60 + now.getMinutes();
  }, [dayStart]);

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
              <div className="flex items-center gap-1 rounded-md border bg-background p-1 shadow-sm">
                {onSelectWorkRangeAction ? (
                  <button
                    type="button"
                    className="rounded px-2 py-1 text-xs hover:bg-muted"
                    onClick={(e) => {
                      e.stopPropagation();
                      applyWork();
                    }}
                  >
                    + Робота
                  </button>
                ) : null}

                {onSelectBreakRangeAction ? (
                  <button
                    type="button"
                    className="rounded px-2 py-1 text-xs hover:bg-muted"
                    onClick={(e) => {
                      e.stopPropagation();
                      applyBreak();
                    }}
                  >
                    + Перерва
                  </button>
                ) : null}


                <button
                  type="button"
                  className="rounded px-2 py-1 text-xs text-muted-foreground hover:bg-muted"
                  onClick={(e) => {
                    e.stopPropagation();
                    clearPending();
                  }}
                  aria-label="Закрити"
                >
                  ✕
                </button>
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
              className={cn(
                "absolute top-0 h-full rounded-sm transition-all shadow-sm",
                s.type === "break" ? "bg-muted" : "bg-primary",
                canEditWork && isWork ? "cursor-pointer hover:ring-2 hover:ring-primary/50" : "",
                isHighlighted && "bg-primary/80 ring-2 ring-primary"
              )}
              style={{ left: `${s.leftPct}%`, width: `${s.widthPct}%` }}
              onPointerDown={(e) => {
                // clicking segment should NOT start selection drag
                if (canEditWork && isWork) e.stopPropagation();
              }}
              onClick={(e) => {
                if (!canEditWork) return;
                if (!isWork) return;
                e.stopPropagation();
                onEditEntryAction?.(s.id);
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

      <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
        {ticks.map((h) => (
          <div key={h} className="tabular-nums">
            {String(h).padStart(2, "0")}:00
          </div>
        ))}
      </div>
    </div>
  );
}
