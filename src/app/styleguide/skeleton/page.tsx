"use client";

import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

function SkeletonDemo() {
  return (
    <div className="flex items-center gap-4">
      <Skeleton className="h-12 w-12 rounded-full" />
      <div className="space-y-2">
        <Skeleton className="h-4 w-[250px]" />
        <Skeleton className="h-4 w-[200px]" />
      </div>
    </div>
  );
}

function SkeletonAvatar() {
  return (
    <div className="flex w-fit items-center gap-4">
      <Skeleton className="size-10 shrink-0 rounded-full" />
      <div className="grid gap-2">
        <Skeleton className="h-4 w-[150px]" />
        <Skeleton className="h-4 w-[100px]" />
      </div>
    </div>
  );
}

function SkeletonCard() {
  return (
    <Card className="w-full max-w-xs">
      <CardHeader className="gap-2">
        <Skeleton className="h-4 w-2/3" />
        <Skeleton className="h-4 w-1/2" />
      </CardHeader>
      <CardContent>
        <Skeleton className="aspect-video w-full rounded-md" />
      </CardContent>
    </Card>
  );
}

function SkeletonText() {
  return (
    <div className="flex w-full max-w-xs flex-col gap-2">
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-3/4" />
    </div>
  );
}

function SkeletonForm() {
  return (
    <div className="flex w-full max-w-xs flex-col gap-7">
      <div className="flex flex-col gap-3">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-8 w-full rounded-md" />
      </div>
      <div className="flex flex-col gap-3">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-8 w-full rounded-md" />
      </div>
      <Skeleton className="h-9 w-24 rounded-md" />
    </div>
  );
}

function SkeletonTable() {
  return (
    <div className="flex w-full max-w-sm flex-col gap-4 border rounded-md p-4">
      {Array.from({ length: 5 }).map((_, index) => (
        <div className="flex gap-4 items-center" key={index}>
          <Skeleton className="h-4 flex-1" />
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-4 w-12" />
        </div>
      ))}
    </div>
  );
}

export default function SkeletonPage() {
  return (
    <div className="space-y-10 pr-10 pb-20">
      <div className="space-y-4">
        <h1 className="scroll-m-20 text-4xl font-extrabold tracking-tight lg:text-5xl text-foreground">
          Skeleton
        </h1>
        <p className="text-lg text-muted-foreground">
          Use to show a placeholder while content is loading.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
        <section className="space-y-4">
          <h2 className="text-2xl font-bold">Demo</h2>
          <SkeletonDemo />
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-bold">Avatar Loading</h2>
          <SkeletonAvatar />
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-bold">Card Loading</h2>
          <SkeletonCard />
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-bold">Text Block</h2>
          <SkeletonText />
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-bold">Form Elements</h2>
          <SkeletonForm />
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-bold">Table Rows</h2>
          <SkeletonTable />
        </section>
      </div>
    </div>
  );
}
