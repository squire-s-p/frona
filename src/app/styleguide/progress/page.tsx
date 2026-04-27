"use client";

import * as React from "react";
import { Progress } from "@/components/ui/progress";
import { Slider } from "@/components/ui/slider";
import { Field, FieldLabel } from "@/components/ui/field";

function ProgressDemo() {
  const [progress, setProgress] = React.useState(13);

  React.useEffect(() => {
    const timer = setTimeout(() => setProgress(66), 500);
    return () => clearTimeout(timer);
  }, []);

  return <Progress value={progress} className="w-[60%]" />;
}

export default function ProgressPage() {
  const [value, setValue] = React.useState([50]);

  return (
    <div className="space-y-10 pr-10 pb-20">
      <div className="space-y-4">
        <h1 className="scroll-m-20 text-4xl font-bold tracking-tight lg:text-5xl text-foreground">
          Progress
        </h1>
        <p className="text-lg text-muted-foreground">
          Displays an indicator showing the completion progress of a task, typically displayed as a progress bar.
        </p>
      </div>

      <div className="space-y-4">
        <h2 className="scroll-m-20 border-b pb-2 text-3xl font-semibold tracking-tight transition-colors first:mt-0 text-foreground">
          Basic
        </h2>
        <div className="rounded-xl border border-border/40 bg-card p-6 shadow-sm flex items-center justify-center min-h-[150px]">
          <ProgressDemo />
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="scroll-m-20 border-b pb-2 text-3xl font-semibold tracking-tight transition-colors first:mt-0 text-foreground">
          With Label
        </h2>
        <div className="rounded-xl border border-border/40 bg-card p-6 shadow-sm flex items-center justify-center min-h-[150px]">
          <Field className="w-full max-w-sm">
            <FieldLabel htmlFor="progress-upload" className="flex">
              <span>Upload progress</span>
              <span className="ml-auto">66%</span>
            </FieldLabel>
            <Progress value={66} id="progress-upload" />
          </Field>
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="scroll-m-20 border-b pb-2 text-3xl font-semibold tracking-tight transition-colors first:mt-0 text-foreground">
          Controlled
        </h2>
        <div className="rounded-xl border border-border/40 bg-card p-6 shadow-sm flex items-center justify-center min-h-[150px]">
          <div className="flex w-full max-w-sm flex-col gap-4">
            <Progress value={value[0]} />
            <Slider
              value={value}
              onValueChange={setValue}
              min={0}
              max={100}
              step={1}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
