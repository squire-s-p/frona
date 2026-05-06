"use client";

import * as React from "react";
import { Plus, Flag, ListPlus, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createTask } from "@/server/tasks/actions";
import { cn } from "@/lib/utils";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";

type Priority = "LOW" | "MEDIUM" | "HIGH" | "URGENT";

interface TaskQuickAddProps {
    projects: { id: string; name: string }[];
}

export function TaskQuickAdd({ projects }: TaskQuickAddProps) {
    const [title, setTitle] = React.useState("");
    const [priority, setPriority] = React.useState<Priority>("MEDIUM");
    const [projectId, setProjectId] = React.useState<string | null>(null);
    const [isPending, startTransition] = React.useTransition();

    const activeProjectName = projects.find((p) => p.id === projectId)?.name || "Без проєкту";

    const priorityColors: Record<Priority, string> = {
        LOW: "text-blue-500",
        MEDIUM: "text-gray-500",
        HIGH: "text-orange-500",
        URGENT: "text-red-500",
    };

    const handleAdd = async (e?: React.FormEvent) => {
        e?.preventDefault();
        const trimmedTitle = title.trim();
        if (!trimmedTitle || isPending) return;

        startTransition(async () => {
            try {
                await createTask({
                    title: trimmedTitle,
                    priority,
                    projectId,
                    status: "TODO",
                });
                setTitle("");
                setPriority("MEDIUM");
                setProjectId(null);
                toast.success("Завдання додано");
            } catch {
                toast.error("Помилка при додаванні");
            }
        });
    };

    return (
        <form
            onSubmit={handleAdd}
            className="group relative flex w-full items-center gap-2 rounded-xl border bg-background/50 p-2 shadow-sm transition-all focus-within:border-primary/50 focus-within:ring-1 focus-within:ring-primary/20 hover:border-muted-foreground/20"
        >
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-muted-foreground group-focus-within:text-primary">
                {isPending ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                    <Plus className="h-5 w-5" />
                )}
            </div>

            <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Швидко додати завдання... (Enter для збереження)"
                className="h-9 border-none bg-transparent p-0 text-sm focus-visible:ring-0"
                disabled={isPending}
            />

            <div className="flex shrink-0 items-center gap-1 pr-1">
                {/* Priority Selector */}
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className={cn("h-8 w-8 transition-colors", priorityColors[priority])}
                            disabled={isPending}
                        >
                            <Flag className="h-4 w-4 fill-current" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-40">
                        <DropdownMenuItem onClick={() => setPriority("URGENT")} className="text-red-500">
                            Терміново
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setPriority("HIGH")} className="text-orange-500">
                            Високий
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setPriority("MEDIUM")} className="text-gray-500">
                            Середній
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setPriority("LOW")} className="text-blue-500">
                            Низький
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>

                {/* Project Selector */}
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className={cn("h-8 w-8 transition-colors", projectId ? "text-primary" : "text-muted-foreground")}
                            disabled={isPending}
                            title={activeProjectName}
                        >
                            <ListPlus className="h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56">
                        <DropdownMenuItem onClick={() => setProjectId(null)} className={cn(!projectId && "bg-muted")}>
                            Без проєкту
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <div className="max-h-[200px] overflow-auto">
                            {projects.map((p) => (
                                <DropdownMenuItem
                                    key={p.id}
                                    onClick={() => setProjectId(p.id)}
                                    className={cn(projectId === p.id && "bg-muted")}
                                >
                                    {p.name}
                                </DropdownMenuItem>
                            ))}
                        </div>
                    </DropdownMenuContent>
                </DropdownMenu>

                <Button
                    type="submit"
                    size="sm"
                    className={cn(
                        "h-8 transition-all px-3",
                        title.trim() ? "opacity-100 scale-100" : "opacity-0 scale-95 pointer-events-none"
                    )}
                    disabled={isPending || !title.trim()}
                >
                    Додати
                </Button>
            </div>
        </form>
    );
}
