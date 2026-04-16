"use client";

import * as React from "react";
import { NotesSearch } from "./notes-search";
import {
    Folder,
    FileText,
    Plus,
    ChevronRight,
    ChevronDown,
    Search,
    MoreVertical,
    FolderPlus,
    FilePlus,
    Star,
    Network,
    Tag as TagIcon,
    LayoutDashboard,
    Database,
    Upload,
    ArrowUpDown,
    Check,
    X
} from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import {
    createFolder,
    createNote,
    deleteFolder,
    renameFolder,
    deleteNote,
    updateNote as updateNoteAction,
    seedTestData,
    bulkCreateNotes,
    updateTag,
    deleteTag
} from "@/app/dashboard/notes/actions";
import { toast } from "sonner";
import { useRouter, usePathname } from "next/navigation";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";

interface NotesExplorerProps {
    folders: any[];
    notes: any[];
    tags: any[];
    view?: string;
    className?: string;
}

export function NotesExplorer({ folders, notes, tags = [], view, className }: NotesExplorerProps) {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
    const currentView = view || searchParams?.get('view');
    const [searchQuery, setSearchQuery] = React.useState("");
    const [expandedFolders, setExpandedFolders] = React.useState<Record<string, boolean>>({});
    const [selectedTag, setSelectedTag] = React.useState<string | null>(null);
    const [sortBy, setSortBy] = React.useState<"name-asc" | "name-desc" | "updated-desc" | "updated-asc" | "created-desc" | "created-asc">("updated-desc");

    // Dialog states
    const [dialogOpen, setDialogOpen] = React.useState(false);
    const [dialogType, setDialogType] = React.useState<"create-folder" | "rename-folder" | "rename-note" | "rename-tag" | null>(null);
    const [dialogValue, setDialogValue] = React.useState("");
    const [dialogContext, setDialogContext] = React.useState<any>(null);
    const [tagMenuOpen, setTagMenuOpen] = React.useState<string | null>(null);
    const [isTagsExpanded, setIsTagsExpanded] = React.useState(false);

    // Alert states
    const [alertOpen, setAlertOpen] = React.useState(false);
    const [alertType, setAlertType] = React.useState<"delete-note" | "delete-folder" | "delete-tag" | null>(null);
    const [alertContext, setAlertContext] = React.useState<any>(null);

    const toggleFolder = (id: string) => {
        setExpandedFolders(prev => ({ ...prev, [id]: !prev[id] }));
    };

    const handleCreateNote = async (folderId?: string) => {
        try {
            const note = await createNote("Нова нотатка", folderId);
            toast.success("Нотатку створено");
            router.push(`/dashboard/notes/${note.id}`);
        } catch (error) {
            toast.error("Помилка створення");
        }
    };

    const confirmAction = async () => {
        if (!dialogValue.trim()) return;

        try {
            if (dialogType === "create-folder") {
                await createFolder(dialogValue, dialogContext);
                toast.success("Папку створено");
            } else if (dialogType === "rename-folder") {
                await renameFolder(dialogContext.id, dialogValue);
                toast.success("Папку перейменувано");
            } else if (dialogType === "rename-note") {
                await updateNoteAction(dialogContext.id, { title: dialogValue });
                toast.success("Назву змінено");
            } else if (dialogType === "rename-tag") {
                await updateTag(dialogContext.id, { name: dialogValue });
                toast.success("Тег перейменовано");
            }
            setDialogOpen(false);
            setDialogValue("");
        } catch (error) {
            toast.error("Помилка виконання дії");
        }
    };

    const confirmDelete = async () => {
        try {
            if (alertType === "delete-note") {
                await deleteNote(alertContext.id);
                toast.success("Нотатку видалено");
                if (pathname === `/dashboard/notes/${alertContext.id}`) {
                    router.push("/dashboard/notes");
                }
            } else if (alertType === "delete-folder") {
                await deleteFolder(alertContext.id);
                toast.success("Папку видалено");
            } else if (alertType === "delete-tag") {
                await deleteTag(alertContext.id);
                toast.success("Тег видалено");
                if (selectedTag === alertContext.name) setSelectedTag(null);
            }
            setAlertOpen(false);
        } catch (error) {
            toast.error("Помилка видалення");
        }
    };

    const handleImportNotes = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;

        const importData: { title: string, content: string }[] = [];
        const fileArray = Array.from(files);

        toast.info(`Імпортуємо ${fileArray.length} файлів...`);

        try {
            for (const file of fileArray) {
                if (!file.name.endsWith('.txt')) continue;

                const content = await new Promise<string>((resolve, reject) => {
                    const reader = new FileReader();
                    reader.onload = (event) => resolve(event.target?.result as string);
                    reader.onerror = (error) => reject(error);
                    reader.readAsText(file);
                });

                importData.push({
                    title: file.name.replace('.txt', ''),
                    content: content
                });
            }

            if (importData.length > 0) {
                await bulkCreateNotes(importData);
                toast.success(`Успішно імпортовано ${importData.length} нотаток`);
                router.refresh();
            } else {
                toast.error("Не знайдено валідних .txt файлів");
            }
        } catch (error) {
            console.error(error);
            toast.error("Помилка під час імпорту");
        } finally {
            // Reset input
            e.target.value = "";
        }
    };

    const filteredNotes = notes.filter(note => {
        const matchesSearch = note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (note.content && note.content.toLowerCase().includes(searchQuery.toLowerCase()));
        const matchesTag = !selectedTag || (note.tags && note.tags.includes(selectedTag));
        return matchesSearch && matchesTag;
    }).sort((a, b) => {
        if (sortBy === "name-asc" || sortBy === "name-desc") {
            // Remove leading non-alphanumeric characters for sorting
            const cleanA = a.title.replace(/^[^a-zA-Z0-9а-яА-ЯіІїЇєЄ]+/, "").toLowerCase();
            const cleanB = b.title.replace(/^[^a-zA-Z0-9а-яА-ЯіІїЇєЄ]+/, "").toLowerCase();

            const result = cleanA.localeCompare(cleanB);
            return sortBy === "name-asc" ? result : -result;
        }
        if (sortBy === "updated-desc") return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
        if (sortBy === "updated-asc") return new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime();
        if (sortBy === "created-desc") return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        if (sortBy === "created-asc") return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        return 0;
    });

    const rootNotes = filteredNotes.filter(n => !n.folderId);
    const pinnedNotes = notes.filter(n => n.isFavorite);

    const allTags = tags;

    return (
        <div className={cn("flex flex-col h-full w-64 border-r border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950/50", className)}>
            <div className="px-4 pt-4 pb-2 space-y-3">
                <div className="flex items-center justify-between">
                    <h2 className="text-[11px] font-bold uppercase tracking-[0.2em] text-zinc-500">Провідник</h2>
                    <div className="flex items-center gap-1">
                        <NotesSearch />
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-zinc-400 hover:text-foreground"
                            onClick={() => {
                                setDialogType("create-folder");
                                setDialogContext(null);
                                setDialogValue("");
                                setDialogOpen(true);
                            }}
                        >
                            <FolderPlus className="h-3.5 w-3.5" />
                        </Button>

                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-7 w-7 text-zinc-400 hover:text-foreground"
                                    title="Сортування"
                                >
                                    <ArrowUpDown className="h-3.5 w-3.5" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-56">
                                <DropdownMenuItem onClick={() => setSortBy("name-asc")} className="flex items-center justify-between text-xs">
                                    За назвою файлу (А {"->"} Я)
                                    {sortBy === "name-asc" && <Check className="h-3 w-3" />}
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => setSortBy("name-desc")} className="flex items-center justify-between text-xs">
                                    За назвою файлу (Я {"->"} А)
                                    {sortBy === "name-desc" && <Check className="h-3 w-3" />}
                                </DropdownMenuItem>
                                <div className="h-px bg-zinc-100 dark:bg-zinc-800 my-1" />
                                <DropdownMenuItem onClick={() => setSortBy("updated-desc")} className="flex items-center justify-between text-xs">
                                    За часом останньої зміни (від нових до старих)
                                    {sortBy === "updated-desc" && <Check className="h-3 w-3" />}
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => setSortBy("updated-asc")} className="flex items-center justify-between text-xs">
                                    За часом останньої зміни (від старих до нових)
                                    {sortBy === "updated-asc" && <Check className="h-3 w-3" />}
                                </DropdownMenuItem>
                                <div className="h-px bg-zinc-100 dark:bg-zinc-800 my-1" />
                                <DropdownMenuItem onClick={() => setSortBy("created-desc")} className="flex items-center justify-between text-xs">
                                    За часом створення (від нових до старих)
                                    {sortBy === "created-desc" && <Check className="h-3 w-3" />}
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => setSortBy("created-asc")} className="flex items-center justify-between text-xs">
                                    За часом створення (від старих до нових)
                                    {sortBy === "created-asc" && <Check className="h-3 w-3" />}
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>

                        <Button variant="ghost" size="icon" className="h-7 w-7 text-zinc-400 hover:text-foreground" onClick={() => handleCreateNote()}>
                            <Plus className="h-4 w-4" />
                        </Button>
                    </div>
                </div>

                <div className="relative">
                    <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-zinc-400" />
                    <Input
                        placeholder="Швидкий пошук..."
                        className="pl-9 h-8 bg-zinc-100/50 dark:bg-zinc-900/50 border-transparent focus:border-zinc-200 dark:focus:border-zinc-800 text-xs rounded-full transition-all"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
            </div>

            <div className="px-4 py-2 space-y-0.5">
                <Button
                    variant="ghost"
                    className={cn(
                        "w-full justify-start h-8 px-2 gap-2 text-xs font-medium transition-all group",
                        currentView === "graph" ? "bg-blue-500/10 text-blue-500 shadow-[0_0_15px_-3px_rgba(59,130,246,0.2)]" : "text-zinc-500 hover:text-foreground"
                    )}
                    onClick={() => router.push("/dashboard/notes?view=graph")}
                >
                    <Network className={cn("h-3.5 w-3.5 transition-colors", currentView === "graph" ? "text-blue-500" : "text-zinc-400 group-hover:text-blue-500")} />
                    Граф зв'язків
                </Button>

                {allTags.length > 0 && (
                    <div className="pt-0.5">
                        <Button
                            variant="ghost"
                            onClick={() => setIsTagsExpanded(!isTagsExpanded)}
                            className="w-full justify-between h-8 px-2 text-xs font-medium transition-all group text-zinc-500 hover:text-foreground"
                        >
                            <div className="flex items-center gap-2">
                                <TagIcon className="h-3.5 w-3.5 text-zinc-400 group-hover:text-foreground transition-colors" />
                                <span>Теги</span>
                            </div>
                            {isTagsExpanded ? (
                                <ChevronDown className="h-3.5 w-3.5 text-zinc-400 group-hover:text-foreground transition-colors" />
                            ) : (
                                <ChevronRight className="h-3.5 w-3.5 text-zinc-400 group-hover:text-foreground transition-colors" />
                            )}
                        </Button>
                        {isTagsExpanded && (
                            <div className="flex flex-wrap gap-1.5 px-2 mt-2 ml-1 animate-in fade-in slide-in-from-top-1 duration-200">
                                {allTags.map((tag: any) => (
                                    <DropdownMenu key={tag.id} open={tagMenuOpen === tag.id} onOpenChange={(open) => !open && setTagMenuOpen(null)}>
                                        <DropdownMenuTrigger asChild>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={(e) => {
                                                    e.preventDefault();
                                                    setSelectedTag(selectedTag === tag.name ? null : tag.name);
                                                }}
                                                onContextMenu={(e) => {
                                                    e.preventDefault();
                                                    setTagMenuOpen(tag.id);
                                                }}
                                                className={cn(
                                                    "h-7 rounded-full px-3 text-[10px] font-medium transition-all gap-2",
                                                    selectedTag === tag.name
                                                        ? "bg-zinc-900 text-zinc-50 border-transparent dark:bg-zinc-50 dark:text-zinc-900 shadow-sm"
                                                        : "bg-white/5 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                                                )}
                                            >
                                                <div
                                                    className="h-1.5 w-1.5 rounded-full"
                                                    style={{ backgroundColor: tag.color || (selectedTag === tag.name ? (typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches ? '#000' : '#fff') : '#71717a') }}
                                                />
                                                <span>
                                                    #{tag.name}
                                                </span>
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="start" className="w-48">
                                            <div className="px-2 py-2 border-b border-zinc-100 dark:border-zinc-800">
                                                <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-2">Колір тегу</p>
                                                <div className="grid grid-cols-5 gap-1.5">
                                                    {['#ef4444', '#f97316', '#f59e0b', '#10b981', '#3b82f6', '#6366f1', '#8b5cf6', '#ec4899', '#71717a', null].map((color) => (
                                                        <Button
                                                            key={color || 'none'}
                                                            variant="outline"
                                                            size="icon"
                                                            className={cn(
                                                                "h-6 w-6 rounded-full p-0 border transition-transform hover:scale-110",
                                                                tag.color === color && "ring-2 ring-blue-500 ring-offset-2 dark:ring-offset-zinc-950"
                                                            )}
                                                            style={{ backgroundColor: color || 'transparent' }}
                                                            onClick={() => updateTag(tag.id, { color: color || undefined })}
                                                        >
                                                            {!color && <X className="h-3 w-3 text-zinc-400" />}
                                                        </Button>
                                                    ))}
                                                </div>
                                            </div>
                                            <DropdownMenuItem onClick={() => {
                                                setDialogType("rename-tag");
                                                setDialogContext(tag);
                                                setDialogValue(tag.name);
                                                setDialogOpen(true);
                                            }} className="text-xs">
                                                Перейменувати
                                            </DropdownMenuItem>
                                            <DropdownMenuItem onClick={() => {
                                                setAlertType("delete-tag");
                                                setAlertContext(tag);
                                                setAlertOpen(true);
                                            }} className="text-xs text-red-500 focus:text-red-500">
                                                Видалити
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>

            <div className="flex-1 min-h-0 overflow-y-auto px-2 mt-2 space-y-0.5 custom-scrollbar">

                {pinnedNotes.length > 0 && (
                    <div className="mb-4">
                        <h3 className="px-4 text-[10px] font-bold uppercase tracking-widest text-zinc-400/80 mb-2 flex items-center gap-2">
                            <Star className="h-2.5 w-2.5 text-yellow-500/80 fill-yellow-500/20" />
                            Закладки
                        </h3>
                        <div className="space-y-0.5">
                            {pinnedNotes.map((note: any) => (
                                <NoteItem
                                    key={`pinned-${note.id}`}
                                    note={note}
                                    isActive={pathname === `/dashboard/notes/${note.id}`}
                                    onDelete={() => {
                                        setAlertType("delete-note");
                                        setAlertContext(note);
                                        setAlertOpen(true);
                                    }}
                                    onRename={() => {
                                        setDialogType("rename-note");
                                        setDialogContext(note);
                                        setDialogValue(note.title);
                                        setDialogOpen(true);
                                    }}
                                />
                            ))}
                        </div>
                    </div>
                )}

                <div className="px-4 py-2 flex items-center justify-between group/section">
                    <h3 className="text-[10px] font-bold uppercase tracking-widest text-zinc-400/80">Всі нотатки</h3>
                    <div className="h-px flex-1 bg-zinc-100 dark:bg-zinc-900/50 mx-2" />
                </div>

                {folders.map((folder: any) => (
                    <FolderItem
                        key={folder.id}
                        folder={folder}
                        notes={filteredNotes}
                        expanded={expandedFolders[folder.id]}
                        onToggle={() => toggleFolder(folder.id)}
                        onCreateNote={() => handleCreateNote(folder.id)}
                        onCreateFolder={() => {
                            setDialogType("create-folder");
                            setDialogContext(folder.id);
                            setDialogValue("");
                            setDialogOpen(true);
                        }}
                        onDelete={() => {
                            setAlertType("delete-folder");
                            setAlertContext(folder);
                            setAlertOpen(true);
                        }}
                        onRename={() => {
                            setDialogType("rename-folder");
                            setDialogContext(folder);
                            setDialogValue(folder.name);
                            setDialogOpen(true);
                        }}
                    />
                ))}

                {rootNotes.map((note: any) => (
                    <NoteItem
                        key={note.id}
                        note={note}
                        isActive={pathname === `/dashboard/notes/${note.id}`}
                        onDelete={() => {
                            setAlertType("delete-note");
                            setAlertContext(note);
                            setAlertOpen(true);
                        }}
                        onRename={() => {
                            setDialogType("rename-note");
                            setDialogContext(note);
                            setDialogValue(note.title);
                            setDialogOpen(true);
                        }}
                    />
                ))}

            </div>

            {/* Rename/Create Dialog */}
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>
                            {dialogType === "create-folder" && "Створити папку"}
                            {dialogType === "rename-folder" && "Перейменувати папку"}
                            {dialogType === "rename-note" && "Перейменувати нотатку"}
                            {dialogType === "rename-tag" && "Перейменувати тег"}
                        </DialogTitle>
                        <DialogDescription>
                            Введіть назву нижче.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="flex items-center space-x-2">
                        <Input
                            value={dialogValue}
                            onChange={(e) => setDialogValue(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && confirmAction()}
                            autoFocus
                        />
                    </div>
                    <DialogFooter className="sm:justify-end">
                        <Button type="button" variant="secondary" onClick={() => setDialogOpen(false)}>
                            Скасувати
                        </Button>
                        <Button type="button" onClick={confirmAction}>
                            Зберегти
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Alert Dialog */}
            <AlertDialog open={alertOpen} onOpenChange={setAlertOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Ви впевнені?</AlertDialogTitle>
                        <AlertDialogDescription>
                            {alertType === "delete-note" ? "Цю нотатку буде видалено назавжди." : "Цю папку та весь її вміст буде видалено назавжди."}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Скасувати</AlertDialogCancel>
                        <AlertDialogAction onClick={confirmDelete} className={buttonVariants({ variant: "destructive" })}>
                            Видалити
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div >
    );
}

function FolderItem({ folder, notes, expanded, onToggle, onCreateNote, onCreateFolder, onDelete, onRename }: any) {
    const folderNotes = notes.filter((n: any) => n.folderId === folder.id);

    return (
        <div className="space-y-0.5">
            <div className="group flex items-center h-8 px-2 rounded-md hover:bg-zinc-100/80 dark:hover:bg-zinc-900/80 cursor-pointer">
                <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={onToggle}
                    className="flex-1 justify-start gap-2 overflow-hidden px-0 text-[13px] font-medium text-zinc-600 hover:bg-transparent dark:text-zinc-400"
                >
                    <div className="w-4 h-4 flex items-center justify-center">
                        {expanded ? <ChevronDown className="h-3 w-3 shrink-0" /> : <ChevronRight className="h-3 w-3 shrink-0" />}
                    </div>
                    <Folder className={cn(
                        "h-3.5 w-3.5 shrink-0 transition-colors",
                        expanded ? "text-blue-500 fill-blue-500/10" : "text-zinc-400"
                    )} />
                    <span className="truncate">{folder.name}</span>
                </Button>
                <div className="opacity-0 group-hover:opacity-100 flex items-center gap-0.5">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-6 w-6 text-zinc-400 hover:text-foreground">
                                <MoreVertical className="h-3 w-3" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                            <DropdownMenuItem onClick={onCreateNote} className="gap-2">
                                <Plus className="h-3.5 w-3.5" /> Нова нотатка
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={onCreateFolder} className="gap-2">
                                <FolderPlus className="h-3.5 w-3.5" /> Нова папка
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={onRename}>Перейменувати</DropdownMenuItem>
                            <DropdownMenuItem onClick={onDelete} className="text-red-600 focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-900/10">Видалити</DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>
            {expanded && (
                <div className="ml-4 pl-1 border-l border-zinc-100 dark:border-zinc-900 space-y-0.5 animate-in fade-in slide-in-from-left-2 duration-200">
                    {folderNotes.map((note: any) => (
                        <NoteItem key={note.id} note={note} isActive={false} />
                    ))}
                </div>
            )}
        </div>
    );
}

function NoteItem({ note, isActive, onDelete, onRename }: any) {
    const router = useRouter();
    const pathname = usePathname();
    const active = isActive || pathname === `/dashboard/notes/${note.id}`;

    return (
        <div className={cn(
            "group relative flex items-center rounded-md px-1 transition-all duration-200",
            active ? "bg-blue-500/5 dark:bg-blue-500/10" : "hover:bg-zinc-100 dark:hover:bg-zinc-900"
        )}>
            {active && (
                <div className="absolute left-0 w-0.5 h-4 bg-blue-500 rounded-full" />
            )}

            <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => router.push(`/dashboard/notes/${note.id}`)}
                className={cn(
                    "flex-1 justify-start h-8 px-2 text-[13px] gap-2 overflow-hidden hover:bg-transparent",
                    active ? "text-blue-600 dark:text-blue-400 font-semibold" : "text-zinc-600 dark:text-zinc-400"
                )}
            >
                <FileText className={cn("h-3.5 w-3.5 shrink-0 transition-colors", active ? "text-blue-500" : "text-zinc-400 group-hover:text-zinc-500")} />
                <span className="truncate">{note.title || "Без назви"}</span>
            </Button>

            {onDelete && onRename && (
                <div className="opacity-0 group-hover:opacity-100 shrink-0 transition-opacity">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-6 w-6 text-zinc-400 hover:text-foreground">
                                <MoreVertical className="h-3 w-3" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                            <DropdownMenuItem onClick={onRename}>Перейменувати</DropdownMenuItem>
                            <DropdownMenuItem onClick={onDelete} className="text-red-600 focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-900/10">Видалити</DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            )}
        </div>
    );
}
