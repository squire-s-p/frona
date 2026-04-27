"use client";

import * as React from "react";
import { Bold, Italic, Underline, BoldIcon, ItalicIcon, UnderlineIcon } from "lucide-react";

import {
  ToggleGroup,
  ToggleGroupItem,
} from "@/components/ui/toggle-group";
import {
  Field,
  FieldDescription,
  FieldLabel,
} from "@/components/ui/field";

export default function ToggleGroupPage() {
  const [fontWeight, setFontWeight] = React.useState("normal");

  return (
    <div className="space-y-10 pr-10 pb-20">
      <div className="space-y-4">
        <h1 className="scroll-m-20 text-4xl font-bold tracking-tight lg:text-5xl text-foreground">
          Toggle Group
        </h1>
        <p className="text-lg text-muted-foreground">
          A set of two-state buttons that can be toggled on or off.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <h2 className="scroll-m-20 border-b pb-2 text-2xl font-semibold tracking-tight transition-colors first:mt-0 text-foreground">
            Basic
          </h2>
          <div className="rounded-xl border border-border/40 bg-card p-6 shadow-sm flex items-center justify-center min-h-[150px]">
            <ToggleGroup variant="outline" type="multiple">
              <ToggleGroupItem value="bold" aria-label="Toggle bold">
                <Bold className="h-4 w-4" />
              </ToggleGroupItem>
              <ToggleGroupItem value="italic" aria-label="Toggle italic">
                <Italic className="h-4 w-4" />
              </ToggleGroupItem>
              <ToggleGroupItem value="strikethrough" aria-label="Toggle strikethrough">
                <Underline className="h-4 w-4" />
              </ToggleGroupItem>
            </ToggleGroup>
          </div>
        </div>

        <div className="space-y-4">
          <h2 className="scroll-m-20 border-b pb-2 text-2xl font-semibold tracking-tight transition-colors first:mt-0 text-foreground">
            Outline (Single)
          </h2>
          <div className="rounded-xl border border-border/40 bg-card p-6 shadow-sm flex items-center justify-center min-h-[150px]">
            <ToggleGroup variant="outline" type="single" defaultValue="all">
              <ToggleGroupItem value="all" aria-label="Toggle all">
                All
              </ToggleGroupItem>
              <ToggleGroupItem value="missed" aria-label="Toggle missed">
                Missed
              </ToggleGroupItem>
            </ToggleGroup>
          </div>
        </div>

        <div className="space-y-4">
          <h2 className="scroll-m-20 border-b pb-2 text-2xl font-semibold tracking-tight transition-colors first:mt-0 text-foreground">
            Sizes
          </h2>
          <div className="rounded-xl border border-border/40 bg-card p-6 shadow-sm flex items-center justify-center min-h-[200px]">
            <div className="flex flex-col gap-4">
              <ToggleGroup type="single" size="sm" defaultValue="top" variant="outline">
                <ToggleGroupItem value="top" aria-label="Toggle top">
                  Top
                </ToggleGroupItem>
                <ToggleGroupItem value="bottom" aria-label="Toggle bottom">
                  Bottom
                </ToggleGroupItem>
                <ToggleGroupItem value="left" aria-label="Toggle left">
                  Left
                </ToggleGroupItem>
                <ToggleGroupItem value="right" aria-label="Toggle right">
                  Right
                </ToggleGroupItem>
              </ToggleGroup>
              <ToggleGroup type="single" defaultValue="top" variant="outline">
                <ToggleGroupItem value="top" aria-label="Toggle top">
                  Top
                </ToggleGroupItem>
                <ToggleGroupItem value="bottom" aria-label="Toggle bottom">
                  Bottom
                </ToggleGroupItem>
                <ToggleGroupItem value="left" aria-label="Toggle left">
                  Left
                </ToggleGroupItem>
                <ToggleGroupItem value="right" aria-label="Toggle right">
                  Right
                </ToggleGroupItem>
              </ToggleGroup>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <h2 className="scroll-m-20 border-b pb-2 text-2xl font-semibold tracking-tight transition-colors first:mt-0 text-foreground">
            Spacing
          </h2>
          <div className="rounded-xl border border-border/40 bg-card p-6 shadow-sm flex items-center justify-center min-h-[200px]">
            <ToggleGroup
              type="single"
              size="sm"
              defaultValue="top"
              variant="outline"
              // Spacing might be custom prop, mimicking style instead if not available
              className="gap-2" 
            >
              <ToggleGroupItem value="top" aria-label="Toggle top">
                Top
              </ToggleGroupItem>
              <ToggleGroupItem value="bottom" aria-label="Toggle bottom">
                Bottom
              </ToggleGroupItem>
              <ToggleGroupItem value="left" aria-label="Toggle left">
                Left
              </ToggleGroupItem>
              <ToggleGroupItem value="right" aria-label="Toggle right">
                Right
              </ToggleGroupItem>
            </ToggleGroup>
          </div>
        </div>

        <div className="space-y-4">
          <h2 className="scroll-m-20 border-b pb-2 text-2xl font-semibold tracking-tight transition-colors first:mt-0 text-foreground">
            Vertical
          </h2>
          <div className="rounded-xl border border-border/40 bg-card p-6 shadow-sm flex items-center justify-center min-h-[200px]">
            <ToggleGroup
              type="multiple"
              orientation="vertical"
              className="flex-col gap-1"
              defaultValue={["bold", "italic"]}
            >
              <ToggleGroupItem value="bold" aria-label="Toggle bold">
                <BoldIcon className="h-4 w-4" />
              </ToggleGroupItem>
              <ToggleGroupItem value="italic" aria-label="Toggle italic">
                <ItalicIcon className="h-4 w-4" />
              </ToggleGroupItem>
              <ToggleGroupItem value="underline" aria-label="Toggle underline">
                <UnderlineIcon className="h-4 w-4" />
              </ToggleGroupItem>
            </ToggleGroup>
          </div>
        </div>

        <div className="space-y-4">
          <h2 className="scroll-m-20 border-b pb-2 text-2xl font-semibold tracking-tight transition-colors first:mt-0 text-foreground">
            Disabled
          </h2>
          <div className="rounded-xl border border-border/40 bg-card p-6 shadow-sm flex items-center justify-center min-h-[200px]">
            <ToggleGroup disabled type="multiple">
              <ToggleGroupItem value="bold" aria-label="Toggle bold">
                <Bold className="h-4 w-4" />
              </ToggleGroupItem>
              <ToggleGroupItem value="italic" aria-label="Toggle italic">
                <Italic className="h-4 w-4" />
              </ToggleGroupItem>
              <ToggleGroupItem value="strikethrough" aria-label="Toggle strikethrough">
                <Underline className="h-4 w-4" />
              </ToggleGroupItem>
            </ToggleGroup>
          </div>
        </div>

        <div className="space-y-4 md:col-span-2">
          <h2 className="scroll-m-20 border-b pb-2 text-2xl font-semibold tracking-tight transition-colors first:mt-0 text-foreground">
            Custom Style
          </h2>
          <div className="rounded-xl border border-border/40 bg-card p-6 shadow-sm flex items-center justify-center min-h-[200px]">
            <Field className="w-fit">
              <FieldLabel>Font Weight</FieldLabel>
              <ToggleGroup
                type="single"
                value={fontWeight}
                onValueChange={(value) => {
                  if (value) setFontWeight(value);
                }}
                variant="outline"
                className="gap-2"
                size="lg"
              >
                <ToggleGroupItem
                  value="light"
                  aria-label="Light"
                  className="flex h-16 w-16 flex-col items-center justify-center rounded-xl p-0"
                >
                  <span className="text-2xl leading-none font-light">Aa</span>
                  <span className="text-xs text-muted-foreground mt-1">Light</span>
                </ToggleGroupItem>
                <ToggleGroupItem
                  value="normal"
                  aria-label="Normal"
                  className="flex h-16 w-16 flex-col items-center justify-center rounded-xl p-0"
                >
                  <span className="text-2xl leading-none font-normal">Aa</span>
                  <span className="text-xs text-muted-foreground mt-1">Normal</span>
                </ToggleGroupItem>
                <ToggleGroupItem
                  value="medium"
                  aria-label="Medium"
                  className="flex h-16 w-16 flex-col items-center justify-center rounded-xl p-0"
                >
                  <span className="text-2xl leading-none font-medium">Aa</span>
                  <span className="text-xs text-muted-foreground mt-1">Medium</span>
                </ToggleGroupItem>
                <ToggleGroupItem
                  value="bold"
                  aria-label="Bold"
                  className="flex h-16 w-16 flex-col items-center justify-center rounded-xl p-0"
                >
                  <span className="text-2xl leading-none font-bold">Aa</span>
                  <span className="text-xs text-muted-foreground mt-1">Bold</span>
                </ToggleGroupItem>
              </ToggleGroup>
              <FieldDescription className="mt-2">
                Use{" "}
                <code className="rounded-md bg-muted px-1 py-0.5 font-mono">
                  font-{fontWeight}
                </code>{" "}
                to set the font weight.
              </FieldDescription>
            </Field>
          </div>
        </div>
      </div>
    </div>
  );
}
