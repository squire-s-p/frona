"use client";

import * as React from "react";
import { format, formatDistanceToNow } from "date-fns";
import { uk } from "date-fns/locale";

import {
    CheckCircle2,
    Circle,
    Calendar,
    Flag,
    Hash,
    Tag,
    Trash,
    Trash2,
    MoreVertical,
    X,
    MessageSquare,
    Link2,
    Clock,
    Pin,
    ChevronRight,
    Search,
    Plus,
    Wand2,
    CalendarIcon,
    File,
    Image as ImageIcon,
    FileText,
    CornerDownLeft
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { TaskRow, ProjectOption, TagOption } from "./tasks-client";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { toast } from "sonner";
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
    updateTask,

    deleteTask,
    addTaskComment,
    getTaskComments,
    deleteTaskComment,
    toggleTaskStatus,
    deleteTaskAttachment
} from "@/server/tasks/actions";

import { TagSelect } from "./tag-select";
import { ProjectSelect } from "./project-select";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { RichTextEditor } from "./rich-text-editor";


type RecurrenceFrequency = "daily" | "weekly" | "monthly" | "yearly";

function AdvancedDatePicker({
    range,
    setRange,
    isRecurring,
    setIsRecurring,
    recurrenceFrequency,
    setRecurrenceFrequency,
    setDateOpen
}: {
    range: { from: Date | undefined; to?: Date | undefined };
    setRange: (r: { from: Date | undefined; to?: Date | undefined }) => void;
    isRecurring: boolean;
    setIsRecurring: (v: boolean) => void;
    recurrenceFrequency: RecurrenceFrequency;
    setRecurrenceFrequency: (v: RecurrenceFrequency) => void;
    setDateOpen: (v: boolean) => void;
}) {

    const [mode, setMode] = React.useState<"date" | "duration">("date");

    const setShortcut = (type: "today" | "tomorrow" | "next-week" | "next-month") => {
        const d = new Date();
        if (type === "tomorrow") d.setDate(d.getDate() + 1);
        if (type === "next-week") d.setDate(d.getDate() + 7);
        if (type === "next-month") d.setMonth(d.getMonth() + 1);
        setRange({ from: d, to: undefined });
    };

    return (
        <div className="flex flex-col text-foreground p-3 space-y-4">
            <div className="flex bg-muted/30 p-1 rounded-lg">
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setMode("date")}
                    className={cn("flex-1 h-7 text-xs font-medium rounded-md transition-colors", mode === "date" ? "bg-background shadow-xs hover:bg-background" : "hover:bg-background/50")}
                >
                    Дата
                </Button>
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setMode("duration")}
                    className={cn("flex-1 h-7 text-xs font-medium rounded-md transition-colors", mode === "duration" ? "bg-background shadow-xs hover:bg-background" : "hover:bg-background/50")}
                >
                    Тривалість
                </Button>
            </div>

            {mode === "date" ? (
                <>
                    <div className="flex justify-between px-2">
                        <Button variant="ghost" size="icon" onClick={() => setShortcut("today")} className="h-9 w-9 hover:bg-muted rounded-md transition-colors"><MessageSquare className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" onClick={() => setShortcut("tomorrow")} className="h-9 w-9 hover:bg-muted rounded-md transition-colors"><Clock className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" onClick={() => setShortcut("next-week")} className="h-9 w-9 hover:bg-muted rounded-md transition-colors"><Calendar className="h-4 w-4" /></Button>
                    </div>

                    <CalendarComponent
                        mode="single"
                        locale={uk}
                        selected={range?.from}
                        onSelect={(d) => setRange({ from: d ?? undefined, to: undefined })}
                        className="w-full flex justify-center !p-0"
                    />
                </>
            ) : (
                <CalendarComponent
                    mode="range"
                    locale={uk}
                    selected={{ from: range?.from, to: range?.to }}
                    onSelect={(r: any) => setRange(r ?? { from: undefined, to: undefined })}
                    className="w-full flex justify-center !p-0"
                />
            )}

            <div className="flex items-center gap-2 pt-2 border-t mt-2">
                <Button variant="ghost" size="sm" className="flex-1 h-9" onClick={() => { setRange({ from: undefined, to: undefined }); setIsRecurring(false); }}>
                    Очистити
                </Button>
                <Button size="sm" className="flex-1 h-9 bg-primary text-primary-foreground border shadow-sm" onClick={() => {
                    setDateOpen(false);
                }}>
                    OK
                </Button>
            </div>
        </div>
    );
}

function priorityLabel(p: string) {
    const priority = p.toUpperCase();
    switch (priority) {
        case "LOW": return "Низький";
        case "MEDIUM": return "Середній";
        case "HIGH": return "Високий";
        case "NONE": return "Пріоритет";
        default: return priority;
    }
}

function priorityIcon(p: string) {
    const level = p === "HIGH" ? 3 : p === "MEDIUM" ? 2 : p === "LOW" ? 1 : 0;
    if (level === 0) return <Flag className="h-3.5 w-3.5" />;
    return (
        <div className="flex items-center gap-0.5">
            <Flag className={cn(
                "h-3.5 w-3.5",
                level === 3 ? "fill-red-500 text-red-500" :
                    level === 2 ? "fill-orange-500 text-orange-500" :
                        "fill-blue-500 text-blue-500"
            )} />
        </div>
    );
}


// Comments Type
type TaskCommentRow = {
    id: string;
    body: string;
    createdAt: Date;
    user: { name: string | null; email: string | null; image: string | null } | null;
};

export function TaskDetailView({
    task: initialTask,
    onClose,
    onToggleStatus,
    onUpdate,
    projects = [],
    tags = []
}: {
    task: TaskRow | null;
    onClose: () => void;
    onToggleStatus?: (taskId: string, isDone: boolean) => void;
    onUpdate?: () => void;
    projects?: ProjectOption[];
    tags?: TagOption[];
}) {
    const [pending, startTransition] = React.useTransition();
    const [task, setTask] = React.useState<TaskRow | null>(initialTask);
    const [title, setTitle] = React.useState(initialTask?.title || "");
    const [description, setDescription] = React.useState(initialTask?.description || "");
    const [comment, setComment] = React.useState("");
    const [comments, setComments] = React.useState<TaskCommentRow[]>([]);
    const [commentsLoading, setCommentsLoading] = React.useState(false);
    const [attachments, setAttachments] = React.useState<any[]>([]);
    const [attachmentsLoading, setAttachmentsLoading] = React.useState(false);
    const [dateOpen, setDateOpen] = React.useState(false);
    const [showDeleteDialog, setShowDeleteDialog] = React.useState(false);


    // Date range for picker
    const [range, setRange] = React.useState<{ from: Date | undefined; to?: Date | undefined }>({
        from: initialTask?.startDate ? new Date(initialTask.startDate) : undefined,
        to: initialTask?.endDate ? new Date(initialTask.endDate) : undefined,
    });
    const [isRecurring, setIsRecurring] = React.useState(false);
    const [recurrenceFrequency, setRecurrenceFrequency] = React.useState<RecurrenceFrequency>("daily");

    // Sync state when initialTask changes
    React.useEffect(() => {
        setTask(initialTask);
        if (initialTask) {
            setTitle(initialTask.title);
            setDescription(initialTask.description || "");
            setRange({
                from: initialTask.startDate ? new Date(initialTask.startDate) : undefined,
                to: initialTask.endDate ? new Date(initialTask.endDate) : undefined,
            });
            loadComments(initialTask.id);
            loadAttachments(initialTask.id);
        }
    }, [initialTask]);

    async function loadAttachments(taskId: string) {
        setAttachmentsLoading(true);
        try {
            const { getTaskAttachments } = await import("@/server/tasks/actions");
            const data = await getTaskAttachments(taskId);
            setAttachments(data);
        } finally {
            setAttachmentsLoading(false);
        }
    }

    async function loadComments(taskId: string) {
        setCommentsLoading(true);
        try {
            const data = await getTaskComments(taskId);
            setComments(data as unknown as TaskCommentRow[]);
        } finally {
            setCommentsLoading(false);
        }
    }

    async function handleUpdate(updates: any) {
        if (!task) return;

        // Ensure title is present if we are updating it, otherwise use provided updates
        const fullUpdates = {
            ...updates
        };


        // Optimistic update
        const updatedTask = { ...task, ...updates };
        setTask(updatedTask);

        startTransition(async () => {
            try {
                await updateTask(task.id, fullUpdates);
                onUpdate?.();
            } catch (error) {
                console.error("Update error:", error);
                toast.error("Не вдалося оновити завдання");
                setTask(task); // Revert
            }
        });
    }

    async function handleAddComment() {
        if (!task || !comment.trim()) return;
        const text = comment.trim();
        setComment("");

        startTransition(async () => {
            try {
                await addTaskComment(task.id, text);
                await loadComments(task.id);
            } catch (error) {
                toast.error("Не вдалося додати коментар");
                setComment(text);
            }
        });
    }

    async function handleDeleteComment(commentId: string) {
        startTransition(async () => {
            try {
                await deleteTaskComment(commentId);
                setComments(prev => prev.filter(c => c.id !== commentId));
            } catch (error) {
                toast.error("Не вдалося видалити коментар");
            }
        });
    }

    async function handleDeleteAttachment(attachmentId: string) {
        startTransition(async () => {
            try {
                await deleteTaskAttachment(attachmentId);
                setAttachments(prev => prev.filter(a => a.id !== attachmentId));
                toast.success("Вкладення видалено");
            } catch (error) {
                toast.error("Не вдалося видалити вкладення");
            }
        });
    }

    async function handleDeleteTask() {

        if (!task) return;
        setShowDeleteDialog(true);
    }

    async function confirmDelete() {
        if (!task) return;

        startTransition(async () => {
            try {
                await deleteTask(task.id);
                setShowDeleteDialog(false);
                onClose();
                onUpdate?.();
            } catch (error) {
                toast.error("Не вдалося видалити завдання");
            }
        });
    }


    if (!task) {
        return (
            <div className="h-full flex flex-col items-center justify-center text-muted-foreground p-4 text-center">
                <p>Виберіть завдання, щоб побачити деталі</p>
            </div>
        );
    }

    return (
        <div className="h-full flex flex-col bg-background relative border-l">
            {/* Header / Breadcrumb */}
            <div className="flex items-center justify-between px-4 border-b h-14 shrink-0 bg-background/50 backdrop-blur-sm sticky top-0 z-20">
                <div className="flex items-center gap-3">
                    <Button variant="ghost" size="icon" onClick={onClose} className="md:hidden h-8 w-8">
                        <X className="h-4 w-4" />
                    </Button>

                    <div className="flex items-center">
                        <Checkbox
                            checked={task.status === "DONE"}
                            onCheckedChange={() => onToggleStatus?.(task.id, task.status !== "DONE")}
                            className="size-5"
                        />
                    </div>



                    <Separator orientation="vertical" className="h-4 opacity-50" />

                    {/* Date in Header (Clickable) */}
                    <Popover open={dateOpen} onOpenChange={setDateOpen}>
                        <PopoverTrigger asChild>
                            <Button 
                                variant="ghost" 
                                size="sm" 
                                className="h-auto p-1.5 flex items-center gap-1.5 overflow-hidden hover:bg-muted/50 rounded transition-colors group/date shrink-0"
                            >
                                <Calendar className="h-3.5 w-3.5 text-muted-foreground/40 shrink-0 group-hover/date:text-primary transition-colors" />
                                <div className="flex items-center gap-1.5 whitespace-nowrap overflow-hidden">
                                    {task.startDate ? (
                                        <>
                                            <span className={cn(
                                                "text-[12px] font-bold tracking-tight",
                                                new Date(task.startDate) < new Date() && task.status !== "DONE" ? "text-red-500/90" : "text-foreground/60"
                                            )}>
                                                {formatDistanceToNow(new Date(task.startDate), { addSuffix: true, locale: uk })}
                                            </span>
                                            <span className="text-[10px] text-muted-foreground/20 font-black">•</span>
                                            <span className="text-[12px] text-muted-foreground/60 font-medium whitespace-nowrap">
                                                {format(new Date(task.startDate), "d MMM", { locale: uk })}
                                            </span>
                                        </>
                                    ) : (
                                        <span className="text-[11px] text-muted-foreground/40 font-medium italic">Дату не встановлено</span>
                                    )}
                                </div>
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-[320px] p-0 overflow-hidden bg-background border rounded-lg shadow-xl" align="start" sideOffset={8}>
                            <AdvancedDatePicker
                                range={range}
                                setRange={(r) => {
                                    setRange(r);
                                    handleUpdate({
                                        startDate: r.from?.toISOString() || null,
                                        endDate: r.to?.toISOString() || null
                                    });
                                }}
                                isRecurring={isRecurring}
                                setIsRecurring={setIsRecurring}
                                recurrenceFrequency={recurrenceFrequency}
                                setRecurrenceFrequency={setRecurrenceFrequency}
                                setDateOpen={setDateOpen}
                            />
                        </PopoverContent>
                    </Popover>


                </div>
                <div className="flex items-center gap-1">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreVertical className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                            <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={handleDeleteTask}>
                                <Trash className="h-4 w-4 mr-2" />
                                Видалити завдання
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                    <Button variant="ghost" size="icon" onClick={onClose} className="hidden md:flex h-8 w-8">
                        <X className="h-4 w-4" />
                    </Button>
                </div>
            </div>


            <ScrollArea className="flex-1">
                <div className="p-6 max-w-3xl mx-auto space-y-8 pb-20">
                    {/* Status & Title */}
                    <div className="flex items-center min-h-[48px]">
                        <Textarea
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            onBlur={() => title !== task.title && handleUpdate({ title })}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    e.preventDefault();
                                    e.currentTarget.blur();
                                }
                            }}
                            className="text-2xl font-bold dark:bg-input/30 bg-transparent border border-input rounded-md px-4 py-2 resize-none w-full shadow-xs placeholder:text-muted-foreground/30 flex items-center break-all overflow-hidden transition-[color,box-shadow] outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]"
                            placeholder="Назва завдання"
                            rows={1}
                        />

                    </div>






                    {/* Meta Badges */}
                    <div className="grid gap-3">
                        <div className="flex flex-wrap gap-2">




                            {/* Priority Selection */}
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>

                                    <Button variant="outline" size="sm" className="h-8 gap-2 bg-muted/20 border-0 hover:bg-muted/40 transition-colors">
                                        <div className={cn(
                                            "flex items-center gap-1.5",
                                            task.priority === "HIGH" && "text-red-500",
                                            task.priority === "MEDIUM" && "text-orange-500",
                                            task.priority === "LOW" && "text-blue-500"
                                        )}>
                                            {priorityIcon(task.priority)}
                                            <span className="text-xs font-medium">{priorityLabel(task.priority)}</span>
                                        </div>
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent className="w-48">
                                    <DropdownMenuItem onClick={() => handleUpdate({ priority: "NONE" })}>Не встановлено</DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => handleUpdate({ priority: "LOW" })}>Низький</DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => handleUpdate({ priority: "MEDIUM" })}>Середній</DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => handleUpdate({ priority: "HIGH" })}>Високий</DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>

                            {/* Project Selection */}
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button variant="outline" size="sm" className="h-8 gap-2 bg-muted/20 border-0 hover:bg-muted/40 transition-colors">
                                        <Hash className="h-3.5 w-3.5 text-muted-foreground" />
                                        <span className="text-xs">{task.project?.name || "Вхідні"}</span>
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-56 p-0" align="start">
                                    <ProjectSelect
                                        projects={projects}
                                        value={task.project?.id || null}
                                        onChange={(projectId) => handleUpdate({ projectId })}
                                    />
                                </PopoverContent>
                            </Popover>

                            {/* Tags Selection */}
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button variant="outline" size="sm" className="h-8 gap-2 bg-muted/20 border-0 hover:bg-muted/40 transition-colors">
                                        <Tag className="h-3.5 w-3.5 text-muted-foreground" />
                                        <div className="flex gap-1.5 items-center">
                                            {task.tags.length > 0 ? (
                                                task.tags.slice(0, 3).map((tag) => (
                                                    <span key={tag.id} className="text-[11px] font-bold text-foreground/60">
                                                        #{tag.name}
                                                    </span>
                                                ))
                                            ) : (
                                                <span className="text-xs text-muted-foreground/60">Мітки</span>
                                            )}
                                            {task.tags.length > 3 && <span className="text-[10px] text-muted-foreground/40 font-black self-center">+{task.tags.length - 3}</span>}
                                        </div>


                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-64 p-0" align="start">
                                    <TagSelect
                                        tags={tags}
                                        value={task.tags.map(t => t.id)}
                                        onChange={(tagIds) => handleUpdate({ tagIds })}
                                        hideTrigger={true}
                                    />

                                </PopoverContent>
                            </Popover>
                        </div>


                        {/* Description */}
                        <div className="mt-2 min-h-[200px]">
                            <RichTextEditor
                                content={description}
                                onChange={(val: string) => {
                                    setDescription(val);
                                }}
                                onSave={(newDescription) => handleUpdate({ description: newDescription })}
                            />

                        </div>






                        {/* Attachments Section */}
                        {(attachmentsLoading || attachments.length > 0) && (
                            <div className="space-y-3 mt-6">
                                <div className="flex items-center gap-2 text-sm font-semibold px-1">
                                    <Link2 className="h-4 w-4" />
                                    Вкладення
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    {attachmentsLoading ? (
                                        <div className="text-xs text-muted-foreground animate-pulse">Завантаження...</div>
                                    ) : (
                                        attachments.map(att => (
                                            <a
                                                key={att.id}
                                                href={att.url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="group/att flex items-center gap-3 p-3 rounded-xl bg-muted/10 border border-border/50 hover:bg-muted/20 hover:border-primary/30 transition-all hover:shadow-lg hover:shadow-primary/5 hover:-translate-y-0.5"
                                            >
                                                <div className="h-10 w-10 rounded-lg bg-muted/20 flex items-center justify-center shrink-0 border border-border group-hover/att:border-foreground/20 transition-colors shadow-sm">
                                                    {att.mimeType?.startsWith("image/") ? (
                                                        <ImageIcon className="h-5 w-5 text-foreground/70" />
                                                    ) : att.mimeType?.includes("pdf") ? (
                                                        <FileText className="h-5 w-5 text-foreground/70" />
                                                    ) : (
                                                        <File className="h-5 w-5 text-foreground/70" />
                                                    )}
                                                </div>
                                                <div className="flex flex-col min-w-0">
                                                    <span className="text-[13px] font-semibold truncate group-hover/att:text-foreground transition-colors">{att.name}</span>
                                                    <span className="text-[10px] text-muted-foreground/60 font-medium">
                                                        {(att.size / 1024).toFixed(1)} KB
                                                    </span>
                                                </div>
                                                <div className="ml-auto flex items-center gap-1 opacity-0 group-hover/att:opacity-100 transition-all">
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-full"
                                                        onClick={(e) => {
                                                            e.preventDefault();
                                                            e.stopPropagation();
                                                            handleDeleteAttachment(att.id);
                                                        }}
                                                    >
                                                        <X className="h-3.5 w-3.5" />
                                                    </Button>
                                                </div>
                                            </a>
                                        ))
                                    )}
                                </div>


                            </div>
                        )}
                    </div>

                    <Separator className="opacity-50" />

                    {/* Comments Section */}
                    <div className="space-y-6">
                        <div className="flex items-center gap-2 text-sm font-semibold px-1">

                            <MessageSquare className="h-4 w-4" />
                            Коментарі
                        </div>


                        <div className="space-y-4">
                            {commentsLoading ? (
                                <div className="text-xs text-muted-foreground animate-pulse">Завантаження...</div>
                            ) : comments.length === 0 ? (
                                <div className="text-xs text-muted-foreground italic">Коментарів поки немає</div>
                            ) : (
                                comments.map(c => (
                                    <div key={c.id} className="group relative flex gap-4 p-4 rounded-2xl bg-neutral-200/50 dark:bg-neutral-800 border border-black/5 dark:border-white/5 hover:shadow-xl hover:shadow-black/5 transition-all">
                                        <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/10 flex items-center justify-center shrink-0 shadow-inner">
                                            <span className="text-xs font-bold text-primary tracking-tighter">{c.user?.name?.[0] || 'U'}</span>
                                        </div>
                                        <div className="flex-1 space-y-1.5 pt-1">
                                            <div className="flex items-center justify-between">
                                                <span className="text-[13px] font-bold tracking-tight">{c.user?.name || "Користувач"}</span>
                                                <div className="flex items-center gap-3">
                                                    <span className="text-[10px] text-muted-foreground/60 font-medium">
                                                        {format(new Date(c.createdAt), "dd MMM HH:mm", { locale: uk })}
                                                    </span>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => handleDeleteComment(c.id)}
                                                        className="h-8 w-8 rounded-xl opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all shrink-0"
                                                    >
                                                        <Trash2 className="h-3.5 w-3.5" />
                                                    </Button>
                                                </div>
                                            </div>
                                            <p className="text-[14px] text-foreground/90 leading-relaxed font-medium whitespace-pre-wrap break-all overflow-hidden">{c.body}</p>

                                        </div>
                                    </div>
                                ))
                            )}

                        </div>
                    </div>
                </div>
            </ScrollArea>

            <div className="p-4 border-t bg-background/80 backdrop-blur-md shrink-0">
                <div className="flex items-center gap-2">
                    <Input
                        placeholder="Ваш коментар..."
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' && comment.trim()) {
                                e.preventDefault();
                                handleAddComment();
                            }
                        }}
                        className="h-10 flex-1 bg-neutral-200 dark:bg-neutral-800 border border-black/5 dark:border-white/10 rounded-[calc(var(--radius)+4px)] px-5 text-sm placeholder:text-neutral-400 dark:placeholder:text-neutral-600 transition-all focus-visible:ring-1 focus-visible:ring-black/5 dark:focus-visible:ring-white/20 shadow-none"
                        disabled={pending}
                    />
                    <Button
                        size="icon"
                        onClick={handleAddComment}
                        disabled={pending || !comment.trim()}
                        className={cn(
                            "h-10 w-10 shrink-0 transition-all border-none bg-black dark:bg-white text-white dark:text-black hover:bg-black/90 dark:hover:bg-white/90 rounded-[calc(var(--radius)+4px)] shadow-sm",
                            !comment.trim() ? "opacity-50 cursor-default" : "opacity-100 cursor-pointer active:scale-95"
                        )}
                    >
                        <CornerDownLeft className="h-4 w-4" />
                    </Button>
                </div>
            </div>


            <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Ви впевнені?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Ця дія незворотна. Завдання "{task.title}" буде видалено назавжди.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={pending}>Скасувати</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={(e) => {
                                e.preventDefault();
                                confirmDelete();
                            }}
                            disabled={pending}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            {pending ? "Видалення..." : "Видалити"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}

