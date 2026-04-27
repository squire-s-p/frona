"use client"

import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"

export default function LabelPage() {
  return (
    <div className="space-y-10 pr-10 pb-20">
      <div className="space-y-4">
        <h1 className="scroll-m-20 text-4xl font-bold tracking-tight lg:text-5xl text-foreground">
          Label
        </h1>
        <p className="text-lg text-muted-foreground">
          Renders an accessible label associated with a control.
        </p>
        <div className="rounded-md bg-muted/50 p-4 border border-border/40 font-mono text-sm">
          npx shadcn@latest add label
        </div>
      </div>

      <div className="space-y-8">
        <section className="space-y-4">
          <h2 className="text-2xl font-bold tracking-tight text-foreground">Basic Example</h2>
          <div className="rounded-xl border border-border/40 bg-card p-6 shadow-sm flex items-center justify-center">
            <div className="flex items-center space-x-2">
              <Checkbox id="terms" />
              <Label htmlFor="terms">Accept terms and conditions</Label>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}
