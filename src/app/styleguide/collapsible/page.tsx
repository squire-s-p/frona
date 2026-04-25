"use client";

import * as React from "react";
import { ChevronsUpDown, ChevronDownIcon, MaximizeIcon, MinimizeIcon, ChevronRightIcon, FileIcon, FolderIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

function CollapsibleDemo() {
  const [isOpen, setIsOpen] = React.useState(false);

  return (
    <Collapsible
      open={isOpen}
      onOpenChange={setIsOpen}
      className="flex w-[350px] flex-col gap-2 mx-auto"
    >
      <div className="flex items-center justify-between gap-4 px-4 border rounded-md py-2 bg-muted/50">
        <h4 className="text-sm font-semibold text-foreground">Order #4189</h4>
        <CollapsibleTrigger asChild>
          <Button variant="ghost" size="icon" className="size-8">
            <ChevronsUpDown className="size-4" />
            <span className="sr-only">Toggle details</span>
          </Button>
        </CollapsibleTrigger>
      </div>
      <div className="flex items-center justify-between rounded-md border px-4 py-2 text-sm bg-card">
        <span className="text-muted-foreground">Status</span>
        <span className="font-medium">Shipped</span>
      </div>
      <CollapsibleContent className="flex flex-col gap-2 overflow-hidden data-[state=open]:animate-collapsible-down data-[state=closed]:animate-collapsible-up">
        <div className="rounded-md border px-4 py-2 text-sm bg-card">
          <p className="font-medium text-foreground">Shipping address</p>
          <p className="text-muted-foreground text-xs">100 Market St, San Francisco</p>
        </div>
        <div className="rounded-md border px-4 py-2 text-sm bg-card">
          <p className="font-medium text-foreground">Items</p>
          <p className="text-muted-foreground text-xs">2x Studio Headphones</p>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}

function CollapsibleBasic() {
  return (
    <Card className="mx-auto w-full max-w-sm">
      <CardContent className="pt-6">
        <Collapsible className="rounded-md data-[state=open]:bg-muted/50 transition-colors">
          <CollapsibleTrigger asChild>
            <Button variant="ghost" className="group w-full justify-between">
              Product details
              <ChevronDownIcon className="ml-auto size-4 transition-transform group-data-[state=open]:rotate-180" />
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="flex flex-col items-start gap-2 p-4 pt-0 text-sm">
            <div className="text-muted-foreground">
              This panel can be expanded or collapsed to reveal additional
              content.
            </div>
            <Button size="xs">Learn More</Button>
          </CollapsibleContent>
        </Collapsible>
      </CardContent>
    </Card>
  );
}

function CollapsibleSettings() {
  const [isOpen, setIsOpen] = React.useState(false);

  return (
    <Card className="mx-auto w-full max-w-xs" size="sm">
      <CardHeader>
        <CardTitle>Radius</CardTitle>
        <CardDescription>Set the corner radius of the element.</CardDescription>
      </CardHeader>
      <CardContent>
        <Collapsible
          open={isOpen}
          onOpenChange={setIsOpen}
          className="flex items-start gap-2"
        >
          <FieldGroup className="grid w-full grid-cols-2 gap-2">
            <Field>
              <FieldLabel htmlFor="radius-x" className="sr-only">
                Radius X
              </FieldLabel>
              <Input id="radius-x" placeholder="0" defaultValue={0} />
            </Field>
            <Field>
              <FieldLabel htmlFor="radius-y" className="sr-only">
                Radius Y
              </FieldLabel>
              <Input id="radius-y" placeholder="0" defaultValue={0} />
            </Field>
            <CollapsibleContent className="col-span-full grid grid-cols-subgrid gap-2 overflow-hidden">
              <Field>
                <FieldLabel htmlFor="radius-x2" className="sr-only">
                  Radius X2
                </FieldLabel>
                <Input id="radius-x2" placeholder="0" defaultValue={0} />
              </Field>
              <Field>
                <FieldLabel htmlFor="radius-y2" className="sr-only">
                  Radius Y2
                </FieldLabel>
                <Input id="radius-y2" placeholder="0" defaultValue={0} />
              </Field>
            </CollapsibleContent>
          </FieldGroup>
          <CollapsibleTrigger asChild>
            <Button variant="outline" size="icon" className="shrink-0">
              {isOpen ? <MinimizeIcon className="size-4" /> : <MaximizeIcon className="size-4" />}
            </Button>
          </CollapsibleTrigger>
        </Collapsible>
      </CardContent>
    </Card>
  );
}

type FileTreeItem = { name: string } | { name: string; items: FileTreeItem[] };

function CollapsibleFileTree() {
  const fileTree: FileTreeItem[] = [
    {
      name: "components",
      items: [
        {
          name: "ui",
          items: [
            { name: "button.tsx" },
            { name: "card.tsx" },
            { name: "dialog.tsx" },
          ],
        },
        { name: "login-form.tsx" },
      ],
    },
    {
      name: "lib",
      items: [{ name: "utils.ts" }],
    },
    { name: "app.tsx" },
    { name: "README.md" },
  ];

  const renderItem = (fileItem: FileTreeItem) => {
    if ("items" in fileItem) {
      return (
        <Collapsible key={fileItem.name}>
          <CollapsibleTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="group w-full justify-start transition-none hover:bg-accent hover:text-accent-foreground gap-2"
            >
              <ChevronRightIcon className="size-4 transition-transform group-data-[state=open]:rotate-90" />
              <FolderIcon className="size-4 text-muted-foreground" />
              {fileItem.name}
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="mt-1 ml-5 border-l pl-2">
            <div className="flex flex-col gap-1">
              {fileItem.items.map((child) => renderItem(child))}
            </div>
          </CollapsibleContent>
        </Collapsible>
      );
    }
    return (
      <Button
        key={fileItem.name}
        variant="ghost"
        size="sm"
        className="w-full justify-start gap-2 text-foreground/80 pl-9"
      >
        <FileIcon className="size-4 text-muted-foreground" />
        <span>{fileItem.name}</span>
      </Button>
    );
  };

  return (
    <Card className="mx-auto w-full max-w-[16rem] gap-2" size="sm">
      <CardHeader className="pb-2">
        <Tabs defaultValue="explorer">
          <TabsList className="w-full">
            <TabsTrigger value="explorer" className="flex-1">Explorer</TabsTrigger>
            <TabsTrigger value="settings" className="flex-1 text-xs">Outline</TabsTrigger>
          </TabsList>
        </Tabs>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-1">
          {fileTree.map((item) => renderItem(item))}
        </div>
      </CardContent>
    </Card>
  );
}

export default function CollapsiblePage() {
  return (
    <div className="space-y-10 pr-10 pb-20">
      <div className="space-y-4">
        <h1 className="scroll-m-20 text-4xl font-extrabold tracking-tight lg:text-5xl text-foreground">
          Collapsible
        </h1>
        <p className="text-lg text-muted-foreground">
          An interactive component which expands/collapses a panel.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
        <section className="space-y-4">
          <h2 className="text-2xl font-bold">Demo</h2>
          <CollapsibleDemo />
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-bold">Basic Usage</h2>
          <CollapsibleBasic />
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-bold">Settings Panel</h2>
          <CollapsibleSettings />
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-bold">File Tree</h2>
          <CollapsibleFileTree />
        </section>
      </div>
    </div>
  );
}
