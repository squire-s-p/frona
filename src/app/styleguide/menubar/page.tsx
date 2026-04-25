"use client";

import * as React from "react";
import {
  FileIcon,
  FolderIcon,
  HelpCircleIcon,
  SaveIcon,
  SettingsIcon,
  TrashIcon,
} from "lucide-react";

import {
  Menubar,
  MenubarCheckboxItem,
  MenubarContent,
  MenubarItem,
  MenubarMenu,
  MenubarSeparator,
  MenubarShortcut,
  MenubarTrigger,
  MenubarRadioGroup,
  MenubarRadioItem,
  MenubarSub,
  MenubarSubContent,
  MenubarSubTrigger,
  MenubarGroup,
} from "@/components/ui/menubar";

export default function MenubarPage() {
  const [user, setUser] = React.useState("benoit");
  const [theme, setTheme] = React.useState("system");

  return (
    <div className="space-y-10 pr-10 pb-20">
      <div className="space-y-4">
        <h1 className="scroll-m-20 text-4xl font-extrabold tracking-tight lg:text-5xl text-foreground">
          Menubar
        </h1>
        <p className="text-lg text-muted-foreground">
          A visually persistent menu common in desktop applications that provides quick access to a consistent set of commands.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <h2 className="scroll-m-20 border-b pb-2 text-2xl font-semibold tracking-tight transition-colors first:mt-0 text-foreground">
            Checkboxes
          </h2>
          <div className="rounded-xl border border-border/40 bg-card p-6 shadow-sm flex items-center justify-center min-h-[150px]">
            <Menubar className="w-fit min-w-[200px]">
              <MenubarMenu>
                <MenubarTrigger>View</MenubarTrigger>
                <MenubarContent className="w-64">
                  <MenubarCheckboxItem>Always Show Bookmarks Bar</MenubarCheckboxItem>
                  <MenubarCheckboxItem checked>
                    Always Show Full URLs
                  </MenubarCheckboxItem>
                  <MenubarSeparator />
                  <MenubarItem inset>
                    Reload <MenubarShortcut>⌘R</MenubarShortcut>
                  </MenubarItem>
                  <MenubarItem disabled inset>
                    Force Reload <MenubarShortcut>⇧⌘R</MenubarShortcut>
                  </MenubarItem>
                </MenubarContent>
              </MenubarMenu>
              <MenubarMenu>
                <MenubarTrigger>Format</MenubarTrigger>
                <MenubarContent>
                  <MenubarCheckboxItem checked>Strikethrough</MenubarCheckboxItem>
                  <MenubarCheckboxItem>Code</MenubarCheckboxItem>
                  <MenubarCheckboxItem>Superscript</MenubarCheckboxItem>
                </MenubarContent>
              </MenubarMenu>
            </Menubar>
          </div>
        </div>

        <div className="space-y-4">
          <h2 className="scroll-m-20 border-b pb-2 text-2xl font-semibold tracking-tight transition-colors first:mt-0 text-foreground">
            Radio Group
          </h2>
          <div className="rounded-xl border border-border/40 bg-card p-6 shadow-sm flex items-center justify-center min-h-[150px]">
            <Menubar className="w-fit min-w-[200px]">
              <MenubarMenu>
                <MenubarTrigger>Profiles</MenubarTrigger>
                <MenubarContent>
                  <MenubarRadioGroup value={user} onValueChange={setUser}>
                    <MenubarRadioItem value="andy">Andy</MenubarRadioItem>
                    <MenubarRadioItem value="benoit">Benoit</MenubarRadioItem>
                    <MenubarRadioItem value="luis">Luis</MenubarRadioItem>
                  </MenubarRadioGroup>
                  <MenubarSeparator />
                  <MenubarItem inset>Edit...</MenubarItem>
                  <MenubarItem inset>Add Profile...</MenubarItem>
                </MenubarContent>
              </MenubarMenu>
              <MenubarMenu>
                <MenubarTrigger>Theme</MenubarTrigger>
                <MenubarContent>
                  <MenubarRadioGroup value={theme} onValueChange={setTheme}>
                    <MenubarRadioItem value="light">Light</MenubarRadioItem>
                    <MenubarRadioItem value="dark">Dark</MenubarRadioItem>
                    <MenubarRadioItem value="system">System</MenubarRadioItem>
                  </MenubarRadioGroup>
                </MenubarContent>
              </MenubarMenu>
            </Menubar>
          </div>
        </div>

        <div className="space-y-4">
          <h2 className="scroll-m-20 border-b pb-2 text-2xl font-semibold tracking-tight transition-colors first:mt-0 text-foreground">
            Submenu
          </h2>
          <div className="rounded-xl border border-border/40 bg-card p-6 shadow-sm flex items-center justify-center min-h-[150px]">
            <Menubar className="w-fit min-w-[200px]">
              <MenubarMenu>
                <MenubarTrigger>File</MenubarTrigger>
                <MenubarContent>
                  <MenubarSub>
                    <MenubarSubTrigger>Share</MenubarSubTrigger>
                    <MenubarSubContent>
                      <MenubarItem>Email link</MenubarItem>
                      <MenubarItem>Messages</MenubarItem>
                      <MenubarItem>Notes</MenubarItem>
                    </MenubarSubContent>
                  </MenubarSub>
                  <MenubarSeparator />
                  <MenubarItem>
                    Print... <MenubarShortcut>⌘P</MenubarShortcut>
                  </MenubarItem>
                </MenubarContent>
              </MenubarMenu>
              <MenubarMenu>
                <MenubarTrigger>Edit</MenubarTrigger>
                <MenubarContent>
                  <MenubarItem>
                    Undo <MenubarShortcut>⌘Z</MenubarShortcut>
                  </MenubarItem>
                  <MenubarItem>
                    Redo <MenubarShortcut>⇧⌘Z</MenubarShortcut>
                  </MenubarItem>
                  <MenubarSeparator />
                  <MenubarSub>
                    <MenubarSubTrigger>Find</MenubarSubTrigger>
                    <MenubarSubContent>
                      <MenubarItem>Find...</MenubarItem>
                      <MenubarItem>Find Next</MenubarItem>
                      <MenubarItem>Find Previous</MenubarItem>
                    </MenubarSubContent>
                  </MenubarSub>
                  <MenubarSeparator />
                  <MenubarItem>Cut</MenubarItem>
                  <MenubarItem>Copy</MenubarItem>
                  <MenubarItem>Paste</MenubarItem>
                </MenubarContent>
              </MenubarMenu>
            </Menubar>
          </div>
        </div>

        <div className="space-y-4">
          <h2 className="scroll-m-20 border-b pb-2 text-2xl font-semibold tracking-tight transition-colors first:mt-0 text-foreground">
            With Icons
          </h2>
          <div className="rounded-xl border border-border/40 bg-card p-6 shadow-sm flex items-center justify-center min-h-[150px]">
            <Menubar className="w-fit min-w-[200px]">
              <MenubarMenu>
                <MenubarTrigger>File</MenubarTrigger>
                <MenubarContent>
                  <MenubarItem>
                    <FileIcon className="mr-2 h-4 w-4" />
                    New File <MenubarShortcut>⌘N</MenubarShortcut>
                  </MenubarItem>
                  <MenubarItem>
                    <FolderIcon className="mr-2 h-4 w-4" />
                    Open Folder
                  </MenubarItem>
                  <MenubarSeparator />
                  <MenubarItem>
                    <SaveIcon className="mr-2 h-4 w-4" />
                    Save <MenubarShortcut>⌘S</MenubarShortcut>
                  </MenubarItem>
                </MenubarContent>
              </MenubarMenu>
              <MenubarMenu>
                <MenubarTrigger>More</MenubarTrigger>
                <MenubarContent>
                  <MenubarGroup>
                    <MenubarItem>
                      <SettingsIcon className="mr-2 h-4 w-4" />
                      Settings
                    </MenubarItem>
                    <MenubarItem>
                      <HelpCircleIcon className="mr-2 h-4 w-4" />
                      Help
                    </MenubarItem>
                    <MenubarSeparator />
                    <MenubarItem variant="destructive">
                      <TrashIcon className="mr-2 h-4 w-4" />
                      Delete
                    </MenubarItem>
                  </MenubarGroup>
                </MenubarContent>
              </MenubarMenu>
            </Menubar>
          </div>
        </div>
      </div>
    </div>
  );
}
