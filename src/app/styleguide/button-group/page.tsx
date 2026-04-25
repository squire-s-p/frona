"use client";

import * as React from "react";
import {
  ArchiveIcon,
  ArrowLeftIcon,
  CalendarPlusIcon,
  ClockIcon,
  ListFilterIcon,
  MailCheckIcon,
  MoreHorizontalIcon,
  TagIcon,
  Trash2Icon,
  MinusIcon,
  PlusIcon,
} from "lucide-react";

import { Button } from "@/components/ui/button";

export default function ButtonGroupPage() {
  const [label, setLabel] = React.useState("personal");

  return (
    <div className="space-y-10 pr-10 pb-20">
      <div className="space-y-4">
        <h1 className="scroll-m-20 text-4xl font-extrabold tracking-tight lg:text-5xl text-foreground">
          Button Group
        </h1>
        <p className="text-lg text-muted-foreground">
          Group a series of buttons together on a single line or stack them in a vertical column.
        </p>
        <p className="text-sm text-yellow-500 font-medium">
          Note: Shadcn UI doesn't have a native button-group. Here we use standard tailwind classes `flex -space-x-px` combined with border radius manipulation.
        </p>
      </div>

      <div className="space-y-4">
        <h2 className="scroll-m-20 border-b pb-2 text-3xl font-semibold tracking-tight transition-colors first:mt-0 text-foreground">
          Basic Example
        </h2>
        <div className="rounded-xl border border-border/40 bg-card p-6 shadow-sm flex items-center justify-center">
          <div className="flex -space-x-px">
            <Button variant="outline" className="rounded-r-none focus:z-10">Archive</Button>
            <Button variant="outline" className="rounded-l-none focus:z-10">Report</Button>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="scroll-m-20 border-b pb-2 text-3xl font-semibold tracking-tight transition-colors first:mt-0 text-foreground">
          Orientation Vertical
        </h2>
        <div className="rounded-xl border border-border/40 bg-card p-6 shadow-sm flex items-center justify-center">
          <div className="flex flex-col -space-y-px h-fit">
            <Button variant="outline" size="icon" className="rounded-b-none focus:z-10">
              <PlusIcon className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" className="rounded-t-none focus:z-10">
              <MinusIcon className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
