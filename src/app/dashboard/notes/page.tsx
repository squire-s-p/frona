import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Нотатки',
};

import { getFolders, getNotes, getTags } from "@/app/dashboard/notes/actions";
import { NotesExplorer } from "@/components/notes/notes-explorer";
import { GraphView } from "@/components/notes/graph-view";
import { FileText, PanelLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";

export default async function NotesPage({
    searchParams
}: {
    searchParams: Promise<{ view?: string }>
}) {
    const { view } = await searchParams;
    const folders = await getFolders();
    const notes = await getNotes();
    const tags = await getTags();

    return (
        <div className="flex flex-1 h-full -m-4 md:-m-6 bg-background overflow-hidden relative">
            <div className="hidden md:flex">
                <NotesExplorer folders={folders} notes={notes} tags={tags} view={view} />
            </div>

            <main className="flex-1 h-full min-w-0 relative bg-zinc-50 dark:bg-zinc-950 flex flex-col overflow-hidden">
                <div className="md:hidden h-12 px-3 border-b border-zinc-200 dark:border-zinc-800 flex items-center">
                    <Sheet>
                        <SheetTrigger asChild>
                            <Button variant="outline" size="sm" className="h-8 rounded-lg gap-2">
                                <PanelLeft className="h-3.5 w-3.5" />
                                Провідник
                            </Button>
                        </SheetTrigger>
                        <SheetContent side="left" className="w-[88vw] max-w-[340px] p-0">
                            <SheetHeader className="px-4 py-3 border-b">
                                <SheetTitle className="text-sm">Нотатки</SheetTitle>
                            </SheetHeader>
                            <NotesExplorer folders={folders} notes={notes} tags={tags} view={view} className="w-full border-r-0" />
                        </SheetContent>
                    </Sheet>
                </div>

                {view === "graph" ? (
                    <div className="flex-1 w-full h-full relative min-h-[500px]">
                        <GraphView />
                    </div>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center h-full px-6 bg-zinc-50/30 dark:bg-zinc-950/30">
                        <div className="max-w-md w-full text-center space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                            <div className="inline-flex h-20 w-20 items-center justify-center rounded-3xl bg-white dark:bg-zinc-900 text-zinc-400 shadow-none border border-zinc-200 dark:border-zinc-800 ring-8 ring-zinc-100/50 dark:ring-zinc-900/50">
                                <FileText className="h-10 w-10 text-zinc-900 dark:text-zinc-50" />
                            </div>

                            <div className="space-y-2">
                                <h3 className="text-2xl font-bold tracking-tight">Нотатки</h3>
                                <p className="text-sm text-zinc-500 leading-relaxed">
                                    Оберіть нотатку з провідника або скористайтеся підказками нижче для швидкої роботи.
                                </p>
                            </div>

                            <div className="grid grid-cols-1 gap-3 pt-4 text-left">
                                <ShortcutItem
                                    label="Швидкий пошук та команди"
                                    shortcut="Ctrl + K"
                                    desc="Шукайте нотатки та керуйте папками"
                                />
                                <ShortcutItem
                                    label="Внутрішні посилання"
                                    shortcut="[["
                                    desc="Пишіть назву нотатки для зв'язку"
                                />
                                <ShortcutItem
                                    label="Граф зв'язків"
                                    shortcut="Ctrl + G"
                                    desc="Візуалізуйте структуру ваших знань"
                                />
                                <ShortcutItem
                                    label="Форматування"
                                    shortcut="Ctrl + B / I"
                                    desc="Жирний та курсив для виділення головного"
                                />
                            </div>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}

function ShortcutItem({ label, shortcut, desc }: { label: string; shortcut: string; desc: string }) {
    return (
        <div className="group p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 hover:border-blue-500/50 hover:shadow-none transition-all duration-300">
            <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider">{label}</span>
                <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-zinc-100 dark:bg-zinc-800 px-1.5 font-mono text-[10px] font-medium text-zinc-600 dark:text-zinc-400 opacity-100">
                    {shortcut}
                </kbd>
            </div>
            <p className="text-[11px] text-zinc-400 leading-none">{desc}</p>
        </div>
    );
}
