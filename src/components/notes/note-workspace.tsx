"use client";

import * as React from "react";
import { NoteEditor } from "./note-editor";
import { NoteSidebarRight } from "./note-sidebar-right";
import { CommandPalette } from "./command-palette";
import { NotesExplorer } from "./notes-explorer";

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
            <NotesExplorer folders={folders} notes={notes} tags={tags} />

            <div className="flex-1 flex min-h-0 overflow-hidden relative">
                <div className="flex-1 bg-zinc-50 dark:bg-zinc-950 overflow-hidden relative">
                    <NoteEditor
                        note={note}
                        folders={folders}
                        notes={notes.map(n => ({ id: n.id, title: n.title }))}
                        onContentChange={setCurrentContent}
                    />
                </div>

                <NoteSidebarRight
                    noteId={note.id}
                    title={note.title}
                    content={currentContent}
                    incomingLinks={note.incomingLinks || []}
                    outgoingLinks={note.outgoingLinks || []}
                />
            </div>

            <CommandPalette notes={notes.map(n => ({ id: n.id, title: n.title }))} />
        </div>
    );
}
