"use client";

import * as React from "react";
import { format, parseISO } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type CalendarEvent = {
  id: string;
  summary: string;
  description?: string | null;
  location?: string | null;
  htmlLink?: string | null;
  start: { dateTime?: string | null; date?: string | null };
  end: { dateTime?: string | null; date?: string | null };
};

function eventStartDate(e: CalendarEvent) {
  const v = e.start.dateTime ?? e.start.date;
  return v ? parseISO(v) : null;
}

function eventTimeLabel(e: CalendarEvent) {
  if (e.start.dateTime) return format(parseISO(e.start.dateTime), "HH:mm");
  return "All day";
}

export default function CalendarShell(props: {
  initialMonth: string;
  events: CalendarEvent[];
}) {
  const [selected, setSelected] = React.useState<Date | undefined>(new Date());

  const eventsByDay = React.useMemo(() => {
    const map = new Map<string, CalendarEvent[]>();
    for (const e of props.events) {
      const d = eventStartDate(e);
      if (!d) continue;
      const key = format(d, "yyyy-MM-dd");
      const arr = map.get(key) ?? [];
      arr.push(e);
      map.set(key, arr);
    }
    return map;
  }, [props.events]);

  const selectedKey = selected ? format(selected, "yyyy-MM-dd") : null;
  const dayEvents = selectedKey ? eventsByDay.get(selectedKey) ?? [] : [];

  return (
    <div className="grid gap-4 lg:grid-cols-[360px_1fr]">
      <Card className="p-3">
        <Calendar
          mode="single"
          selected={selected}
          onSelect={setSelected}
          // маленькі “крапки” для днів з подіями
          modifiers={{
            hasEvents: (date) => {
              const key = format(date, "yyyy-MM-dd");
              return (eventsByDay.get(key)?.length ?? 0) > 0;
            },
          }}
          modifiersClassNames={{
            hasEvents:
              "relative after:absolute after:bottom-1 after:left-1/2 after:h-1 after:w-1 after:-translate-x-1/2 after:rounded-full after:bg-foreground/60",
          }}
        />
      </Card>

      <Card className="p-4">
        <div className="flex items-baseline justify-between">
          <div>
            <div className="text-sm text-muted-foreground">Події</div>
            <div className="text-base font-semibold">
              {selected ? format(selected, "d MMMM yyyy") : "—"}
            </div>
          </div>
          <div className="text-sm text-muted-foreground">
            {dayEvents.length} шт.
          </div>
        </div>

        <div className="mt-4 flex flex-col gap-2">
          {dayEvents.length === 0 ? (
            <div className="text-sm text-muted-foreground">
              Немає подій на цей день.
            </div>
          ) : (
            dayEvents.map((e) => (
              <a
                key={e.id}
                href={e.htmlLink ?? "#"}
                target="_blank"
                rel="noreferrer"
                className={cn(
                  "block rounded-lg border p-3 transition",
                  "hover:bg-muted/40"
                )}
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="font-medium">{e.summary}</div>
                  <div className="text-sm text-muted-foreground">
                    {eventTimeLabel(e)}
                  </div>
                </div>
                {(e.location || e.description) && (
                  <div className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                    {e.location ?? e.description}
                  </div>
                )}
              </a>
            ))
          )}
        </div>
      </Card>
    </div>
  );
}
