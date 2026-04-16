"use client";

import * as React from "react";
import {
  addDays,
  addMonths,
  addWeeks,
  addYears,
  endOfDay,
  endOfMonth,
  endOfWeek,
  endOfYear,
  format,
  startOfDay,
  startOfMonth,
  startOfWeek,
  startOfYear,
  isSameDay,
  setHours,
  setMinutes,
} from "date-fns";
import { uk } from "date-fns/locale";
import { CalendarIcon, ExternalLink, Trash2 } from "lucide-react";

import {
  getCalendarEvents,
  listCalendars,
  createCalendarEvent,
  updateCalendarEvent,
  deleteCalendarEvent,
  type CalendarEvent,
  type CalendarListItem,
} from "@/app/dashboard/calendar/actions";

import { Button, buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { TimePicker } from "@/components/ui/time-picker";

import { cn } from "@/lib/utils";

type ViewMode = "day" | "week" | "month" | "year";

function rangeFor(mode: ViewMode, anchor: Date) {
  if (mode === "day") return { start: startOfDay(anchor), end: endOfDay(anchor) };
  if (mode === "week")
    return {
      start: startOfWeek(anchor, { weekStartsOn: 1 }),
      end: endOfWeek(anchor, { weekStartsOn: 1 }),
    };
  if (mode === "month")
    return { start: startOfMonth(anchor), end: endOfMonth(anchor) };
  return { start: startOfYear(anchor), end: endOfYear(anchor) };
}

function titleFor(mode: ViewMode, anchor: Date) {
  if (mode === "day") return format(anchor, "d MMMM yyyy", { locale: uk });
  if (mode === "week")
    return `Тиждень • ${format(
      startOfWeek(anchor, { weekStartsOn: 1 }),
      "d MMM",
      { locale: uk }
    )} – ${format(endOfWeek(anchor, { weekStartsOn: 1 }), "d MMM yyyy", { locale: uk })}`;
  if (mode === "month") return format(anchor, "MMMM yyyy", { locale: uk });
  return format(anchor, "yyyy", { locale: uk });
}

function moveAnchor(mode: ViewMode, anchor: Date, dir: -1 | 1) {
  if (mode === "day") return addDays(anchor, dir);
  if (mode === "week") return addWeeks(anchor, dir);
  if (mode === "month") return addMonths(anchor, dir);
  return addYears(anchor, dir);
}

function toLocalDate(iso: string) {
  return new Date(iso);
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function overlapsRange(e: CalendarEvent, start: Date, end: Date) {
  const s = toLocalDate(e.start).getTime();
  const en = toLocalDate(e.end).getTime();
  return s <= end.getTime() && en >= start.getTime();
}

function dayStartMs(day: Date) {
  return startOfDay(day).getTime();
}
function dayEndMs(day: Date) {
  return endOfDay(day).getTime();
}

type Positioned = {
  event: CalendarEvent;
  top: number;
  height: number;
  col: number;
  cols: number;
};

function isAllDayOrMultiDay(e: CalendarEvent) {
  if (e.allDay) return true;
  const s = toLocalDate(e.start);
  const en = toLocalDate(e.end);
  return !isSameDay(s, en);
}

function layoutDayTimedEvents(day: Date, events: CalendarEvent[], hourPx = 48) {
  const startMs = dayStartMs(day);
  const endMs = dayEndMs(day);

  const timed = events
    .filter((e: any) => !isAllDayOrMultiDay(e))
    .filter((e: any) => overlapsRange(e, startOfDay(day), endOfDay(day)))
    .map((e: any) => {
      const s = clamp(toLocalDate(e.start).getTime(), startMs, endMs);
      const en = clamp(toLocalDate(e.end).getTime(), startMs, endMs);
      return { e, s, en };
    })
    .sort((a: any, b: any) => a.s - b.s);

  const active: Array<{ end: number; col: number }> = [];
  const placed: Array<{ e: CalendarEvent; s: number; en: number; col: number }> =
    [];

  for (const item of timed) {
    for (let i = active.length - 1; i >= 0; i--) {
      if (active[i]!.end <= item.s) active.splice(i, 1);
    }

    const used = new Set(active.map((a: any) => a.col));
    let col = 0;
    while (used.has(col)) col++;

    active.push({ end: item.en, col });
    placed.push({ e: item.e, s: item.s, en: item.en, col });
  }

  const positioned: Positioned[] = placed.map((p: any) => {
    let cols = 1;
    for (const q of placed) {
      const overlaps = !(q.en <= p.s || q.s >= p.en);
      if (overlaps) cols = Math.max(cols, q.col + 1);
    }

    const minutesFromStart = (p.s - startMs) / 60000;
    const minutesDuration = Math.max(15, (p.en - p.s) / 60000);

    const top = (minutesFromStart / 60) * hourPx;
    const height = (minutesDuration / 60) * hourPx;

    return { event: p.e, top, height, col: p.col, cols };
  });

  return positioned;
}

type DraftEvent = {
  id?: string;
  title: string;
  description: string;
  location: string;
  allDay: boolean;
  start: Date;
  end: Date;
};

function toInputDateTimeLocal(d: Date) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
    d.getHours()
  )}:${pad(d.getMinutes())}`;
}

function fromInputDateTimeLocal(v: string) {
  // "YYYY-MM-DDTHH:mm" => local Date
  return new Date(v);
}

export default function CalendarClient() {
  const [mode, setMode] = React.useState<ViewMode>("week");
  const [anchor, setAnchor] = React.useState<Date>(new Date());

  const [calendarId, setCalendarId] = React.useState<string>("primary");
  const [calendars, setCalendars] = React.useState<CalendarListItem[]>([]);

  const [events, setEvents] = React.useState<CalendarEvent[]>([]);
  const [timeZone, setTimeZone] = React.useState<string>("Europe/Kyiv");

  const [error, setError] = React.useState<string | null>(null);
  const [loading, startTransition] = React.useTransition();

  const { start, end } = React.useMemo(() => rangeFor(mode, anchor), [mode, anchor]);

  // create dialog state
  const [createOpen, setCreateOpen] = React.useState(false);
  const [createErr, setCreateErr] = React.useState<string | null>(null);
  const [draft, setDraft] = React.useState<DraftEvent | null>(null);

  // view event state
  const [selectedEvent, setSelectedEvent] = React.useState<CalendarEvent | null>(null);

  React.useEffect(() => {
    let alive = true;
    startTransition(async () => {
      try {
        const res = await listCalendars();
        if (!alive) return;
        setCalendars(res.calendars);

        const primary = res.calendars.find((c: any) => c.primary);
        if (primary) setCalendarId((primary as any).id);
      } catch (e: any) {
        if (!alive) return;
        setError(e?.message ?? "Не вдалося завантажити список календарів");
      }
    });
    return () => {
      alive = false;
    };
  }, []);

  const loadEvents = React.useCallback(async () => {
    setError(null);
    try {
      const res = await getCalendarEvents({
        timeMinIso: start.toISOString(),
        timeMaxIso: end.toISOString(),
        calendarId,
      });
      setEvents(res.events);
      setTimeZone(res.timeZone);
    } catch (e: any) {
      setError(e?.message ?? "Не вдалося завантажити події");
    }
  }, [start, end, calendarId]);

  React.useEffect(() => {
    startTransition(() => loadEvents());

    const intervalId = setInterval(() => {
      startTransition(() => loadEvents());
    }, 60000);

    return () => clearInterval(intervalId);
  }, [loadEvents, startTransition]);

  function openCreateAt(dt: Date) {
    const startDt = dt;
    const endDt = addMinutesSafe(startDt, 60);

    setDraft({
      title: "",
      description: "",
      location: "",
      allDay: false,
      start: startDt,
      end: endDt,
    });
    setCreateErr(null);
    setCreateOpen(true);
  }

  async function submitCreate() {
    if (!draft) return;

    setCreateErr(null);

    const title = draft.title.trim();
    if (!title) {
      setCreateErr("Вкажи назву події.");
      return;
    }

    try {
      if (draft.id) {
        // Edit existing
        await updateCalendarEvent({
          calendarId,
          eventId: draft.id,
          title,
          description: draft.description.trim() || undefined,
          location: draft.location.trim() || undefined,
          allDay: draft.allDay,
          startIso: draft.start.toISOString(),
          endIso: draft.end.toISOString(),
        });
      } else {
        // Create new
        await createCalendarEvent({
          calendarId,
          title,
          description: draft.description.trim() || undefined,
          location: draft.location.trim() || undefined,
          allDay: draft.allDay,
          startIso: draft.start.toISOString(),
          endIso: draft.end.toISOString(),
        });
      }

      setCreateOpen(false);
      setDraft(null);
      await loadEvents();
    } catch (e: any) {
      setCreateErr(e?.message ?? "Не вдалося зберегти подію");
    }
  }

  async function handleDeleteEvent(eventId: string) {
    try {
      await deleteCalendarEvent({ calendarId, eventId });
      setSelectedEvent(null);
      await loadEvents();
    } catch(e: any) {
      alert("Не вдалося видалити: " + (e?.message || ""));
    }
  }

  function openEditEvent(e: CalendarEvent) {
    setSelectedEvent(null);
    setDraft({
      id: e.id,
      title: e.title.replace(/^🗓 /, ""), // Remove task emoji if it's a task. (Note: Tasks API editing will fail gracefully until fully supported)
      description: "",
      location: "",
      allDay: e.allDay,
      start: new Date(e.start),
      end: new Date(e.end),
    });
    setCreateErr(null);
    setCreateOpen(true);
  }

  return (
    <div className="flex-1 flex flex-col min-h-0 space-y-4 h-full">
      <Card className="shrink-0 rounded-2xl p-3 md:p-4 shadow-sm border-border bg-card">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-wrap items-center gap-2">
            <Button onClick={() => openCreateAt(new Date())}>
              + Створити
            </Button>
            <Button variant="outline" onClick={() => setAnchor(new Date())}>
              Сьогодні
            </Button>

            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="icon"
                onClick={() => setAnchor((d: Date) => moveAnchor(mode, d, -1))}
                aria-label="Prev"
              >
                ‹
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setAnchor((d: Date) => moveAnchor(mode, d, 1))}
                aria-label="Next"
              >
                ›
              </Button>
            </div>

            <div className="ml-1 text-sm font-medium capitalize">{titleFor(mode, anchor)}</div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Select value={calendarId} onValueChange={setCalendarId}>
              <SelectTrigger className="w-[180px] sm:w-[220px]">
                <SelectValue placeholder="Календар" />
              </SelectTrigger>
              <SelectContent>
                {calendars.length === 0 ? (
                  <SelectItem value="primary">Primary</SelectItem>
                ) : (
                  calendars.map((c: any) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.primary ? `${c.name} (основний)` : c.name}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>

            <Select value={mode} onValueChange={(v) => setMode(v as ViewMode)}>
              <SelectTrigger className="w-[120px] sm:w-[150px]">
                <SelectValue placeholder="Вид" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="day">День</SelectItem>
                <SelectItem value="week">Тиждень</SelectItem>
                <SelectItem value="month">Місяць</SelectItem>
                <SelectItem value="year">Рік</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {error && (
          <div className="mt-3 rounded-xl border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {error}
          </div>
        )}
      </Card>

      <Card className="flex-1 min-h-0 overflow-hidden flex flex-col rounded-2xl shadow-sm border-border bg-card p-0 gap-0">
        {mode === "day" && (
          <DayView day={start} events={events} onCreateAt={openCreateAt} onEventClick={setSelectedEvent} />
        )}
        {mode === "week" && (
          <WeekView start={start} events={events} onCreateAt={openCreateAt} onEventClick={setSelectedEvent} />
        )}
        {mode === "month" && <MonthView anchor={anchor} events={events} onCreateAt={openCreateAt} onEventClick={setSelectedEvent} />}
        {mode === "year" && <YearView anchor={anchor} events={events} onEventClick={setSelectedEvent} />}
      </Card>

      <CreateEventDialog
        open={createOpen}
        onOpenChange={(v) => {
          setCreateOpen(v);
          if (!v) {
            setDraft(null);
            setCreateErr(null);
          }
        }}
        calendarId={calendarId}
        draft={draft}
        setDraft={setDraft}
        error={createErr}
        onSubmit={submitCreate}
      />

      <EventDetailsDialog
        event={selectedEvent}
        onClose={() => setSelectedEvent(null)}
        onEdit={openEditEvent}
        onDelete={handleDeleteEvent}
      />
    </div>
  );
}

// helpers
function addMinutesSafe(d: Date, minutes: number) {
  const out = new Date(d);
  out.setMinutes(out.getMinutes() + minutes);
  return out;
}

function DayView({
  day,
  events,
  onCreateAt,
  onEventClick,
}: {
  day: Date;
  events: CalendarEvent[];
  onCreateAt: (dt: Date) => void;
  onEventClick: (e: CalendarEvent) => void;
}) {
  const hours = Array.from({ length: 24 }, (_, i) => i);
  const hourPx = 48;

  const allDay = events
    .filter((e) => isAllDayOrMultiDay(e))
    .filter((e) => overlapsRange(e, startOfDay(day), endOfDay(day)));

  const positioned = layoutDayTimedEvents(day, events, hourPx);

  const now = new Date();
  const isToday = isSameDay(now, day);
  const currentTop = ((now.getHours() * 60 + now.getMinutes()) / 60) * hourPx;

  return (
    <div className="flex-1 min-h-0 w-full overflow-x-auto">
    <div className="flex flex-col min-h-0 w-full min-w-[680px]">
      <div className="shrink-0 bg-muted/20 border-b border-border/50">
        <div className="grid grid-cols-[60px_1fr] border-b border-border/50">
          <div className="p-2 text-[10px] font-medium uppercase tracking-wider text-muted-foreground flex items-end justify-center pb-1">Час</div>
          <div className="p-3 flex flex-col items-center justify-center">
            <div className="text-xs text-muted-foreground uppercase capitalize">{format(day, "EEEE", { locale: uk })}</div>
            <div className={cn(
              "mt-0.5 text-xl font-medium w-8 h-8 flex items-center justify-center rounded-full",
              isToday ? "bg-primary text-primary-foreground" : "text-foreground"
            )}>{format(day, "d")}</div>
          </div>
        </div>

        <div className="grid grid-cols-[60px_1fr] min-h-[40px]">
          <div className="border-r border-border/50 p-2 text-[10px] text-muted-foreground flex items-center justify-center text-center">Весь день</div>
          <div className="p-2">
            {allDay.length === 0 ? (
              <div className="text-xs text-muted-foreground/50 h-full flex items-center pl-2">—</div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {allDay.map((e: any) => (
                  <a
                    key={e.id}
                    href="#"
                    onClick={(evt) => {
                      evt.preventDefault();
                      onEventClick(e);
                    }}
                    className={cn(
                      "max-w-full truncate rounded-md border border-primary/20 bg-primary/10 px-2 py-1 text-xs font-medium text-primary hover:bg-primary/20 transition-colors",
                      e.completed && "opacity-50 line-through grayscale"
                    )}
                    title={e.title}
                  >
                    {e.title}
                  </a>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto min-h-0 relative scroll-smooth group [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        <div className="grid grid-cols-[60px_1fr]">
          {hours.map((h: number) => (
            <React.Fragment key={h}>
              <div className="border-r border-border/50 p-2 text-[10px] text-muted-foreground text-center relative">
                <span className="-translate-y-1/2 absolute top-0 left-0 right-0">{h === 0 ? "" : String(h).padStart(2, "0") + ":00"}</span>
              </div>
              <button
                type="button"
                className={cn(
                  buttonVariants({ variant: "ghost" }),
                  "min-h-12 h-auto w-full rounded-none border-b border-border/50 px-0 py-0 justify-start text-left hover:bg-muted/10"
                )}
                style={{ height: hourPx }}
                onClick={() => {
                  const dt = setMinutes(setHours(new Date(day), h), 0);
                  onCreateAt(dt);
                }}
              />
            </React.Fragment>
          ))}
        </div>

        <div
          className="absolute left-[60px] right-0 top-0"
          style={{ height: hourPx * 24 }}
        >
          {isToday && (
            <div
              className="absolute left-0 right-0 border-t-2 border-primary z-20 pointer-events-none"
              style={{ top: currentTop }}
            >
              <div className="absolute -left-1.5 -top-1.5 w-3 h-3 bg-primary rounded-full" />
            </div>
          )}

          {positioned.map((p: any) => {
            const widthPct = 100 / p.cols;
            const leftPct = p.col * widthPct;

            return (
              <a
                key={p.event.id}
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  onEventClick(p.event);
                }}
                className={cn(
                  "absolute overflow-hidden rounded-md border-l-4 border-l-primary bg-primary/10 p-1.5 hover:bg-primary/20 transition-colors shadow-sm",
                  "border border-primary/20"
                )}
                style={{
                  top: p.top,
                  height: Math.max(20, p.height),
                  left: `${leftPct}%`,
                  width: `${widthPct}%`,
                  marginLeft: 2,
                  marginRight: 4,
                }}
                title={p.event.title}
              >
                <div className="truncate text-xs font-semibold leading-tight text-foreground">{p.event.title}</div>
                <div className="mt-0.5 truncate text-[10px] text-foreground/70">
                  {format(toLocalDate(p.event.start), "HH:mm")} –{" "}
                  {format(toLocalDate(p.event.end), "HH:mm")}
                </div>
              </a>
            );
          })}
        </div>
      </div>
    </div>
    </div>
  );
}

function WeekView({
  start,
  events,
  onCreateAt,
  onEventClick,
}: {
  start: Date;
  events: CalendarEvent[];
  onCreateAt: (dt: Date) => void;
  onEventClick: (e: CalendarEvent) => void;
}) {
  const days = Array.from({ length: 7 }, (_, i) => addDays(start, i));
  const hours = Array.from({ length: 24 }, (_, i) => i);
  const hourPx = 48;

  const allDayByDay = days.map((d) =>
    events
      .filter((e) => isAllDayOrMultiDay(e))
      .filter((e) => overlapsRange(e, startOfDay(d), endOfDay(d)))
  );

  const positionedByDay = days.map((d: Date) => layoutDayTimedEvents(d, events, hourPx));

  const now = new Date();
  const currentTop = ((now.getHours() * 60 + now.getMinutes()) / 60) * hourPx;

  return (
    <div className="flex-1 min-h-0 w-full overflow-x-auto">
    <div className="flex flex-col min-h-0 w-full min-w-[980px]">
      <div className="shrink-0 bg-muted/20 border-b border-border/50">
        <div className="grid grid-cols-[60px_repeat(7,1fr)] border-b border-border/50">
          <div className="p-2 text-[10px] font-medium uppercase tracking-wider text-muted-foreground flex items-end justify-center pb-1">Час</div>
          {days.map((d: Date) => {
            const isToday = isSameDay(now, d);
            return (
              <div key={d.toISOString()} className="p-3 flex flex-col items-center justify-center border-l border-border/50">
                <div className="text-[10px] md:text-xs text-muted-foreground uppercase capitalize">{format(d, "EEEEEE", { locale: uk })}</div>
                <div className={cn(
                  "mt-0.5 text-lg md:text-xl font-medium w-7 h-7 md:w-8 md:h-8 flex items-center justify-center rounded-full",
                  isToday ? "bg-primary text-primary-foreground" : "text-foreground"
                )}>
                  {format(d, "d")}
                </div>
              </div>
            );
          })}
        </div>

        <div className="grid grid-cols-[60px_repeat(7,1fr)] min-h-[40px]">
          <div className="border-r border-border/50 p-2 text-[10px] text-muted-foreground flex items-center justify-center text-center">Весь день</div>
          {days.map((d: Date, idx: number) => (
            <div key={d.toISOString()} className="border-l p-1 border-border/50">
              {allDayByDay[idx]!.length === 0 ? (
                <div className="text-xs text-muted-foreground/50 h-full flex items-center justify-center">—</div>
              ) : (
                <div className="flex flex-wrap md:flex-col gap-1">
                  {allDayByDay[idx]!.slice(0, 3).map((e: any) => (
                    <a
                      key={e.id}
                      href="#"
                      onClick={(evt) => {
                        evt.preventDefault();
                        onEventClick(e);
                      }}
                      className={cn(
                        "truncate rounded-md border border-primary/20 bg-primary/10 px-1.5 py-0.5 text-[10px] md:text-xs font-medium text-primary hover:bg-primary/20 transition-colors max-w-full",
                        e.completed && "opacity-50 line-through grayscale"
                      )}
                      title={e.title}
                    >
                      {e.title}
                    </a>
                  ))}
                  {allDayByDay[idx]!.length > 3 && (
                    <div className="text-[10px] text-muted-foreground text-center">
                      +{allDayByDay[idx]!.length - 3} ще
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto min-h-0 relative scroll-smooth group [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        <div className="grid grid-cols-[60px_repeat(7,1fr)]">
          {hours.map((h: number) => (
            <React.Fragment key={h}>
              <div className="border-r p-2 text-[10px] text-muted-foreground text-center relative border-border/50">
                <span className="-translate-y-1/2 absolute top-0 left-0 right-0">{h === 0 ? "" : String(h).padStart(2, "0") + ":00"}</span>
              </div>

              {days.map((d) => (
                <button
                  key={d.toISOString() + h}
                  type="button"
                  className={cn(
                    buttonVariants({ variant: "ghost" }),
                    "min-h-12 h-auto w-full rounded-none border-b border-l border-border/50 px-0 py-0 justify-start text-left hover:bg-muted/10"
                  )}
                  style={{ height: hourPx }}
                  onClick={() => {
                    const dt = setMinutes(setHours(new Date(d), h), 0);
                    onCreateAt(dt);
                  }}
                />
              ))}
            </React.Fragment>
          ))}
        </div>

        <div
          className="absolute left-[60px] right-0 top-0 grid grid-cols-7"
          style={{ height: hourPx * 24 }}
        >
          {days.map((d: Date, idx: number) => {
            const isToday = isSameDay(now, d);
            return (
              <div key={d.toISOString()} className="relative">
                {isToday && (
                  <div
                    className="absolute left-0 right-0 border-t-2 border-primary z-20 pointer-events-none"
                    style={{ top: currentTop }}
                  >
                    <div className="absolute -left-1.5 -top-1.5 w-3 h-3 bg-primary rounded-full" />
                  </div>
                )}
                {positionedByDay[idx]!.map((p: any) => {
                  const widthPct = 100 / p.cols;
                  const leftPct = p.col * widthPct;

                  return (
                    <a
                      key={p.event.id}
                      href="#"
                      onClick={(evt) => {
                        evt.preventDefault();
                        onEventClick(p.event);
                      }}
                      className={cn(
                        "absolute overflow-hidden rounded-md border-l-4 border-l-primary bg-primary/10 p-1 hover:bg-primary/20 transition-colors shadow-sm",
                        "border border-primary/20"
                      )}
                      style={{
                        top: p.top,
                        height: Math.max(20, p.height),
                        left: `${leftPct}%`,
                        width: `${widthPct}%`,
                        marginLeft: 1,
                        marginRight: 2,
                      }}
                      title={p.event.title}
                    >
                      <div className="truncate text-[10px] md:text-xs font-semibold leading-tight text-foreground">{p.event.title}</div>
                      <div className="mt-0.5 truncate text-[9px] text-foreground/70 hidden md:block">
                        {format(toLocalDate(p.event.start), "HH:mm")} –{" "}
                        {format(toLocalDate(p.event.end), "HH:mm")}
                      </div>
                    </a>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
    </div>
    </div>
  );
}

function MonthView({ anchor, events, onCreateAt, onEventClick }: { anchor: Date; events: CalendarEvent[]; onCreateAt: (dt: Date) => void; onEventClick: (e: CalendarEvent) => void; }) {
  const start = startOfWeek(startOfMonth(anchor), { weekStartsOn: 1 });
  const end = endOfWeek(endOfMonth(anchor), { weekStartsOn: 1 });

  const days: Date[] = [];
  for (let d = start; d <= end; d = addDays(d, 1)) days.push(d);

  const now = new Date();

  return (
    <div className="flex-1 min-h-0 w-full overflow-x-auto">
    <div className="flex flex-col min-h-0 w-full min-w-[760px]">
      <div className="shrink-0 grid grid-cols-7 border-b border-border/50 bg-muted/20">
        {["ПН", "ВТ", "СР", "ЧТ", "ПТ", "СБ", "НД"].map((x) => (
          <div key={x} className="p-2 text-center text-[10px] md:text-xs font-semibold tracking-wider text-muted-foreground">
            {x}
          </div>
        ))}
      </div>

      <div
        className="flex-1 min-h-0 grid grid-cols-7 gap-px bg-border/50 overflow-y-auto rounded-b-xl [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
        style={{ gridTemplateRows: `repeat(${days.length / 7}, minmax(0, 1fr))` }}
      >
        {days.map((d: Date) => {
          const total = events.filter((e) => overlapsRange(e, startOfDay(d), endOfDay(d)));
          const preview = total.slice(0, 4);
          const isCurrentMonth = d.getMonth() === anchor.getMonth();
          const isToday = isSameDay(now, d);

          return (
            <div
              key={d.toISOString()}
              className={cn(
                "min-h-[80px] md:min-h-[120px] bg-card p-1 md:p-2 overflow-hidden flex flex-col gap-1 transition-colors hover:bg-muted/10 cursor-pointer",
                !isCurrentMonth && "opacity-50"
              )}
              onClick={() => {
                const dt = setHours(startOfDay(d), 9); // default 09:00 if clicking month view
                onCreateAt(dt);
              }}
            >
              <div className="flex items-center justify-between">
                <div className={cn(
                  "text-[10px] md:text-xs font-medium w-5 h-5 md:w-6 md:h-6 flex items-center justify-center rounded-full ml-1 md:ml-0 mt-0.5",
                  isToday ? "bg-primary text-primary-foreground" : "text-foreground",
                  isToday && !isCurrentMonth && "opacity-70"
                )}>
                  {format(d, "d")}
                </div>
              </div>

              <div className="flex-1 overflow-y-auto space-y-1 mt-1 pr-1 pb-1 scrollbar-hide">
                {preview.map((e: any) => (
                  <a
                    key={e.id}
                    href="#"
                    onClick={(evt) => {
                      evt.preventDefault();
                      onEventClick(e);
                    }}
                    className={cn(
                      "block truncate rounded-sm border border-primary/20 bg-primary/10 px-1.5 py-0.5 text-[9px] md:text-[10px] font-medium text-primary hover:bg-primary/20 transition-colors",
                      e.completed && "opacity-50 line-through grayscale"
                    )}
                    title={e.title}
                  >
                    {e.title}
                  </a>
                ))}
                {total.length > 4 && (
                  <div className="text-[9px] md:text-[10px] text-muted-foreground font-medium pl-1">
                    +{total.length - 4} ще
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
    </div>
  );
}

function YearView({ anchor, events, onEventClick }: { anchor: Date; events: CalendarEvent[]; onEventClick: (e: CalendarEvent) => void; }) {
  const months = Array.from({ length: 12 }, (_, i) => new Date(anchor.getFullYear(), i, 1));

  return (
    <div className="flex-1 overflow-y-auto grid gap-3 md:grid-cols-3 xl:grid-cols-4 content-start p-2">
      {months.map((m: Date) => {
        const mStart = startOfMonth(m).getTime();
        const mEnd = endOfMonth(m).getTime();

        const count = events.filter((e) => {
          const s = toLocalDate(e.start).getTime();
          const en = toLocalDate(e.end).getTime();
          return s <= mEnd && en >= mStart;
        }).length;

        return (
          <div key={m.toISOString()} className="rounded-xl border border-border/50 bg-card p-4 shadow-sm hover:shadow-md transition-shadow">
            <div className="text-base font-semibold capitalize text-foreground">{format(m, "MMMM", { locale: uk })}</div>
            <div className="mt-1 flex items-center gap-2">
              <div className="text-sm text-muted-foreground">{count} подій</div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function CreateEventDialog({
  open,
  onOpenChange,
  calendarId,
  draft,
  setDraft,
  error,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  calendarId: string;
  draft: DraftEvent | null;
  setDraft: React.Dispatch<React.SetStateAction<DraftEvent | null>>;
  error: string | null;
  onSubmit: () => Promise<void>;
}) {
  const [saving, startTransition] = React.useTransition();

  const disabled = !draft;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle>{draft?.id ? "Редагувати подію" : "Нова подія"}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="text-xs text-muted-foreground">
            Календар: <span className="font-medium text-foreground">{calendarId}</span>
          </div>

          {error && (
            <div className="rounded-xl border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <Label>Назва</Label>
            <Input
              value={draft?.title ?? ""}
              onChange={(e) =>
                setDraft((d) => (d ? { ...d, title: e.target.value } : d))
              }
              disabled={disabled}
              placeholder="Наприклад: Дзвінок з клієнтом"
            />
          </div>



          <div className="flex flex-col gap-4">
            <div className="space-y-2">
              <Label>Початок</Label>
              <div className="flex gap-2">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "flex-1 min-w-0 h-10 justify-start text-left font-normal px-3",
                        !draft?.start && "text-muted-foreground"
                      )}
                      disabled={disabled}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4 opacity-70 shrink-0" />
                      <span className="truncate">
                        {draft?.start ? format(draft.start, "d MMM yyyy", { locale: uk }) : "Дата"}
                      </span>
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={draft?.start}
                      onSelect={(date) => {
                        if (!date) return;
                        setDraft((d) => {
                          if (!d) return d;
                          const newD = new Date(date);
                          newD.setHours(d.start.getHours(), d.start.getMinutes());
                          const newEnd = new Date(newD.getTime() + 30 * 60000);
                          return { ...d, start: newD, end: newEnd };
                        });
                      }}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>

                {!draft?.allDay && (
                  <div className="w-[110px] shrink-0">
                    <TimePicker
                      value={draft?.start ? format(draft.start, "HH:mm") : ""}
                      onChangeAction={(time) => {
                        setDraft((d) => {
                          if (!d) return d;
                          const [hh, mm] = time.split(":").map(Number);
                          const newD = new Date(d.start);
                          newD.setHours(hh!, mm!);
                          const newEnd = new Date(newD.getTime() + 30 * 60000);
                          return { ...d, start: newD, end: newEnd };
                        });
                      }}
                      disabled={disabled}
                    />
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Кінець</Label>
              <div className="flex gap-2">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "flex-1 min-w-0 h-10 justify-start text-left font-normal px-3",
                        !draft?.end && "text-muted-foreground"
                      )}
                      disabled={disabled}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4 opacity-70 shrink-0" />
                      <span className="truncate">
                        {draft?.end ? format(draft.end, "d MMM yyyy", { locale: uk }) : "Дата"}
                      </span>
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={draft?.end}
                      onSelect={(date) => {
                        if (!date) return;
                        setDraft((d) => {
                          if (!d) return d;
                          const newD = new Date(date);
                          newD.setHours(d.end.getHours(), d.end.getMinutes());
                          if (newD < d.start) newD.setTime(d.start.getTime() + 30 * 60000);
                          return { ...d, end: newD };
                        });
                      }}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>

                {!draft?.allDay && (
                  <div className="w-[110px] shrink-0">
                    <TimePicker
                      value={draft?.end ? format(draft.end, "HH:mm") : ""}
                      onChangeAction={(time) => {
                        setDraft((d) => {
                          if (!d) return d;
                          const [hh, mm] = time.split(":").map(Number);
                          const newD = new Date(d.end);
                          newD.setHours(hh!, mm!);
                          if (newD < d.start) newD.setTime(d.start.getTime() + 30 * 60000);
                          return { ...d, end: newD };
                        });
                      }}
                      disabled={disabled}
                    />
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Опис</Label>
            <Textarea
              value={draft?.description ?? ""}
              onChange={(e) =>
                setDraft((d) => (d ? { ...d, description: e.target.value } : d))
              }
              disabled={disabled}
              placeholder="Нотатки..."
            />
          </div>
        </div>

        <DialogFooter className="mt-2 gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Скасувати
          </Button>
          <Button
            onClick={() => startTransition(() => onSubmit())}
            disabled={saving || disabled}
          >
            {draft?.id ? "Зберегти" : "Створити"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function EventDetailsDialog({
  event,
  onClose,
  onEdit,
  onDelete,
}: {
  event: CalendarEvent | null;
  onClose: () => void;
  onEdit: (e: CalendarEvent) => void;
  onDelete: (id: string) => void;
}) {
  if (!event) return null;

  const start = toLocalDate(event.start);
  const end = toLocalDate(event.end);
  const isSame = isSameDay(start, end);

  return (
    <Dialog open={!!event} onOpenChange={(val) => !val && onClose()}>
      <DialogContent className="sm:max-w-[420px]">
        <DialogHeader>
          <DialogTitle className="pr-6">{event.title}</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="flex items-start justify-between gap-3 text-sm">
            <div className="flex items-start gap-3">
              <CalendarIcon className="w-5 h-5 text-muted-foreground shrink-0 mt-0.5" />
              <div className="flex flex-col">
                {event.allDay ? (
                  <span>{format(start, "d MMMM yyyy", { locale: uk })} (Весь день)</span>
                ) : (
                  <>
                    <span>{format(start, "d MMMM yyyy, HH:mm", { locale: uk })}</span>
                    <span className="text-muted-foreground">
                      до {isSame ? format(end, "HH:mm") : format(end, "d MMMM yyyy, HH:mm", { locale: uk })}
                    </span>
                  </>
                )}
              </div>
            </div>

            {event.htmlLink && (
              <Button variant="ghost" size="icon" asChild className="h-8 w-8 text-muted-foreground shrink-0 -mt-1 -mr-1 hover:text-foreground">
                <a href={event.htmlLink} target="_blank" rel="noreferrer" title="Відкрити в Google Calendar">
                  <ExternalLink className="w-4 h-4" />
                </a>
              </Button>
            )}
          </div>
          
          {event.completed && (
            <div className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold bg-green-500/10 text-emerald-500 border-green-500/20">
              Виконано
            </div>
          )}
        </div>

        <DialogFooter className="mt-6 flex flex-row items-center sm:justify-start justify-start gap-2">
          <Button variant="outline" onClick={() => onEdit(event)}>
            Редагувати
          </Button>
          <Button variant="ghost" size="icon" onClick={() => onDelete(event.id)} title="Видалити подiю" className="text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors">
            <Trash2 className="w-4 h-4" />
            <span className="sr-only">Видалити</span>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

