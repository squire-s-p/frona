"use client"

import * as React from "react"
import {
  NativeSelect,
  NativeSelectOption,
  NativeSelectOptGroup,
} from "@/components/ui/native-select"

export default function NativeSelectPage() {
  return (
    <div className="space-y-10 pr-10 pb-20">
      <div className="space-y-4">
        <h1 className="scroll-m-20 text-4xl font-bold tracking-tight lg:text-5xl text-foreground">
          Native Select
        </h1>
        <p className="text-lg text-muted-foreground">
          A native HTML select component styled to match the design system.
        </p>
      </div>

      <div className="space-y-8">
        <section className="space-y-4">
          <h2 className="text-2xl font-bold tracking-tight text-foreground">Basic Example</h2>
          <div className="rounded-xl border border-border/40 bg-card p-6 shadow-sm flex items-center justify-center">
            <NativeSelect className="w-[200px]">
              <NativeSelectOption value="apple">Apple</NativeSelectOption>
              <NativeSelectOption value="banana">Banana</NativeSelectOption>
              <NativeSelectOption value="orange">Orange</NativeSelectOption>
            </NativeSelect>
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-bold tracking-tight text-foreground">Small Size</h2>
          <div className="rounded-xl border border-border/40 bg-card p-6 shadow-sm flex items-center justify-center">
            <NativeSelect size="sm" className="w-[150px]">
              <NativeSelectOption value="low">Low</NativeSelectOption>
              <NativeSelectOption value="medium">Medium</NativeSelectOption>
              <NativeSelectOption value="high">High</NativeSelectOption>
            </NativeSelect>
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-bold tracking-tight text-foreground">With Groups</h2>
          <div className="rounded-xl border border-border/40 bg-card p-6 shadow-sm flex items-center justify-center">
            <NativeSelect className="w-[200px]">
              <NativeSelectOptGroup label="Fruits">
                <NativeSelectOption value="apple">Apple</NativeSelectOption>
                <NativeSelectOption value="banana">Banana</NativeSelectOption>
              </NativeSelectOptGroup>
              <NativeSelectOptGroup label="Vegetables">
                <NativeSelectOption value="carrot">Carrot</NativeSelectOption>
                <NativeSelectOption value="potato">Potato</NativeSelectOption>
              </NativeSelectOptGroup>
            </NativeSelect>
          </div>
        </section>
      </div>
    </div>
  )
}
