"use client";

import * as React from "react";
import { Separator } from "@/components/ui/separator";

export default function SeparatorPage() {
  return (
    <div className="space-y-10 pr-10 pb-20">
      <div className="space-y-4">
        <h1 className="scroll-m-20 text-4xl font-bold tracking-tight lg:text-5xl text-foreground">
          Separator
        </h1>
        <p className="text-lg text-muted-foreground">
          Visually or semantically separates content.
        </p>
      </div>

      <div className="space-y-4">
        <h2 className="scroll-m-20 border-b pb-2 text-3xl font-semibold tracking-tight transition-colors first:mt-0 text-foreground">
          Basic
        </h2>
        <div className="rounded-xl border border-border/40 bg-card p-6 shadow-sm flex items-center justify-center min-h-[200px]">
          <div className="flex max-w-sm flex-col gap-4 text-sm w-full">
            <div className="flex flex-col gap-1.5">
              <div className="leading-none font-medium">shadcn/ui</div>
              <div className="text-muted-foreground">
                The Foundation for your Design System
              </div>
            </div>
            <Separator />
            <div>
              A set of beautifully designed components that you can customize, extend,
              and build on.
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="scroll-m-20 border-b pb-2 text-3xl font-semibold tracking-tight transition-colors first:mt-0 text-foreground">
          Vertical
        </h2>
        <div className="rounded-xl border border-border/40 bg-card p-6 shadow-sm flex items-center justify-center min-h-[150px]">
          <div className="flex h-5 items-center gap-4 text-sm">
            <div>Blog</div>
            <Separator orientation="vertical" />
            <div>Docs</div>
            <Separator orientation="vertical" />
            <div>Source</div>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="scroll-m-20 border-b pb-2 text-3xl font-semibold tracking-tight transition-colors first:mt-0 text-foreground">
          Menu Example
        </h2>
        <div className="rounded-xl border border-border/40 bg-card p-6 shadow-sm flex items-center justify-center min-h-[150px]">
          <div className="flex items-center gap-4 text-sm h-12">
            <div className="flex flex-col gap-1">
              <span className="font-medium">Settings</span>
              <span className="text-xs text-muted-foreground">
                Manage preferences
              </span>
            </div>
            <Separator orientation="vertical" />
            <div className="flex flex-col gap-1">
              <span className="font-medium">Account</span>
              <span className="text-xs text-muted-foreground">
                Profile & security
              </span>
            </div>
            <Separator orientation="vertical" className="hidden sm:block" />
            <div className="hidden flex-col gap-1 sm:flex">
              <span className="font-medium">Help</span>
              <span className="text-xs text-muted-foreground">Support & docs</span>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="scroll-m-20 border-b pb-2 text-3xl font-semibold tracking-tight transition-colors first:mt-0 text-foreground">
          List Example
        </h2>
        <div className="rounded-xl border border-border/40 bg-card p-6 shadow-sm flex items-center justify-center min-h-[200px]">
          <div className="flex w-full max-w-sm flex-col gap-2 text-sm">
            <dl className="flex items-center justify-between">
              <dt>Item 1</dt>
              <dd className="text-muted-foreground">Value 1</dd>
            </dl>
            <Separator />
            <dl className="flex items-center justify-between">
              <dt>Item 2</dt>
              <dd className="text-muted-foreground">Value 2</dd>
            </dl>
            <Separator />
            <dl className="flex items-center justify-between">
              <dt>Item 3</dt>
              <dd className="text-muted-foreground">Value 3</dd>
            </dl>
          </div>
        </div>
      </div>
    </div>
  );
}
