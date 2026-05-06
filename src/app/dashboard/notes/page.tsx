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
import { Kbd } from "@/components/ui/kbd";

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
        <div className="flex flex-1 min-h-0 bg-background overflow-hidden relative">
            <div className="hidden md:flex">
                <NotesExplorer folders={folders} notes={notes} tags={tags} view={view} />
            </div>

            <main className="flex-1 h-full min-w-0 relative bg-background flex flex-col overflow-hidden">
                <div className="md:hidden h-12 px-3 border-b border-border flex items-center">
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
                    <div className="flex-1 flex flex-col items-center justify-center h-full px-6 bg-muted/10">
                        <div className="max-w-md w-full text-center flex flex-col gap-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                            <div className="inline-flex h-20 w-20 items-center justify-center rounded-3xl bg-background text-muted-foreground shadow-none border border-border ring-8 ring-muted/30">
                                <FileText className="h-10 w-10 text-foreground" />
                            </div>

                            <div className="flex flex-col gap-2">
                                <h3 className="text-2xl font-bold tracking-tight">Нотатки</h3>
                                <p className="text-sm text-muted-foreground leading-relaxed">
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
        <div className="group p-3 rounded-xl border border-border bg-background hover:border-primary/40 transition-colors">
            <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{label}</span>
                <Kbd className="px-1.5 text-[10px]">{shortcut}</Kbd>
            </div>
            <p className="text-[11px] text-muted-foreground leading-none">{desc}</p>
        </div>
    );
}
