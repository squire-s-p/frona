"use client";

import * as React from "react";
import {
    CommandDialog,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command";
import { FileText, Search, Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { searchNotes, createNote } from "@/app/dashboard/notes/actions";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";

export function NotesSearch() {
    const [open, setOpen] = React.useState(false);
    const [query, setQuery] = React.useState("");
    const [results, setResults] = React.useState<Array<{ id: string; title: string }>>([]);
    const router = useRouter();

    React.useEffect(() => {
        const down = (e: KeyboardEvent) => {
            if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                setOpen((open) => !open);
            }
        };
        document.addEventListener("keydown", down);
        return () => document.removeEventListener("keydown", down);
    }, []);

    React.useEffect(() => {
        if (!query) {
            setResults([]);
            return;
        }
        const handler = setTimeout(async () => {
            const data = await searchNotes(query);
            setResults(data);
        }, 300);
        return () => clearTimeout(handler);
    }, [query]);

    const runCommand = React.useCallback((command: () => void) => {
        setOpen(false);
        command();
    }, []);

    return (
        <>
            <button
                onClick={() => setOpen(true)}
                className={cn(buttonVariants({ variant: "ghost", size: "icon-sm" }), "text-zinc-400 hover:text-foreground")}
                title="Пошук (Ctrl+K)"
            >
                <Search className="h-3.5 w-3.5" />
            </button>
            <CommandDialog open={open} onOpenChange={setOpen}>
                <CommandInput
                    placeholder="Пошук нотаток..."
                    value={query}
                    onValueChange={setQuery}
                />
                <CommandList>
                    <CommandEmpty>Нічого не знайдено.</CommandEmpty>
                    <CommandGroup heading="Результати">
                        {results.map((note) => (
                            <CommandItem
                                key={note.id}
                                value={note.id}
                                onSelect={() => runCommand(() => router.push(`/dashboard/notes/${note.id}`))}
                            >
                                <FileText className="mr-2 h-4 w-4" />
                                <span>{note.title}</span>
                            </CommandItem>
                        ))}
                    </CommandGroup>
                    <CommandGroup heading="Швидкі дії">
                        <CommandItem onSelect={() => runCommand(async () => {
                            const note = await createNote("Нова нотатка");
                            router.push(`/dashboard/notes/${note.id}`);
                        })}>
                            <Plus className="mr-2 h-4 w-4" />
                            <span>Створити нову нотатку</span>
                        </CommandItem>
                    </CommandGroup>
                </CommandList>
            </CommandDialog>
        </>
    );
}
