"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from "@/components/ui/popover";

export default function PopoverPage() {
  return (
    <div className="space-y-10 pr-10 pb-20">
      <div className="space-y-4">
        <h1 className="scroll-m-20 text-4xl font-extrabold tracking-tight lg:text-5xl text-foreground">
          Popover
        </h1>
        <p className="text-lg text-muted-foreground">
          Displays rich content in a portal, triggered by a button.
        </p>
      </div>

      <div className="space-y-4">
        <h2 className="scroll-m-20 border-b pb-2 text-3xl font-semibold tracking-tight transition-colors first:mt-0 text-foreground">
          Basic
        </h2>
        <div className="rounded-xl border border-border/40 bg-card p-6 shadow-sm flex items-center justify-center min-h-[300px]">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline">Open Popover</Button>
            </PopoverTrigger>
            <PopoverContent align="start">
              <PopoverHeader>
                <PopoverTitle>Dimensions</PopoverTitle>
                <PopoverDescription>
                  Set the dimensions for the layer.
                </PopoverDescription>
              </PopoverHeader>
            </PopoverContent>
          </Popover>
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="scroll-m-20 border-b pb-2 text-3xl font-semibold tracking-tight transition-colors first:mt-0 text-foreground">
          Alignments
        </h2>
        <div className="rounded-xl border border-border/40 bg-card p-6 shadow-sm flex items-center justify-center min-h-[300px]">
          <div className="flex gap-6">
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm">
                  Start
                </Button>
              </PopoverTrigger>
              <PopoverContent align="start" className="w-40">
                Aligned to start
              </PopoverContent>
            </Popover>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm">
                  Center
                </Button>
              </PopoverTrigger>
              <PopoverContent align="center" className="w-40">
                Aligned to center
              </PopoverContent>
            </Popover>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm">
                  End
                </Button>
              </PopoverTrigger>
              <PopoverContent align="end" className="w-40">
                Aligned to end
              </PopoverContent>
            </Popover>
          </div>
        </div>
      </div>
    </div>
  );
}
