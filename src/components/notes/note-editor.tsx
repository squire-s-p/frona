"use client";

import * as React from "react";
import { MarkdownEditor } from "./markdown-editor";
import { MarkdownPreview } from "./markdown-preview";
import { TagEditor } from "./tag-editor";
import { updateNote } from "@/app/dashboard/notes/actions";
import { Loader2, Star, Share2, MoreVertical, Calendar, Tag, Clock, Eye, Edit2, Share, FolderPlus, Folder, FolderCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { createNote } from "@/app/dashboard/notes/actions";

interface NoteEditorProps {
    note: any;
    folders?: any[];
    notes?: Array<{ id: string; title: string }>;
    unlinkedMentions?: any[];
    onContentChange?: (content: string) => void;
}

export function NoteEditor({ note: initialNote, folders = [], notes = [], unlinkedMentions = [], onContentChange }: NoteEditorProps) {
    const router = useRouter();
    const [note, setNote] = React.useState(initialNote);
    const [content, setContent] = React.useState(initialNote.content || "");
    const [title, setTitle] = React.useState(initialNote.title || "");
    const [isSaving, setIsSaving] = React.useState(false);
    const [previewMode, setPreviewMode] = React.useState(false);
    const [missingNoteTitle, setMissingNoteTitle] = React.useState<string | null>(null);
    const [moveDialogOpen, setMoveDialogOpen] = React.useState(false);

    // Initial check for global preview mode
    React.useEffect(() => {
        const savedMode = localStorage.getItem("notes-view-mode");
        if (savedMode === "preview") {
            setPreviewMode(true);
        }
    }, []);

    const togglePreviewMode = (val: boolean) => {
        setPreviewMode(val);
        localStorage.setItem("notes-view-mode", val ? "preview" : "editor");
    };

    const handleCreateMissingNote = async () => {
        if (!missingNoteTitle) return;
        try {
            const newNote = await createNote(missingNoteTitle, initialNote.folderId);
            toast.success(`Нотатку "${missingNoteTitle}" створено`);
            router.push(`/dashboard/notes/${newNote.id}`);
        } catch (error) {
            toast.error("Помилка створення нотатки");
        } finally {
            setMissingNoteTitle(null);
        }
    };

    const handleSave = React.useCallback(async (updatedFields: any) => {
        setIsSaving(true);
        try {
            await updateNote(initialNote.id, updatedFields);
        } catch (error) {
            toast.error("Помилка збереження");
        } finally {
            setIsSaving(false);
        }
    }, [initialNote.id]);

    React.useEffect(() => {
        if (onContentChange) onContentChange(content);
        if (content === initialNote.content) return;
        const timer = setTimeout(() => {
            handleSave({ content });
        }, 2000);
        return () => clearTimeout(timer);
    }, [content, initialNote.content, handleSave, onContentChange]);

    const stats = React.useMemo(() => {
        const words = content.trim().split(/\s+/).filter(Boolean).length;
        const readingTime = Math.ceil(words / 200);
        return { words, readingTime };
    }, [content]);

    return (
        <div className="flex flex-col h-full bg-white dark:bg-zinc-950 overflow-hidden">
            {/* Header */}
            <div className="h-14 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between px-4 shrink-0 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-xl z-20">
                <div className="flex items-center gap-6 flex-1 min-w-0">
                    <div className="flex-1 min-w-0">
                        <Input
                            className="text-xl font-bold bg-transparent border-none outline-none focus-visible:ring-0 w-full placeholder:text-zinc-200 dark:placeholder:text-zinc-800 tracking-tight p-0 h-auto"
                            value={title}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTitle(e.target.value)}
                            onBlur={() => {
                                if (title !== initialNote.title) {
                                    handleSave({ title });
                                }
                            }}
                        />
                    </div>
                </div>

                <div className="flex items-center gap-3 ml-4">
                    <div className="flex items-center bg-zinc-100 dark:bg-zinc-900 p-0.5 rounded-lg border border-zinc-200 dark:border-zinc-800">
                        <Button
                            variant={previewMode ? "ghost" : "secondary"}
                            size="sm"
                            className="h-7 px-3 text-[11px] font-semibold rounded-md transition-all"
                            onClick={() => togglePreviewMode(false)}
                        >
                            Редактор
                        </Button>
                        <Button
                            variant={previewMode ? "secondary" : "ghost"}
                            size="sm"
                            className="h-7 px-3 text-[11px] font-semibold rounded-md transition-all"
                            onClick={() => togglePreviewMode(true)}
                        >
                            Перегляд
                        </Button>
                    </div>

                    <div className="w-px h-4 bg-zinc-200 dark:bg-zinc-800 mx-1" />

                    <div className="flex items-center gap-1">
                        {isSaving && <Loader2 className="h-3.5 w-3.5 animate-spin text-zinc-400" />}
                        <Button
                            variant="ghost"
                            size="icon"
                            className={cn(
                                "h-8 w-8 transition-colors",
                                note.isFavorite ? "text-yellow-500 hover:text-yellow-600" : "text-zinc-400 hover:text-foreground"
                            )}
                            onClick={() => {
                                const val = !note.isFavorite;
                                setNote({ ...note, isFavorite: val });
                                handleSave({ isFavorite: val });
                            }}
                        >
                            <Star className={cn("h-4 w-4", note.isFavorite && "fill-yellow-500")} />
                        </Button>

                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-zinc-400">
                                    <MoreVertical className="h-4 w-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48">
                                <DropdownMenuItem className="gap-2">
                                    <Share className="h-4 w-4" /> Поділитися
                                </DropdownMenuItem>
                                <DropdownMenuItem className="gap-2 text-red-600">
                                    Видалити
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </div>
            </div>

            {/* Properties Section (Obsidian-style) */}
            <div className="flex-1 overflow-y-auto custom-scrollbar bg-slate-50/10 dark:bg-slate-900/5">
                <div className="w-full px-4 pt-6 space-y-8">
                    <div className="space-y-3">
                        <div className="flex items-center gap-6 text-[11px] text-zinc-400 font-medium uppercase tracking-wider">
                            <div className="flex items-center gap-2 min-w-[140px]">
                                <Calendar className="h-3.5 w-3.5" />
                                <span>Створено</span>
                            </div>
                            <span className="text-zinc-600 dark:text-zinc-400 font-mono">
                                {new Date(note.createdAt).toLocaleDateString('uk-UA', { day: 'numeric', month: 'long', year: 'numeric' })}
                            </span>
                        </div>
                        <div className="flex items-center gap-6 text-[11px] text-zinc-400 font-medium uppercase tracking-wider">
                            <div className="flex items-center gap-2 min-w-[140px]">
                                <Tag className="h-3.5 w-3.5" />
                                <span>Теги</span>
                            </div>
                            <TagEditor
                                tags={note.tags || []}
                                tagsMetadata={note.tagsRel || []}
                                onChange={(tags) => {
                                    setNote({ ...note, tags });
                                    handleSave({ tags });
                                }}
                            />
                        </div>
                        <div className="flex items-center gap-6 text-[11px] text-zinc-400 font-medium uppercase tracking-wider">
                            <div className="flex items-center gap-2 min-w-[140px]">
                                <Folder className="h-3.5 w-3.5" />
                                <span>Папка</span>
                            </div>
                            <Button
                                variant="ghost"
                                size="sm"
                                className="h-auto p-0 text-zinc-600 dark:text-zinc-400 font-mono hover:bg-transparent hover:text-foreground"
                                onClick={() => setMoveDialogOpen(true)}
                            >
                                {folders.find((f: any) => f.id === note.folderId)?.name || "Без папки"}
                            </Button>
                        </div>
                    </div>

                    {/* Content Area */}
                    <div className="pb-20">
                        {previewMode ? (
                            <MarkdownPreview
                                content={content}
                                notes={notes}
                                onNoteNotFound={(title) => setMissingNoteTitle(title)}
                            />
                        ) : (
                            <div className="w-full">
                                <MarkdownEditor
                                    value={content}
                                    onChange={setContent}
                                    notes={notes}
                                />
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <AlertDialog open={moveDialogOpen} onOpenChange={setMoveDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Перенести до папки</AlertDialogTitle>
                        <AlertDialogDescription>
                            Оберіть папку, до якої хочете перемістити цю нотатку.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <div className="grid grid-cols-1 gap-2 py-4 max-h-[300px] overflow-y-auto">
                        <Button
                            variant={!note.folderId ? "secondary" : "ghost"}
                            className="justify-start gap-2"
                            onClick={async () => {
                                await handleSave({ folderId: null });
                                setNote({ ...note, folderId: null });
                                setMoveDialogOpen(false);
                            }}
                        >
                            <FolderCheck className="h-4 w-4" /> Без папки (Корінь)
                        </Button>
                        {folders.map((folder: any) => (
                            <Button
                                key={folder.id}
                                variant={note.folderId === folder.id ? "secondary" : "ghost"}
                                className="justify-start gap-2"
                                onClick={async () => {
                                    await handleSave({ folderId: folder.id });
                                    setNote({ ...note, folderId: folder.id });
                                    setMoveDialogOpen(false);
                                }}
                            >
                                <Folder className="h-4 w-4" /> {folder.name}
                            </Button>
                        ))}
                    </div>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Закрити</AlertDialogCancel>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
