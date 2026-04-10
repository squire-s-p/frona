"use client";

import * as React from "react";
import {
    Inbox,
    CalendarDays,
    Calendar,
    CheckCircle2,
    Hash,
    ListFilter,
    MoreHorizontal,
    ChevronDown,
    ChevronRight,
    Pencil,
    Trash2,
    Pin,
    ExternalLink,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
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
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    updateProjectName,
    deleteProject,
    updateTagName,
    deleteTag,
    toggleProjectPin,
    toggleTagPin,
} from "@/server/tasks/actions";
import { toast } from "sonner";
import type { ProjectOption, TagOption } from "./tasks-client";

const EMOJIS = ["🏷️", "🔥", "⭐", "🚀", "💡", "📅", "✅", "🛒", "💻", "📚", "🎨", "🎵", "🛠️", "🏠", "💊"];

type FilterType = "inbox" | "today" | "upcoming" | "completed";

interface TasksSidebarProps {
    className?: string;
    selectedFilter: FilterType | string;
    onSelectFilter: (filter: string) => void;
    projects: ProjectOption[];
    tags: TagOption[];
    counts?: { [key: string]: number };
}

export function TasksSidebar({
    className,
    selectedFilter,
    onSelectFilter,
    projects,
    tags,
    counts,
}: TasksSidebarProps) {
    const router = useRouter();
    const [isProjectsOpen, setIsProjectsOpen] = React.useState(true);
    const [isTagsOpen, setIsTagsOpen] = React.useState(true);

    // Edit/Delete States
    const [renamingItem, setRenamingItem] = React.useState<{ id: string; name: string; color?: string | null; type: "project" | "tag" } | null>(null);
    const [deletingItem, setDeletingItem] = React.useState<{ id: string; name: string; type: "project" | "tag" } | null>(null);
    const [newName, setNewName] = React.useState("");
    const [selectedEmoji, setSelectedEmoji] = React.useState<string | null>(null);
    const [isPending, setIsPending] = React.useState(false);

    const mainFilters = [
        { id: "inbox", label: "Вхідні", icon: Inbox, count: counts?.inbox ?? 0 },
        { id: "today", label: "Сьогодні", icon: CalendarDays, count: counts?.today ?? 0 },
        { id: "upcoming", label: "Наступні 7 днів", icon: Calendar, count: counts?.upcoming ?? 0 },
        { id: "completed", label: "Завершені", icon: CheckCircle2, count: counts?.completed ?? 0 },
    ];

    async function handleRename() {
        if (!renamingItem || !newName.trim()) return;
        setIsPending(true);
        try {
            if (renamingItem.type === "project") {
                await updateProjectName(renamingItem.id, newName);
            } else {
                await updateTagName(renamingItem.id, newName, selectedEmoji);
            }
            toast.success("Дані оновлено");
            setRenamingItem(null);
        } catch (error) {
            toast.error("Помилка при оновленні");
        } finally {
            setIsPending(false);
        }
    }

    async function handleDelete() {
        if (!deletingItem) return;
        setIsPending(true);
        try {
            if (deletingItem.type === "project") {
                await deleteProject(deletingItem.id);
            } else {
                await deleteTag(deletingItem.id);
            }
            toast.success("Видалено успішно");
            if (selectedFilter === deletingItem.id) {
                onSelectFilter("inbox");
            }
            setDeletingItem(null);
        } catch (error) {
            toast.error("Помилка при видаленні");
        } finally {
            setIsPending(false);
        }
    }

    const sortedProjects = React.useMemo(() => {
        return [...projects].sort((a, b) => {
            const aP = (a as any).isPinned ? 1 : 0;
            const bP = (b as any).isPinned ? 1 : 0;
            return bP - aP;
        });
    }, [projects]);

    const sortedTags = React.useMemo(() => {
        return [...tags].sort((a, b) => {
            const aP = (a as any).isPinned ? 1 : 0;
            const bP = (b as any).isPinned ? 1 : 0;
            return bP - aP;
        });
    }, [tags]);

    return (
        <div className={cn("flex flex-col h-full min-h-0 border-r bg-muted/10", className)}>
            {/* 1. Закріплена частина (Основні фільтри) */}
            <div className="shrink-0 px-3 py-3 border-b bg-muted/5">
                <div className="space-y-1">
                    {mainFilters.map((item) => (
                        <Button
                            key={item.id}
                            variant={selectedFilter === item.id ? "secondary" : "ghost"}
                            className={cn(
                                "w-full justify-start gap-2 h-9 font-normal transition-colors",
                                selectedFilter === item.id && "bg-secondary font-medium"
                            )}
                            onClick={() => onSelectFilter(item.id)}
                        >
                            <item.icon className="h-4 w-4 text-muted-foreground" />
                            <span className="flex-1 text-left">{item.label}</span>
                            {item.id !== "completed" && item.count > 0 && (
                                <span className="text-xs text-muted-foreground">{item.count}</span>
                            )}
                        </Button>
                    ))}
                </div>
            </div>

            {/* 2. Прокручувана частина (Проєкти та Мітки) */}
            <div className="flex-1 overflow-y-auto px-3 py-4 scrollbar-hide">
                <div className="space-y-6">

                    {/* Projects */}
                    <Collapsible open={isProjectsOpen} onOpenChange={setIsProjectsOpen}>
                        <div className="flex items-center justify-between px-2 mb-2 group">
                            <CollapsibleTrigger asChild>
                                <Button 
                                    variant="ghost" 
                                    size="sm" 
                                    className="h-auto p-0 flex items-center gap-1 text-xs font-semibold text-muted-foreground uppercase tracking-wider hover:text-foreground transition-colors hover:bg-transparent"
                                >
                                    {isProjectsOpen ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
                                    ПРОЄКТИ
                                </Button>
                            </CollapsibleTrigger>
                        </div>
                        <CollapsibleContent className="space-y-1">
                            {sortedProjects.map((project) => (
                                <div key={project.id} className="group relative">
                                    <Button
                                        variant={selectedFilter === project.id ? "secondary" : "ghost"}
                                        className={cn(
                                            "w-full justify-start gap-2 h-9 font-normal pr-12 relative transition-all",
                                            selectedFilter === project.id && "bg-secondary font-medium"
                                        )}
                                        onClick={() => onSelectFilter(project.id)}
                                    >
                                        <div className="flex items-center gap-2 flex-1 truncate">
                                            <Hash className={cn("h-3.5 w-3.5 shrink-0 text-muted-foreground", (project as any).isPinned && "text-primary fill-primary/10")} />
                                            <span className="truncate">{project.name}</span>
                                        </div>
                                        {(project as any).isPinned && (
                                            <Pin className="h-2.5 w-2.5 absolute right-9 text-primary fill-current opacity-60" />
                                        )}
                                    </Button>

                                    <div className="absolute right-1 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon" className="h-7 w-7">
                                                    <MoreHorizontal className="h-3.5 w-3.5" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end" className="w-48">
                                                <DropdownMenuItem onClick={() => router.push(`/dashboard/projects/${project.id}`)}>
                                                    <ExternalLink className="mr-2 h-4 w-4" />
                                                    Відкрити проєкт
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onClick={async () => {
                                                    try {
                                                        await toggleProjectPin(project.id, !(project as any).isPinned);
                                                        toast.success((project as any).isPinned ? "Відкріплено" : "Закріплено");
                                                    } catch (e) {
                                                        toast.error("Помилка");
                                                    }
                                                }}>
                                                    <Pin className={cn("mr-2 h-4 w-4", (project as any).isPinned && "fill-current text-primary")} />
                                                    {(project as any).isPinned ? "Відкріпити" : "Закріпити"}
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </div>
                                </div>
                            ))}
                        </CollapsibleContent>
                    </Collapsible>

                    {/* Tags */}
                    <Collapsible open={isTagsOpen} onOpenChange={setIsTagsOpen}>
                        <div className="flex items-center justify-between px-2 mb-2">
                            <CollapsibleTrigger asChild>
                                <Button 
                                    variant="ghost" 
                                    size="sm" 
                                    className="h-auto p-0 flex items-center gap-1 text-xs font-semibold text-muted-foreground uppercase tracking-wider hover:text-foreground transition-colors hover:bg-transparent"
                                >
                                    {isTagsOpen ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
                                    МІТКИ
                                </Button>
                            </CollapsibleTrigger>
                        </div>
                        <CollapsibleContent className="space-y-1">
                            {sortedTags.map((tag) => (
                                <div key={tag.id} className="group relative">
                                    <Button
                                        variant={selectedFilter === tag.id ? "secondary" : "ghost"}
                                        className={cn(
                                            "w-full justify-start gap-2 h-9 font-normal pr-12 relative transition-all",
                                            selectedFilter === tag.id && "bg-secondary font-medium"
                                        )}
                                        onClick={() => onSelectFilter(tag.id)}
                                    >
                                        <div className="flex items-center gap-2 flex-1 truncate">
                                            <div className="flex items-center justify-center w-4 h-4 shrink-0">
                                                {(tag as any).color ? (
                                                    <span className="text-sm">{(tag as any).color}</span>
                                                ) : (
                                                    <ListFilter className={cn("h-3.5 w-3.5 text-muted-foreground", (tag as any).isPinned && "text-primary fill-primary/10")} />
                                                )}
                                            </div>
                                            <span className="truncate">{tag.name}</span>
                                        </div>
                                        {(tag as any).isPinned && (
                                            <Pin className="h-2.5 w-2.5 absolute right-9 text-primary fill-current opacity-60" />
                                        )}
                                    </Button>

                                    <div className="absolute right-1 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon" className="h-7 w-7">
                                                    <MoreHorizontal className="h-3.5 w-3.5" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end" className="w-48">
                                                <DropdownMenuItem
                                                    onClick={() => {
                                                        setRenamingItem({ id: tag.id, name: tag.name, color: (tag as any).color, type: "tag" });
                                                        setNewName(tag.name);
                                                        setSelectedEmoji((tag as any).color || null);
                                                    }}
                                                >
                                                    <Pencil className="mr-2 h-4 w-4" />
                                                    Редагувати
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onClick={async () => {
                                                    try {
                                                        await toggleTagPin(tag.id, !(tag as any).isPinned);
                                                        toast.success((tag as any).isPinned ? "Відкріплено" : "Закріплено");
                                                    } catch (e) {
                                                        toast.error("Помилка");
                                                    }
                                                }}>
                                                    <Pin className={cn("mr-2 h-4 w-4", (tag as any).isPinned && "fill-current text-primary")} />
                                                    {(tag as any).isPinned ? "Відкріпити" : "Закріпити"}
                                                </DropdownMenuItem>
                                                <DropdownMenuSeparator />
                                                <DropdownMenuItem
                                                    variant="destructive"
                                                    onClick={() => setDeletingItem({ id: tag.id, name: tag.name, type: "tag" })}
                                                >
                                                    <Trash2 className="mr-2 h-4 w-4" />
                                                    Видалити
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </div>
                                </div>
                            ))}
                        </CollapsibleContent>
                    </Collapsible>
                </div>
            </div>

            {/* Rename Dialog */}
            <Dialog open={!!renamingItem} onOpenChange={(open) => !open && setRenamingItem(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Редагувати назву</DialogTitle>
                    </DialogHeader>
                    <div className="py-4 space-y-4">
                        <div className="grid gap-2">
                            <Label htmlFor="name">Назва</Label>
                            <Input
                                id="name"
                                value={newName}
                                onChange={(e) => setNewName(e.target.value)}
                                onKeyDown={(e) => e.key === "Enter" && handleRename()}
                                autoFocus
                            />
                        </div>

                        {renamingItem?.type === "tag" && (
                            <div className="grid gap-2">
                                <Label>Іконка (Emoji)</Label>
                                <div className="grid grid-cols-5 gap-2 border p-2 rounded-md">
                                    <Button
                                        variant="outline"
                                        size="icon"
                                        onClick={() => setSelectedEmoji(null)}
                                        className={cn(
                                            "h-10 w-10 p-2 hover:bg-muted rounded-md transition-colors text-xs flex items-center justify-center border",
                                            !selectedEmoji && "bg-secondary border-primary/20"
                                        )}
                                    >
                                        <ListFilter className="h-3 w-3" />
                                    </Button>
                                    {EMOJIS.map((emoji) => (
                                        <Button
                                            key={emoji}
                                            variant="outline"
                                            size="icon"
                                            onClick={() => setSelectedEmoji(emoji)}
                                            className={cn(
                                                "h-10 w-10 p-2 hover:bg-muted rounded-md transition-colors text-lg flex items-center justify-center border",
                                                selectedEmoji === emoji && "bg-secondary border-primary/20"
                                            )}
                                        >
                                            {emoji}
                                        </Button>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                    <DialogFooter>
                        <Button variant="ghost" onClick={() => setRenamingItem(null)} disabled={isPending}>
                            Скасувати
                        </Button>
                        <Button onClick={handleRename} disabled={isPending || !newName.trim()}>
                            Зберегти
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation */}
            <AlertDialog open={!!deletingItem} onOpenChange={(open) => !open && setDeletingItem(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Ви впевнені?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Ви збираєтеся видалити {deletingItem?.type === "project" ? "проєкт" : "мітку"} "<strong>{deletingItem?.name}</strong>".
                            Цю дію неможливо буде скасувати.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isPending}>Скасувати</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={(e) => {
                                e.preventDefault();
                                handleDelete();
                            }}
                            disabled={isPending}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            Видалити
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
