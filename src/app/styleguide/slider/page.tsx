"use client";

import * as React from "react";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";

function SliderDemo() {
  return (
    <Slider
      defaultValue={[75]}
      max={100}
      step={1}
      className="mx-auto w-full max-w-xs"
    />
  );
}

function SliderRange() {
  return (
    <Slider
      defaultValue={[25, 50]}
      max={100}
      step={5}
      className="mx-auto w-full max-w-xs"
    />
  );
}

function SliderMultiple() {
  return (
    <Slider
      defaultValue={[10, 20, 70]}
      max={100}
      step={10}
      className="mx-auto w-full max-w-xs"
    />
  );
}

function SliderVertical() {
  return (
    <div className="mx-auto flex w-full max-w-xs items-center justify-center gap-10 py-6">
      <Slider
        defaultValue={[50]}
        max={100}
        step={1}
        orientation="vertical"
        className="h-40"
      />
      <Slider
        defaultValue={[25]}
        max={100}
        step={1}
        orientation="vertical"
        className="h-40"
      />
    </div>
  );
}

function SliderControlled() {
  const [value, setValue] = React.useState([0.3, 0.7]);

  return (
    <div className="mx-auto grid w-full max-w-xs gap-3">
      <div className="flex items-center justify-between gap-2">
        <Label htmlFor="slider-demo-temperature" className="text-foreground">Temperature</Label>
        <span className="text-sm font-mono text-muted-foreground">
          [{value.join(", ")}]
        </span>
      </div>
      <Slider
        id="slider-demo-temperature"
        value={value}
        onValueChange={setValue}
        min={0}
        max={1}
        step={0.1}
      />
    </div>
  );
}

function SliderDisabled() {
  return (
    <Slider
      defaultValue={[50]}
      max={100}
      step={1}
      disabled
      className="mx-auto w-full max-w-xs opacity-50"
    />
  );
}

export default function SliderPage() {
  return (
    <div className="space-y-10 pr-10 pb-20">
      <div className="space-y-4">
        <h1 className="scroll-m-20 text-4xl font-extrabold tracking-tight lg:text-5xl text-foreground">
          Slider
        </h1>
        <p className="text-lg text-muted-foreground">
          An input where the user selects a value from a given range.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
        <section className="space-y-4">
          <h2 className="text-2xl font-bold">Default</h2>
          <SliderDemo />
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-bold">Range</h2>
          <SliderRange />
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-bold">Multiple Thumbs</h2>
          <SliderMultiple />
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-bold">Vertical Orientation</h2>
          <SliderVertical />
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-bold">Controlled</h2>
          <SliderControlled />
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-bold">Disabled</h2>
          <SliderDisabled />
        </section>
      </div>
    </div>
  );
}
