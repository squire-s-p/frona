"use client";

import * as React from "react";
import {
  CalculatorIcon,
  CalendarIcon,
  CreditCardIcon,
  SettingsIcon,
  SmileIcon,
  UserIcon,
  BellIcon,
  ClipboardPasteIcon,
  CodeIcon,
  CopyIcon,
  FileTextIcon,
  FolderIcon,
  FolderPlusIcon,
  HelpCircleIcon,
  HomeIcon,
  ImageIcon,
  InboxIcon,
  LayoutGridIcon,
  ListIcon,
  PlusIcon,
  ScissorsIcon,
  TrashIcon,
  ZoomInIcon,
  ZoomOutIcon,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "@/components/ui/command";

export default function CommandPage() {
  const [openBasic, setOpenBasic] = React.useState(false);
  const [openGroups, setOpenGroups] = React.useState(false);
  const [openMany, setOpenMany] = React.useState(false);

  return (
    <div className="space-y-10 pr-10 pb-20">
      <div className="space-y-4">
        <h1 className="scroll-m-20 text-4xl font-bold tracking-tight lg:text-5xl text-foreground">
          Command
        </h1>
        <p className="text-lg text-muted-foreground">
          Fast, composable, unstyled command menu for React.
        </p>
      </div>

      <div className="space-y-4">
        <h2 className="scroll-m-20 border-b pb-2 text-3xl font-semibold tracking-tight transition-colors first:mt-0 text-foreground">
          Basic
        </h2>
        <div className="rounded-xl border border-border/40 bg-card p-6 shadow-sm flex flex-col items-center justify-center min-h-[150px]">
          <Button onClick={() => setOpenBasic(true)} variant="outline" className="w-fit">
            Open Menu
          </Button>
          <CommandDialog open={openBasic} onOpenChange={setOpenBasic}>
            <Command>
              <CommandInput placeholder="Type a command or search..." />
              <CommandList>
                <CommandEmpty>No results found.</CommandEmpty>
                <CommandGroup heading="Suggestions">
                  <CommandItem>Calendar</CommandItem>
                  <CommandItem>Search Emoji</CommandItem>
                  <CommandItem>Calculator</CommandItem>
                </CommandGroup>
              </CommandList>
            </Command>
          </CommandDialog>
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="scroll-m-20 border-b pb-2 text-3xl font-semibold tracking-tight transition-colors first:mt-0 text-foreground">
          With Groups
        </h2>
        <div className="rounded-xl border border-border/40 bg-card p-6 shadow-sm flex flex-col items-center justify-center min-h-[150px]">
          <Button onClick={() => setOpenGroups(true)} variant="outline" className="w-fit">
            Open Menu
          </Button>
          <CommandDialog open={openGroups} onOpenChange={setOpenGroups}>
            <Command>
              <CommandInput placeholder="Type a command or search..." />
              <CommandList>
                <CommandEmpty>No results found.</CommandEmpty>
                <CommandGroup heading="Suggestions">
                  <CommandItem>
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    <span>Calendar</span>
                  </CommandItem>
                  <CommandItem>
                    <SmileIcon className="mr-2 h-4 w-4" />
                    <span>Search Emoji</span>
                  </CommandItem>
                  <CommandItem>
                    <CalculatorIcon className="mr-2 h-4 w-4" />
                    <span>Calculator</span>
                  </CommandItem>
                </CommandGroup>
                <CommandSeparator />
                <CommandGroup heading="Settings">
                  <CommandItem>
                    <UserIcon className="mr-2 h-4 w-4" />
                    <span>Profile</span>
                    <CommandShortcut>⌘P</CommandShortcut>
                  </CommandItem>
                  <CommandItem>
                    <CreditCardIcon className="mr-2 h-4 w-4" />
                    <span>Billing</span>
                    <CommandShortcut>⌘B</CommandShortcut>
                  </CommandItem>
                  <CommandItem>
                    <SettingsIcon className="mr-2 h-4 w-4" />
                    <span>Settings</span>
                    <CommandShortcut>⌘S</CommandShortcut>
                  </CommandItem>
                </CommandGroup>
              </CommandList>
            </Command>
          </CommandDialog>
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="scroll-m-20 border-b pb-2 text-3xl font-semibold tracking-tight transition-colors first:mt-0 text-foreground">
          Scrollable (Many Items)
        </h2>
        <div className="rounded-xl border border-border/40 bg-card p-6 shadow-sm flex flex-col items-center justify-center min-h-[150px]">
          <Button onClick={() => setOpenMany(true)} variant="outline" className="w-fit">
            Open Menu
          </Button>
          <CommandDialog open={openMany} onOpenChange={setOpenMany}>
            <Command>
              <CommandInput placeholder="Type a command or search..." />
              <CommandList>
                <CommandEmpty>No results found.</CommandEmpty>
                <CommandGroup heading="Navigation">
                  <CommandItem>
                    <HomeIcon className="mr-2 h-4 w-4" />
                    <span>Home</span>
                    <CommandShortcut>⌘H</CommandShortcut>
                  </CommandItem>
                  <CommandItem>
                    <InboxIcon className="mr-2 h-4 w-4" />
                    <span>Inbox</span>
                    <CommandShortcut>⌘I</CommandShortcut>
                  </CommandItem>
                  <CommandItem>
                    <FileTextIcon className="mr-2 h-4 w-4" />
                    <span>Documents</span>
                    <CommandShortcut>⌘D</CommandShortcut>
                  </CommandItem>
                  <CommandItem>
                    <FolderIcon className="mr-2 h-4 w-4" />
                    <span>Folders</span>
                    <CommandShortcut>⌘F</CommandShortcut>
                  </CommandItem>
                </CommandGroup>
                <CommandSeparator />
                <CommandGroup heading="Actions">
                  <CommandItem>
                    <PlusIcon className="mr-2 h-4 w-4" />
                    <span>New File</span>
                    <CommandShortcut>⌘N</CommandShortcut>
                  </CommandItem>
                  <CommandItem>
                    <FolderPlusIcon className="mr-2 h-4 w-4" />
                    <span>New Folder</span>
                    <CommandShortcut>⇧⌘N</CommandShortcut>
                  </CommandItem>
                  <CommandItem>
                    <CopyIcon className="mr-2 h-4 w-4" />
                    <span>Copy</span>
                    <CommandShortcut>⌘C</CommandShortcut>
                  </CommandItem>
                  <CommandItem>
                    <ScissorsIcon className="mr-2 h-4 w-4" />
                    <span>Cut</span>
                    <CommandShortcut>⌘X</CommandShortcut>
                  </CommandItem>
                  <CommandItem>
                    <ClipboardPasteIcon className="mr-2 h-4 w-4" />
                    <span>Paste</span>
                    <CommandShortcut>⌘V</CommandShortcut>
                  </CommandItem>
                  <CommandItem>
                    <TrashIcon className="mr-2 h-4 w-4" />
                    <span>Delete</span>
                    <CommandShortcut>⌫</CommandShortcut>
                  </CommandItem>
                </CommandGroup>
                <CommandSeparator />
                <CommandGroup heading="View">
                  <CommandItem>
                    <LayoutGridIcon className="mr-2 h-4 w-4" />
                    <span>Grid View</span>
                  </CommandItem>
                  <CommandItem>
                    <ListIcon className="mr-2 h-4 w-4" />
                    <span>List View</span>
                  </CommandItem>
                  <CommandItem>
                    <ZoomInIcon className="mr-2 h-4 w-4" />
                    <span>Zoom In</span>
                    <CommandShortcut>⌘+</CommandShortcut>
                  </CommandItem>
                  <CommandItem>
                    <ZoomOutIcon className="mr-2 h-4 w-4" />
                    <span>Zoom Out</span>
                    <CommandShortcut>⌘-</CommandShortcut>
                  </CommandItem>
                </CommandGroup>
                <CommandSeparator />
                <CommandGroup heading="Account">
                  <CommandItem>
                    <UserIcon className="mr-2 h-4 w-4" />
                    <span>Profile</span>
                    <CommandShortcut>⌘P</CommandShortcut>
                  </CommandItem>
                  <CommandItem>
                    <CreditCardIcon className="mr-2 h-4 w-4" />
                    <span>Billing</span>
                    <CommandShortcut>⌘B</CommandShortcut>
                  </CommandItem>
                  <CommandItem>
                    <SettingsIcon className="mr-2 h-4 w-4" />
                    <span>Settings</span>
                    <CommandShortcut>⌘S</CommandShortcut>
                  </CommandItem>
                  <CommandItem>
                    <BellIcon className="mr-2 h-4 w-4" />
                    <span>Notifications</span>
                  </CommandItem>
                  <CommandItem>
                    <HelpCircleIcon className="mr-2 h-4 w-4" />
                    <span>Help & Support</span>
                  </CommandItem>
                </CommandGroup>
                <CommandSeparator />
                <CommandGroup heading="Tools">
                  <CommandItem>
                    <CalculatorIcon className="mr-2 h-4 w-4" />
                    <span>Calculator</span>
                  </CommandItem>
                  <CommandItem>
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    <span>Calendar</span>
                  </CommandItem>
                  <CommandItem>
                    <ImageIcon className="mr-2 h-4 w-4" />
                    <span>Image Editor</span>
                  </CommandItem>
                  <CommandItem>
                    <CodeIcon className="mr-2 h-4 w-4" />
                    <span>Code Editor</span>
                  </CommandItem>
                </CommandGroup>
              </CommandList>
            </Command>
          </CommandDialog>
        </div>
      </div>
    </div>
  );
}
