"use client";

import * as React from "react";
import { BookmarkIcon, BoldIcon, ItalicIcon } from "lucide-react";
import { Toggle } from "@/components/ui/toggle";

export default function TogglePage() {
  return (
    <div className="space-y-10 pr-10 pb-20">
      <div className="space-y-4">
        <h1 className="scroll-m-20 text-4xl font-extrabold tracking-tight lg:text-5xl text-foreground">
          Toggle
        </h1>
        <p className="text-lg text-muted-foreground">
          A two-state button that can be either on or off.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <h2 className="scroll-m-20 border-b pb-2 text-2xl font-semibold tracking-tight transition-colors first:mt-0 text-foreground">
            Basic
          </h2>
          <div className="rounded-xl border border-border/40 bg-card p-6 shadow-sm flex items-center justify-center min-h-[150px]">
            <Toggle aria-label="Toggle bookmark" size="sm" variant="outline">
              <BookmarkIcon className="group-data-[state=on]/toggle:fill-foreground h-4 w-4 mr-2" />
              Bookmark
            </Toggle>
          </div>
        </div>

        <div className="space-y-4">
          <h2 className="scroll-m-20 border-b pb-2 text-2xl font-semibold tracking-tight transition-colors first:mt-0 text-foreground">
            Outline
          </h2>
          <div className="rounded-xl border border-border/40 bg-card p-6 shadow-sm flex items-center justify-center min-h-[150px]">
            <div className="flex flex-wrap items-center gap-2">
              <Toggle variant="outline" aria-label="Toggle italic">
                <ItalicIcon className="h-4 w-4 mr-2" />
                Italic
              </Toggle>
              <Toggle variant="outline" aria-label="Toggle bold">
                <BoldIcon className="h-4 w-4 mr-2" />
                Bold
              </Toggle>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <h2 className="scroll-m-20 border-b pb-2 text-2xl font-semibold tracking-tight transition-colors first:mt-0 text-foreground">
            With Text
          </h2>
          <div className="rounded-xl border border-border/40 bg-card p-6 shadow-sm flex items-center justify-center min-h-[150px]">
            <Toggle aria-label="Toggle italic">
              <ItalicIcon className="h-4 w-4 mr-2" />
              Italic
            </Toggle>
          </div>
        </div>

        <div className="space-y-4">
          <h2 className="scroll-m-20 border-b pb-2 text-2xl font-semibold tracking-tight transition-colors first:mt-0 text-foreground">
            Sizes
          </h2>
          <div className="rounded-xl border border-border/40 bg-card p-6 shadow-sm flex items-center justify-center min-h-[150px]">
            <div className="flex flex-wrap items-center gap-2">
              <Toggle variant="outline" aria-label="Toggle small" size="sm">
                Small
              </Toggle>
              <Toggle variant="outline" aria-label="Toggle default" size="default">
                Default
              </Toggle>
              <Toggle variant="outline" aria-label="Toggle large" size="lg">
                Large
              </Toggle>
            </div>
          </div>
        </div>

        <div className="space-y-4 md:col-span-2">
          <h2 className="scroll-m-20 border-b pb-2 text-2xl font-semibold tracking-tight transition-colors first:mt-0 text-foreground">
            Disabled
          </h2>
          <div className="rounded-xl border border-border/40 bg-card p-6 shadow-sm flex items-center justify-center min-h-[150px]">
            <div className="flex flex-wrap items-center gap-2">
              <Toggle aria-label="Toggle disabled" disabled>
                Disabled
              </Toggle>
              <Toggle variant="outline" aria-label="Toggle disabled outline" disabled>
                Disabled
              </Toggle>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
