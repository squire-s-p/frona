"use client";

import * as React from "react";
import { Command, CommandGroup, CommandItem, CommandList } from "@/components/ui/command";
import { cn } from "@/lib/utils";
import { FileText } from "lucide-react";

interface Note {
    id: string;
    title: string;
}

interface NotesAutocompleteProps {
    notes: Note[];
    query: string;
    position: { top: number; left: number };
    onSelect: (note: Note) => void;
    onClose: () => void;
}

export function NotesAutocomplete({ notes, query, position, onSelect, onClose }: NotesAutocompleteProps) {
    const [selectedIndex, setSelectedIndex] = React.useState(0);
    const ref = React.useRef<HTMLDivElement>(null);

    const filteredNotes = React.useMemo(() => {
        const q = query.toLowerCase();
        return notes.filter(note => note.title.toLowerCase().includes(q)).slice(0, 10);
    }, [notes, query]);

    React.useEffect(() => {
        setSelectedIndex(0);
    }, [query]);

    React.useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'ArrowDown') {
                e.preventDefault();
                setSelectedIndex(prev => Math.min(prev + 1, filteredNotes.length - 1));
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                setSelectedIndex(prev => Math.max(prev - 1, 0));
            } else if (e.key === 'Enter') {
                e.preventDefault();
                if (filteredNotes[selectedIndex]) {
                    onSelect(filteredNotes[selectedIndex]);
                }
            } else if (e.key === 'Escape') {
                e.preventDefault();
                onClose();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [filteredNotes, selectedIndex, onSelect, onClose]);

    if (filteredNotes.length === 0) {
        return (
            <div
                ref={ref}
                className="absolute z-50 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg shadow-none overflow-hidden w-80"
                style={{ top: position.top, left: position.left }}
            >
                <div className="p-4 text-sm text-zinc-500 italic">
                    Нотатки не знайдені
                    {query && (
                        <div className="mt-2 text-xs">
                            <span className="text-blue-500">Enter</span> щоб створити &quot;{query}&quot;
                        </div>
                    )}
                </div>
            </div>
        );
    }

    return (
        <div
            ref={ref}
            className="absolute z-50 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg shadow-xl overflow-hidden w-80 animate-in fade-in slide-in-from-top-2 duration-150"
            style={{ top: position.top, left: position.left }}
        >
            <Command className="border-none">
                <CommandList>
                    <CommandGroup>
                        {filteredNotes.map((note, index) => (
                            <CommandItem
                                key={note.id}
                                value={note.id}
                                onSelect={() => onSelect(note)}
                                className={cn(
                                    "flex items-center gap-3 px-3 py-2.5 cursor-pointer transition-colors",
                                    index === selectedIndex && "bg-blue-500/10 text-blue-600 dark:text-blue-400"
                                )}
                            >
                                <FileText className="h-4 w-4 text-zinc-400" />
                                <span className="flex-1 truncate font-medium text-sm">{note.title}</span>
                            </CommandItem>
                        ))}
                    </CommandGroup>
                </CommandList>
            </Command>
            <div className="px-3 py-2 border-t border-zinc-100 dark:border-zinc-800 flex items-center gap-2 text-[10px] text-zinc-400 bg-zinc-50/50 dark:bg-zinc-950/50">
                <kbd className="px-1.5 py-0.5 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded text-[9px] font-mono">↑↓</kbd>
                <span>навігація</span>
                <kbd className="px-1.5 py-0.5 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded text-[9px] font-mono">Enter</kbd>
                <span>вибрати</span>
                <kbd className="px-1.5 py-0.5 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded text-[9px] font-mono">Esc</kbd>
                <span>закрити</span>
            </div>
        </div>
    );
}
