"use client"

import * as React from "react"
import { TimePicker } from "@/components/ui/time-picker"

export default function TimePickerPage() {
  const [time, setTime] = React.useState("12:00")

  return (
    <div className="space-y-10 pr-10 pb-20">
      <div className="space-y-4">
        <h1 className="scroll-m-20 text-4xl font-bold tracking-tight lg:text-5xl text-foreground">
          Time Picker
        </h1>
        <p className="text-lg text-muted-foreground">
          A custom time picker component with a clock interface.
        </p>
      </div>

      <div className="space-y-8">
        <section className="space-y-4">
          <h2 className="text-2xl font-bold tracking-tight text-foreground">Basic Example</h2>
          <div className="rounded-xl border border-border/40 bg-card p-6 shadow-sm flex flex-col items-center justify-center gap-4">
            <div className="w-full max-w-[200px]">
              <TimePicker value={time} onChangeAction={setTime} />
            </div>
            <p className="text-sm text-muted-foreground">Selected time: {time}</p>
          </div>
        </section>
      </div>
    </div>
  )
}
