"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { Badge } from "@/components/ui/badge";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";

export default function SpinnerPage() {
  return (
    <div className="space-y-10 pr-10 pb-20">
      <div className="space-y-4">
        <h1 className="scroll-m-20 text-4xl font-bold tracking-tight lg:text-5xl text-foreground">
          Spinner
        </h1>
        <p className="text-lg text-muted-foreground">
          Displays an animated spinner indicating a loading state.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <h2 className="scroll-m-20 border-b pb-2 text-2xl font-semibold tracking-tight transition-colors first:mt-0 text-foreground">
            Sizes
          </h2>
          <div className="rounded-xl border border-border/40 bg-card p-6 shadow-sm flex items-center justify-center min-h-[150px]">
            <div className="flex items-center gap-6">
              <Spinner className="size-3" />
              <Spinner className="size-4" />
              <Spinner className="size-6" />
              <Spinner className="size-8" />
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <h2 className="scroll-m-20 border-b pb-2 text-2xl font-semibold tracking-tight transition-colors first:mt-0 text-foreground">
            In Buttons
          </h2>
          <div className="rounded-xl border border-border/40 bg-card p-6 shadow-sm flex items-center justify-center min-h-[150px]">
            <div className="flex flex-col items-center gap-4">
              <Button disabled size="sm">
                <Spinner data-icon="inline-start" className="mr-2" />
                Loading...
              </Button>
              <Button variant="outline" disabled size="sm">
                <Spinner data-icon="inline-start" className="mr-2" />
                Please wait
              </Button>
              <Button variant="secondary" disabled size="sm">
                <Spinner data-icon="inline-start" className="mr-2" />
                Processing
              </Button>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <h2 className="scroll-m-20 border-b pb-2 text-2xl font-semibold tracking-tight transition-colors first:mt-0 text-foreground">
            In Badges
          </h2>
          <div className="rounded-xl border border-border/40 bg-card p-6 shadow-sm flex items-center justify-center min-h-[150px]">
            <div className="flex items-center gap-4 [--radius:1.2rem]">
              <Badge>
                <Spinner data-icon="inline-start" className="mr-1.5 size-3" />
                Syncing
              </Badge>
              <Badge variant="secondary">
                <Spinner data-icon="inline-start" className="mr-1.5 size-3" />
                Updating
              </Badge>
              <Badge variant="outline">
                <Spinner data-icon="inline-start" className="mr-1.5 size-3" />
                Processing
              </Badge>
            </div>
          </div>
        </div>

        <div className="space-y-4 md:col-span-2">
          <h2 className="scroll-m-20 border-b pb-2 text-2xl font-semibold tracking-tight transition-colors first:mt-0 text-foreground">
            Empty State
          </h2>
          <div className="rounded-xl border border-border/40 bg-card p-6 shadow-sm flex items-center justify-center min-h-[300px]">
            <Empty className="w-full">
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <Spinner />
                </EmptyMedia>
                <EmptyTitle>Processing your request</EmptyTitle>
                <EmptyDescription>
                  Please wait while we process your request. Do not refresh the page.
                </EmptyDescription>
              </EmptyHeader>
              <EmptyContent>
                <Button variant="outline" size="sm">
                  Cancel
                </Button>
              </EmptyContent>
            </Empty>
          </div>
        </div>
      </div>
    </div>
  );
}
