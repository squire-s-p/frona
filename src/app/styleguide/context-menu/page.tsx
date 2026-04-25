"use client";

import * as React from "react";
import {
  ClipboardPasteIcon,
  CopyIcon,
  ScissorsIcon,
  TrashIcon,
  PencilIcon,
  ShareIcon,
} from "lucide-react";

import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuGroup,
  ContextMenuItem,
  ContextMenuTrigger,
  ContextMenuSeparator,
  ContextMenuShortcut,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
  ContextMenuLabel,
  ContextMenuCheckboxItem,
  ContextMenuRadioGroup,
  ContextMenuRadioItem,
} from "@/components/ui/context-menu";

export default function ContextMenuPage() {
  const [user, setUser] = React.useState("pedro");
  const [theme, setTheme] = React.useState("light");

  return (
    <div className="space-y-10 pr-10 pb-20">
      <div className="space-y-4">
        <h1 className="scroll-m-20 text-4xl font-extrabold tracking-tight lg:text-5xl text-foreground">
          Context Menu
        </h1>
        <p className="text-lg text-muted-foreground">
          Displays a menu to the user — such as a set of actions or functions — triggered by a right-click.
        </p>
      </div>

      <div className="space-y-4">
        <h2 className="scroll-m-20 border-b pb-2 text-3xl font-semibold tracking-tight transition-colors first:mt-0 text-foreground">
          Basic
        </h2>
        <div className="rounded-xl border border-border/40 bg-card p-6 shadow-sm flex items-center justify-center min-h-[300px]">
          <ContextMenu>
            <ContextMenuTrigger className="flex aspect-video w-full max-w-xs items-center justify-center rounded-xl border border-dashed text-sm">
              <span className="hidden md:inline-block">Right click here</span>
              <span className="inline-block md:hidden">Long press here</span>
            </ContextMenuTrigger>
            <ContextMenuContent>
              <ContextMenuGroup>
                <ContextMenuItem>Back</ContextMenuItem>
                <ContextMenuItem disabled>Forward</ContextMenuItem>
                <ContextMenuItem>Reload</ContextMenuItem>
              </ContextMenuGroup>
            </ContextMenuContent>
          </ContextMenu>
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="scroll-m-20 border-b pb-2 text-3xl font-semibold tracking-tight transition-colors first:mt-0 text-foreground">
          Submenu
        </h2>
        <div className="rounded-xl border border-border/40 bg-card p-6 shadow-sm flex items-center justify-center min-h-[300px]">
          <ContextMenu>
            <ContextMenuTrigger className="flex aspect-video w-full max-w-xs items-center justify-center rounded-xl border border-dashed text-sm">
              <span className="hidden md:inline-block">Right click here</span>
              <span className="inline-block md:hidden">Long press here</span>
            </ContextMenuTrigger>
            <ContextMenuContent>
              <ContextMenuGroup>
                <ContextMenuItem>
                  Copy
                  <ContextMenuShortcut>⌘C</ContextMenuShortcut>
                </ContextMenuItem>
                <ContextMenuItem>
                  Cut
                  <ContextMenuShortcut>⌘X</ContextMenuShortcut>
                </ContextMenuItem>
              </ContextMenuGroup>
              <ContextMenuSub>
                <ContextMenuSubTrigger>More Tools</ContextMenuSubTrigger>
                <ContextMenuSubContent>
                  <ContextMenuGroup>
                    <ContextMenuItem>Save Page...</ContextMenuItem>
                    <ContextMenuItem>Create Shortcut...</ContextMenuItem>
                    <ContextMenuItem>Name Window...</ContextMenuItem>
                  </ContextMenuGroup>
                  <ContextMenuSeparator />
                  <ContextMenuGroup>
                    <ContextMenuItem>Developer Tools</ContextMenuItem>
                  </ContextMenuGroup>
                  <ContextMenuSeparator />
                  <ContextMenuGroup>
                    <ContextMenuItem variant="destructive">Delete</ContextMenuItem>
                  </ContextMenuGroup>
                </ContextMenuSubContent>
              </ContextMenuSub>
            </ContextMenuContent>
          </ContextMenu>
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="scroll-m-20 border-b pb-2 text-3xl font-semibold tracking-tight transition-colors first:mt-0 text-foreground">
          Groups
        </h2>
        <div className="rounded-xl border border-border/40 bg-card p-6 shadow-sm flex items-center justify-center min-h-[300px]">
          <ContextMenu>
            <ContextMenuTrigger className="flex aspect-video w-full max-w-xs items-center justify-center rounded-xl border border-dashed text-sm">
              <span className="hidden md:inline-block">Right click here</span>
              <span className="inline-block md:hidden">Long press here</span>
            </ContextMenuTrigger>
            <ContextMenuContent>
              <ContextMenuGroup>
                <ContextMenuLabel>File</ContextMenuLabel>
                <ContextMenuItem>
                  New File
                  <ContextMenuShortcut>⌘N</ContextMenuShortcut>
                </ContextMenuItem>
                <ContextMenuItem>
                  Open File
                  <ContextMenuShortcut>⌘O</ContextMenuShortcut>
                </ContextMenuItem>
                <ContextMenuItem>
                  Save
                  <ContextMenuShortcut>⌘S</ContextMenuShortcut>
                </ContextMenuItem>
              </ContextMenuGroup>
              <ContextMenuSeparator />
              <ContextMenuGroup>
                <ContextMenuLabel>Edit</ContextMenuLabel>
                <ContextMenuItem>
                  Undo
                  <ContextMenuShortcut>⌘Z</ContextMenuShortcut>
                </ContextMenuItem>
                <ContextMenuItem>
                  Redo
                  <ContextMenuShortcut>⇧⌘Z</ContextMenuShortcut>
                </ContextMenuItem>
              </ContextMenuGroup>
              <ContextMenuSeparator />
              <ContextMenuGroup>
                <ContextMenuItem>
                  Cut
                  <ContextMenuShortcut>⌘X</ContextMenuShortcut>
                </ContextMenuItem>
                <ContextMenuItem>
                  Copy
                  <ContextMenuShortcut>⌘C</ContextMenuShortcut>
                </ContextMenuItem>
                <ContextMenuItem>
                  Paste
                  <ContextMenuShortcut>⌘V</ContextMenuShortcut>
                </ContextMenuItem>
              </ContextMenuGroup>
              <ContextMenuSeparator />
              <ContextMenuGroup>
                <ContextMenuItem variant="destructive">
                  Delete
                  <ContextMenuShortcut>⌫</ContextMenuShortcut>
                </ContextMenuItem>
              </ContextMenuGroup>
            </ContextMenuContent>
          </ContextMenu>
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="scroll-m-20 border-b pb-2 text-3xl font-semibold tracking-tight transition-colors first:mt-0 text-foreground">
          Icons & Destructive
        </h2>
        <div className="rounded-xl border border-border/40 bg-card p-6 shadow-sm flex items-center justify-center min-h-[300px]">
          <ContextMenu>
            <ContextMenuTrigger className="flex aspect-video w-full max-w-xs items-center justify-center rounded-xl border border-dashed text-sm">
              <span className="hidden md:inline-block">Right click here</span>
              <span className="inline-block md:hidden">Long press here</span>
            </ContextMenuTrigger>
            <ContextMenuContent>
              <ContextMenuGroup>
                <ContextMenuItem>
                  <PencilIcon className="mr-2 h-4 w-4" />
                  Edit
                </ContextMenuItem>
                <ContextMenuItem>
                  <ShareIcon className="mr-2 h-4 w-4" />
                  Share
                </ContextMenuItem>
                <ContextMenuItem>
                  <CopyIcon className="mr-2 h-4 w-4" />
                  Copy
                </ContextMenuItem>
                <ContextMenuItem>
                  <ScissorsIcon className="mr-2 h-4 w-4" />
                  Cut
                </ContextMenuItem>
                <ContextMenuItem>
                  <ClipboardPasteIcon className="mr-2 h-4 w-4" />
                  Paste
                </ContextMenuItem>
              </ContextMenuGroup>
              <ContextMenuSeparator />
              <ContextMenuGroup>
                <ContextMenuItem variant="destructive">
                  <TrashIcon className="mr-2 h-4 w-4" />
                  Delete
                </ContextMenuItem>
              </ContextMenuGroup>
            </ContextMenuContent>
          </ContextMenu>
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="scroll-m-20 border-b pb-2 text-3xl font-semibold tracking-tight transition-colors first:mt-0 text-foreground">
          Checkboxes
        </h2>
        <div className="rounded-xl border border-border/40 bg-card p-6 shadow-sm flex items-center justify-center min-h-[300px]">
          <ContextMenu>
            <ContextMenuTrigger className="flex aspect-video w-full max-w-xs items-center justify-center rounded-xl border border-dashed text-sm">
              <span className="hidden md:inline-block">Right click here</span>
              <span className="inline-block md:hidden">Long press here</span>
            </ContextMenuTrigger>
            <ContextMenuContent>
              <ContextMenuGroup>
                <ContextMenuCheckboxItem defaultChecked>
                  Show Bookmarks Bar
                </ContextMenuCheckboxItem>
                <ContextMenuCheckboxItem>Show Full URLs</ContextMenuCheckboxItem>
                <ContextMenuCheckboxItem defaultChecked>
                  Show Developer Tools
                </ContextMenuCheckboxItem>
              </ContextMenuGroup>
            </ContextMenuContent>
          </ContextMenu>
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="scroll-m-20 border-b pb-2 text-3xl font-semibold tracking-tight transition-colors first:mt-0 text-foreground">
          Radio Group
        </h2>
        <div className="rounded-xl border border-border/40 bg-card p-6 shadow-sm flex items-center justify-center min-h-[300px]">
          <ContextMenu>
            <ContextMenuTrigger className="flex aspect-video w-full max-w-xs items-center justify-center rounded-xl border border-dashed text-sm">
              <span className="hidden md:inline-block">Right click here</span>
              <span className="inline-block md:hidden">Long press here</span>
            </ContextMenuTrigger>
            <ContextMenuContent>
              <ContextMenuGroup>
                <ContextMenuLabel>People</ContextMenuLabel>
                <ContextMenuRadioGroup value={user} onValueChange={setUser}>
                  <ContextMenuRadioItem value="pedro">
                    Pedro Duarte
                  </ContextMenuRadioItem>
                  <ContextMenuRadioItem value="colm">Colm Tuite</ContextMenuRadioItem>
                </ContextMenuRadioGroup>
              </ContextMenuGroup>
              <ContextMenuSeparator />
              <ContextMenuGroup>
                <ContextMenuLabel>Theme</ContextMenuLabel>
                <ContextMenuRadioGroup value={theme} onValueChange={setTheme}>
                  <ContextMenuRadioItem value="light">Light</ContextMenuRadioItem>
                  <ContextMenuRadioItem value="dark">Dark</ContextMenuRadioItem>
                  <ContextMenuRadioItem value="system">System</ContextMenuRadioItem>
                </ContextMenuRadioGroup>
              </ContextMenuGroup>
            </ContextMenuContent>
          </ContextMenu>
        </div>
      </div>
    </div>
  );
}
