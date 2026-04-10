"use client";

import * as React from "react";
import {
    CommandDialog,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
    CommandSeparator
} from "@/components/ui/command";
import {
    FileText,
    Link as LinkIcon,
    Plus,
    Search,
    Settings,
    LayoutGrid,
    Network,
    Calendar,
    Hash,
    FolderPlus
} from "lucide-react";
import { useRouter } from "next/navigation";
import { createNote, createFolder, searchNotes } from "@/app/dashboard/notes/actions";
import { toast } from "sonner";

interface CommandPaletteProps {
    notes?: Array<{ id: string; title: string }>;
}

export function CommandPalette({ notes = [] }: CommandPaletteProps) {
    const [open, setOpen] = React.useState(false);
    const [search, setSearch] = React.useState("");
    const [searchResults, setSearchResults] = React.useState<any[]>([]);
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

    // Пошук нотаток при введенні тексту
    React.useEffect(() => {
        if (search.length > 1) {
            searchNotes(search).then(setSearchResults);
        } else {
            setSearchResults([]);
        }
    }, [search]);

    const runCommand = (command: () => void | Promise<void>) => {
        setOpen(false);
        setSearch("");
        command();
    };

    const filteredNotes = search.length > 0
        ? notes.filter(note => note.title.toLowerCase().includes(search.toLowerCase()))
        : [];

    return (
        <CommandDialog open={open} onOpenChange={setOpen}>
            <CommandInput
                placeholder="Пошук нотаток або команд..."
                value={search}
                onValueChange={setSearch}
            />
            <CommandList>
                <CommandEmpty>Результатів не знайдено.</CommandEmpty>

                {/* Нотатки */}
                {filteredNotes.length > 0 && (
                    <>
                        <CommandGroup heading="Нотатки">
                            {filteredNotes.slice(0, 5).map(note => (
                                <CommandItem
                                    key={note.id}
                                    onSelect={() => runCommand(() => router.push(`/dashboard/notes/${note.id}`))}
                                >
                                    <FileText className="mr-2 h-4 w-4" />
                                    <span>{note.title}</span>
                                </CommandItem>
                            ))}
                        </CommandGroup>
                        <CommandSeparator />
                    </>
                )}

                <CommandGroup heading="Дії">
                    <CommandItem onSelect={() => runCommand(async () => {
                        const note = await createNote("Нова нотатка");
                        router.push(`/dashboard/notes/${note.id}`);
                        toast.success("Створено нову нотатку");
                    })}>
                        <Plus className="mr-2 h-4 w-4" />
                        <span>Створити нову нотатку</span>
                    </CommandItem>
                    <CommandItem onSelect={() => runCommand(async () => {
                        const name = prompt("Назва папки:");
                        if (name) {
                            await createFolder(name);
                            toast.success("Папку створено");
                        }
                    })}>
                        <FolderPlus className="mr-2 h-4 w-4" />
                        <span>Створити нову папку</span>
                    </CommandItem>
                </CommandGroup>
                <CommandSeparator />
                <CommandGroup heading="Навігація">
                    <CommandItem onSelect={() => runCommand(() => router.push("/dashboard/notes"))}>
                        <LayoutGrid className="mr-2 h-4 w-4" />
                        <span>Всі нотатки</span>
                    </CommandItem>
                    <CommandItem onSelect={() => runCommand(() => router.push("/dashboard/notes?view=graph"))}>
                        <Network className="mr-2 h-4 w-4" />
                        <span>Граф зв'язків</span>
                    </CommandItem>
                </CommandGroup>

                {/* Підказка */}
                <div className="px-2 py-2 text-[10px] text-zinc-400 border-t border-zinc-100 dark:border-zinc-800 mt-2">
                    <kbd className="px-1.5 py-0.5 bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded text-[9px] font-mono mr-1">Ctrl</kbd>+<kbd className="px-1.5 py-0.5 bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded text-[9px] font-mono ml-1">K</kbd> щоб відкрити
                </div>
            </CommandList>
        </CommandDialog>
    );
}

