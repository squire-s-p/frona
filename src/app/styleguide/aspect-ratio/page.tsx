"use client";

import Image from "next/image";
import { AspectRatio } from "@/components/ui/aspect-ratio";

function AspectRatioDemo() {
  return (
    <div className="w-full max-w-sm">
      <AspectRatio ratio={16 / 9} className="rounded-lg bg-muted overflow-hidden">
        <Image
          src="https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80"
          alt="Photo"
          fill
          className="w-full rounded-lg object-cover grayscale dark:brightness-20"
        />
      </AspectRatio>
    </div>
  );
}

function AspectRatioSquare() {
  return (
    <div className="w-full max-w-[12rem]">
      <AspectRatio ratio={1 / 1} className="rounded-lg bg-muted overflow-hidden">
        <Image
          src="https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80"
          alt="Photo"
          fill
          className="rounded-lg object-cover grayscale dark:brightness-20"
        />
      </AspectRatio>
    </div>
  );
}

function AspectRatioPortrait() {
  return (
    <div className="w-full max-w-[10rem]">
      <AspectRatio ratio={9 / 16} className="rounded-lg bg-muted overflow-hidden">
        <Image
          src="https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80"
          alt="Photo"
          fill
          className="rounded-lg object-cover grayscale dark:brightness-20"
        />
      </AspectRatio>
    </div>
  );
}

export default function AspectRatioPage() {
  return (
    <div className="space-y-10 pr-10 pb-20">
      <div className="space-y-4">
        <h1 className="scroll-m-20 text-4xl font-extrabold tracking-tight lg:text-5xl text-foreground">
          Aspect Ratio
        </h1>
        <p className="text-lg text-muted-foreground">
          Displays content within a desired ratio.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
        <section className="space-y-4 md:col-span-2">
          <h2 className="text-2xl font-bold">16:9 (Landscape)</h2>
          <AspectRatioDemo />
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-bold">1:1 (Square)</h2>
          <AspectRatioSquare />
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-bold">9:16 (Portrait)</h2>
          <AspectRatioPortrait />
        </section>
      </div>
    </div>
  );
}
