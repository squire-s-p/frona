"use client";

import * as React from "react";
import { NoteEditor } from "./note-editor";
import { NoteSidebarRight } from "./note-sidebar-right";
import { CommandPalette } from "./command-palette";
import { NotesExplorer } from "./notes-explorer";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { PanelLeft } from "lucide-react";

interface NoteWorkspaceProps {
    note: any;
    folders: any[];
    notes: any[];
    tags: any[];
}

export function NoteWorkspace({ note, folders, notes, tags }: NoteWorkspaceProps) {
    const [currentContent, setCurrentContent] = React.useState(note.content || "");

    return (
        <div className="flex flex-1 h-full min-h-0 -m-4 md:-m-6 bg-background overflow-hidden">
            <div className="hidden md:flex">
                <NotesExplorer folders={folders} notes={notes} tags={tags} />
            </div>

            <div className="flex-1 flex min-h-0 overflow-hidden relative">
                <div className="md:hidden absolute left-3 top-3 z-20">
                    <Sheet>
                        <SheetTrigger asChild>
                            <Button variant="outline" size="sm" className="h-8 rounded-lg gap-2 bg-background/90 backdrop-blur">
                                <PanelLeft className="h-3.5 w-3.5" />
                                Провідник
                            </Button>
                        </SheetTrigger>
                        <SheetContent side="left" className="w-[88vw] max-w-[340px] p-0">
                            <SheetHeader className="px-4 py-3 border-b">
                                <SheetTitle className="text-sm">Нотатки</SheetTitle>
                            </SheetHeader>
                            <NotesExplorer folders={folders} notes={notes} tags={tags} className="w-full border-r-0" />
                        </SheetContent>
                    </Sheet>
                </div>

                <div className="flex-1 bg-zinc-50 dark:bg-zinc-950 overflow-hidden relative">
                    <NoteEditor
                        note={note}
                        folders={folders}
                        notes={notes.map(n => ({ id: n.id, title: n.title }))}
                        onContentChange={setCurrentContent}
                    />
                </div>

                <div className="hidden xl:block">
                <NoteSidebarRight
                    noteId={note.id}
                    title={note.title}
                    content={currentContent}
                    incomingLinks={note.incomingLinks || []}
                    outgoingLinks={note.outgoingLinks || []}
                />
                </div>
            </div>

            <CommandPalette notes={notes.map(n => ({ id: n.id, title: n.title }))} />
        </div>
    );
}
