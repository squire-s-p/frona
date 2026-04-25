"use client";

import * as React from "react";
import { addDays } from "date-fns";
import { type DateRange } from "react-day-picker";

import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function CalendarPage() {
  const [dateRange, setDateRange] = React.useState<DateRange | undefined>({
    from: new Date(new Date().getFullYear(), 0, 12),
    to: addDays(new Date(new Date().getFullYear(), 0, 12), 30),
  });

  const [date, setDate] = React.useState<Date | undefined>(
    new Date(new Date().getFullYear(), 1, 12)
  );

  return (
    <div className="space-y-10 pr-10 pb-20">
      <div className="space-y-4">
        <h1 className="scroll-m-20 text-4xl font-extrabold tracking-tight lg:text-5xl text-foreground">
          Calendar
        </h1>
        <p className="text-lg text-muted-foreground">
          A date field component that allows users to enter and edit date.
        </p>
      </div>

      <div className="space-y-4">
        <h2 className="scroll-m-20 border-b pb-2 text-3xl font-semibold tracking-tight transition-colors first:mt-0 text-foreground">
          Basic
        </h2>
        <div className="rounded-xl border border-border/40 bg-card p-6 shadow-sm flex items-center justify-center">
          <Calendar mode="single" className="rounded-lg border bg-background" />
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="scroll-m-20 border-b pb-2 text-3xl font-semibold tracking-tight transition-colors first:mt-0 text-foreground">
          Range Calendar
        </h2>
        <div className="rounded-xl border border-border/40 bg-card p-6 shadow-sm flex items-center justify-center">
          <Card className="mx-auto w-fit p-0">
            <CardContent className="p-0">
              <Calendar
                mode="range"
                defaultMonth={dateRange?.from}
                selected={dateRange}
                onSelect={setDateRange}
                numberOfMonths={2}
                disabled={(date) =>
                  date > new Date() || date < new Date("1900-01-01")
                }
              />
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="scroll-m-20 border-b pb-2 text-3xl font-semibold tracking-tight transition-colors first:mt-0 text-foreground">
          Presets
        </h2>
        <div className="rounded-xl border border-border/40 bg-card p-6 shadow-sm flex items-center justify-center">
          <Card className="mx-auto w-fit max-w-[320px]">
            <CardContent className="p-0 pt-2">
              <Calendar
                mode="single"
                selected={date}
                onSelect={setDate}
                fixedWeeks
              />
            </CardContent>
            <CardFooter className="flex flex-wrap gap-2 border-t p-4">
              {[
                { label: "Today", value: 0 },
                { label: "Tomorrow", value: 1 },
                { label: "In 3 days", value: 3 },
                { label: "In a week", value: 7 },
              ].map((preset) => (
                <Button
                  key={preset.value}
                  variant="outline"
                  size="sm"
                  className="flex-1 min-w-[45%]"
                  onClick={() => {
                    const newDate = addDays(new Date(), preset.value);
                    setDate(newDate);
                  }}
                >
                  {preset.label}
                </Button>
              ))}
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
}
