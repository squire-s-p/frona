"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

function SheetDemo() {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline">Open Sheet (Default)</Button>
      </SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Edit profile</SheetTitle>
          <SheetDescription>
            Make changes to your profile here. Click save when you&apos;re done.
          </SheetDescription>
        </SheetHeader>
        <div className="grid flex-1 auto-rows-min gap-6 px-4 py-6">
          <div className="grid gap-3">
            <Label htmlFor="sheet-demo-name">Name</Label>
            <Input id="sheet-demo-name" defaultValue="Pedro Duarte" />
          </div>
          <div className="grid gap-3">
            <Label htmlFor="sheet-demo-username">Username</Label>
            <Input id="sheet-demo-username" defaultValue="@peduarte" />
          </div>
        </div>
        <SheetFooter>
          <Button type="submit">Save changes</Button>
          <SheetClose asChild>
            <Button variant="outline">Close</Button>
          </SheetClose>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

const SHEET_SIDES = ["top", "right", "bottom", "left"] as const;

function SheetSide() {
  return (
    <div className="flex flex-wrap gap-2">
      {SHEET_SIDES.map((side) => (
        <Sheet key={side}>
          <SheetTrigger asChild>
            <Button variant="outline" className="capitalize">
              {side}
            </Button>
          </SheetTrigger>
          <SheetContent
            side={side}
            className="data-[side=bottom]:max-h-[50vh] data-[side=top]:max-h-[50vh]"
          >
            <SheetHeader>
              <SheetTitle>Sheet Side: {side}</SheetTitle>
              <SheetDescription>
                This sheet is positioned on the {side} of the screen.
              </SheetDescription>
            </SheetHeader>
            <div className="overflow-y-auto px-4 py-6 scrollbar-hide text-sm text-muted-foreground">
              {Array.from({ length: 5 }).map((_, index) => (
                <p key={index} className="mb-2">
                  Lorem ipsum dolor sit amet, consectetur adipiscing elit.
                </p>
              ))}
            </div>
            <SheetFooter>
              <Button type="submit">Action</Button>
              <SheetClose asChild>
                <Button variant="outline">Cancel</Button>
              </SheetClose>
            </SheetFooter>
          </SheetContent>
        </Sheet>
      ))}
    </div>
  );
}

function SheetNoCloseButton() {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline">Open Sheet (No Close Button)</Button>
      </SheetTrigger>
      <SheetContent showCloseButton={false}>
        <SheetHeader>
          <SheetTitle>No Close Button</SheetTitle>
          <SheetDescription>
            This sheet doesn&apos;t have a close button in the top-right corner.
            Click outside to close.
          </SheetDescription>
        </SheetHeader>
        <div className="p-4 text-sm text-muted-foreground">
          Custom content goes here.
        </div>
      </SheetContent>
    </Sheet>
  );
}

export default function SheetPage() {
  return (
    <div className="space-y-10 pr-10 pb-20">
      <div className="space-y-4">
        <h1 className="scroll-m-20 text-4xl font-extrabold tracking-tight lg:text-5xl text-foreground">
          Sheet
        </h1>
        <p className="text-lg text-muted-foreground">
          Extends the Dialog component to display content that complements the main content of the screen.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-10">
        <section className="space-y-4">
          <h2 className="text-2xl font-bold">Default</h2>
          <SheetDemo />
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-bold">Sides</h2>
          <SheetSide />
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-bold">No Close Button</h2>
          <SheetNoCloseButton />
        </section>
      </div>
    </div>
  );
}
