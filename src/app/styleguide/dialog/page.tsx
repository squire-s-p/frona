"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

// Stubbing Field and FieldGroup for standard structure since they might be custom
function FieldGroup({ children }: { children: React.ReactNode }) {
  return <div className="grid gap-4 py-4">{children}</div>;
}
function Field({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-4 items-center gap-4">{children}</div>;
}

export default function DialogPage() {
  return (
    <div className="space-y-10 pr-10 pb-20">
      <div className="space-y-4">
        <h1 className="scroll-m-20 text-4xl font-extrabold tracking-tight lg:text-5xl text-foreground">
          Dialog
        </h1>
        <p className="text-lg text-muted-foreground">
          A window overlaid on either the primary window or another dialog window, rendering the content underneath inert.
        </p>
      </div>

      <div className="space-y-4">
        <h2 className="scroll-m-20 border-b pb-2 text-3xl font-semibold tracking-tight transition-colors first:mt-0 text-foreground">
          Basic Form
        </h2>
        <div className="rounded-xl border border-border/40 bg-card p-6 shadow-sm flex items-center justify-center min-h-[150px]">
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline">Open Dialog</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <form>
                <DialogHeader>
                  <DialogTitle>Edit profile</DialogTitle>
                  <DialogDescription>
                    Make changes to your profile here. Click save when you're done.
                  </DialogDescription>
                </DialogHeader>
                <FieldGroup>
                  <Field>
                    <Label htmlFor="name" className="text-right">Name</Label>
                    <Input id="name" defaultValue="Pedro Duarte" className="col-span-3" />
                  </Field>
                  <Field>
                    <Label htmlFor="username" className="text-right">Username</Label>
                    <Input id="username" defaultValue="@peduarte" className="col-span-3" />
                  </Field>
                </FieldGroup>
                <DialogFooter>
                  <DialogClose asChild>
                    <Button type="button" variant="outline">Cancel</Button>
                  </DialogClose>
                  <Button type="submit">Save changes</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="scroll-m-20 border-b pb-2 text-3xl font-semibold tracking-tight transition-colors first:mt-0 text-foreground">
          Custom Close Button
        </h2>
        <div className="rounded-xl border border-border/40 bg-card p-6 shadow-sm flex items-center justify-center min-h-[150px]">
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline">Share</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Share link</DialogTitle>
                <DialogDescription>
                  Anyone who has this link will be able to view this.
                </DialogDescription>
              </DialogHeader>
              <div className="flex items-center space-x-2 py-4">
                <div className="grid flex-1 gap-2">
                  <Label htmlFor="link" className="sr-only">
                    Link
                  </Label>
                  <Input
                    id="link"
                    defaultValue="https://ui.shadcn.com/docs/installation"
                    readOnly
                  />
                </div>
              </div>
              <DialogFooter className="sm:justify-start">
                <DialogClose asChild>
                  <Button type="button" variant="secondary">
                    Close
                  </Button>
                </DialogClose>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="scroll-m-20 border-b pb-2 text-3xl font-semibold tracking-tight transition-colors first:mt-0 text-foreground">
          No Close Button (Top Right)
        </h2>
        <div className="rounded-xl border border-border/40 bg-card p-6 shadow-sm flex items-center justify-center min-h-[150px]">
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline">No Close Button</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md [&>button:last-child]:hidden">
              <DialogHeader>
                <DialogTitle>No Close Button</DialogTitle>
                <DialogDescription>
                  This dialog doesn't have a close button in the top-right corner.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <DialogClose asChild>
                  <Button type="button">Close Dialog Manually</Button>
                </DialogClose>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="scroll-m-20 border-b pb-2 text-3xl font-semibold tracking-tight transition-colors first:mt-0 text-foreground">
          Scrollable Content & Sticky Footer
        </h2>
        <div className="rounded-xl border border-border/40 bg-card p-6 shadow-sm flex flex-col sm:flex-row items-center justify-center gap-4 min-h-[150px]">
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline">Scrollable Content</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Scrollable Content</DialogTitle>
                <DialogDescription>
                  This is a dialog with scrollable content.
                </DialogDescription>
              </DialogHeader>
              <div className="no-scrollbar max-h-[40vh] overflow-y-auto px-1 py-4">
                {Array.from({ length: 10 }).map((_, index) => (
                  <p key={index} className="mb-4 text-sm text-muted-foreground leading-normal">
                    Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do
                    eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut
                    enim ad minim veniam, quis nostrud exercitation ullamco laboris
                    nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in
                    reprehenderit in voluptate velit esse cillum dolore eu fugiat
                    nulla pariatur.
                  </p>
                ))}
              </div>
            </DialogContent>
          </Dialog>

          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline">Sticky Footer</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md flex flex-col gap-0 p-0">
              <DialogHeader className="p-6 pb-2">
                <DialogTitle>Sticky Footer</DialogTitle>
                <DialogDescription>
                  This dialog has a sticky footer that stays visible while the content
                  scrolls.
                </DialogDescription>
              </DialogHeader>
              <div className="no-scrollbar max-h-[40vh] overflow-y-auto px-6 py-4">
                {Array.from({ length: 10 }).map((_, index) => (
                  <p key={index} className="mb-4 text-sm text-muted-foreground leading-normal">
                    Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do
                    eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut
                    enim ad minim veniam, quis nostrud exercitation ullamco laboris
                    nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in
                    reprehenderit in voluptate velit esse cillum dolore eu fugiat
                    nulla pariatur.
                  </p>
                ))}
              </div>
              <DialogFooter className="p-6 pt-2 border-t bg-background sticky bottom-0">
                <DialogClose asChild>
                  <Button variant="outline">Close</Button>
                </DialogClose>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </div>
  );
}
