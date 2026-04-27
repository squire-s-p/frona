"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";

const HOVER_CARD_SIDES = ["left", "top", "bottom", "right"] as const;

export default function HoverCardPage() {
  return (
    <div className="space-y-10 pr-10 pb-20">
      <div className="space-y-4">
        <h1 className="scroll-m-20 text-4xl font-bold tracking-tight lg:text-5xl text-foreground">
          Hover Card
        </h1>
        <p className="text-lg text-muted-foreground">
          For sighted users to preview content available behind a link.
        </p>
      </div>

      <div className="space-y-4">
        <h2 className="scroll-m-20 border-b pb-2 text-3xl font-semibold tracking-tight transition-colors first:mt-0 text-foreground">
          Basic
        </h2>
        <div className="rounded-xl border border-border/40 bg-card p-6 shadow-sm flex items-center justify-center min-h-[300px]">
          <HoverCard openDelay={10} closeDelay={100}>
            <HoverCardTrigger asChild>
              <Button variant="link">Hover Here</Button>
            </HoverCardTrigger>
            <HoverCardContent className="flex w-64 flex-col gap-0.5">
              <div className="font-semibold">@nextjs</div>
              <div>The React Framework – created and maintained by @vercel.</div>
              <div className="mt-1 text-xs text-muted-foreground">
                Joined December 2021
              </div>
            </HoverCardContent>
          </HoverCard>
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="scroll-m-20 border-b pb-2 text-3xl font-semibold tracking-tight transition-colors first:mt-0 text-foreground">
          Sides
        </h2>
        <div className="rounded-xl border border-border/40 bg-card p-6 shadow-sm flex items-center justify-center min-h-[300px]">
          <div className="flex flex-wrap justify-center gap-2">
            {HOVER_CARD_SIDES.map((side) => (
              <HoverCard key={side} openDelay={100} closeDelay={100}>
                <HoverCardTrigger asChild>
                  <Button variant="outline" className="capitalize">
                    {side}
                  </Button>
                </HoverCardTrigger>
                <HoverCardContent side={side}>
                  <div className="flex flex-col gap-1">
                    <h4 className="font-medium">Hover Card</h4>
                    <p>This hover card appears on the {side} side of the trigger.</p>
                  </div>
                </HoverCardContent>
              </HoverCard>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
