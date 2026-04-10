"use client";

import * as React from "react";
import { Plus, Wand2, ArrowUpDown, Layers, Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuPortal,
    DropdownMenuSub,
    DropdownMenuSubContent,
    DropdownMenuSubTrigger,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    ResizableHandle,
    ResizablePanel,
    ResizablePanelGroup,
} from "@/components/ui/resizable";
import { useDefaultLayout } from "react-resizable-panels";
import { TasksSidebar } from "./tasks-sidebar";
import { TaskListView } from "./task-list-view";
import { TaskDetailView } from "./task-detail-view";
import { TaskDialog } from "@/components/tasks/task-dialog";
import { cn } from "@/lib/utils";
import { formatSmartDateSuggestion } from "@/lib/smart-date";

export default function TasksLayoutInner({
    allTasks,
    filteredTasks,
    selectedTaskId,
    setSelectedTaskId,
    onToggleStatus,
    selectedFilter,
    setSelectedFilter,
    projects,
    tags,
    counts,
    quickAddValue,
    setQuickAddValue,
    onQuickAdd,
    quickAddPending,
    quickAddDate,
    quickAddPriority,
    priorityLabel,
    setDialogOpen,
    groupBy,
    setGroupBy,
    sortBy,
    setSortBy,
    dialogOpen,
}: any) {
    const { defaultLayout, onLayoutChanged } = useDefaultLayout({
        id: "tasks-v8", // Fresh ID to ensure clean start
        storage: window.localStorage,
    });

    const selectedTask = React.useMemo(() =>
        allTasks.find((t: any) => t.id === selectedTaskId) || null
        , [allTasks, selectedTaskId]);

    return (
        <div className="absolute inset-0 flex flex-col bg-background overflow-hidden border-0">
            <ResizablePanelGroup
                id="tasks-v8"
                key={defaultLayout ? "ready" : "loading"}
                orientation="horizontal"
                className="flex-1 h-full"
                defaultLayout={defaultLayout}
                onLayoutChanged={onLayoutChanged}
            >
                {/* 1. Sidebar (Filters) */}
                <ResizablePanel
                    id="tasks-sidebar"
                    defaultSize="18"
                    minSize="15"
                    maxSize="25"
                    className="h-full bg-muted/5"
                >
                    <TasksSidebar
                        className="w-full h-full bg-transparent transition-all"
                        selectedFilter={selectedFilter}
                        onSelectFilter={setSelectedFilter}
                        projects={projects}
                        tags={tags}
                        counts={counts}
                    />
                </ResizablePanel>

                <ResizableHandle className="w-px bg-border" />

                {/* 2. Middle column (Task List) */}
                <ResizablePanel id="tasks-list" defaultSize="47" minSize="30">
                    <div className="flex-1 h-full flex flex-col min-w-0 bg-background overflow-hidden">
                        <header className="h-14 px-4 border-b flex items-center gap-3 shrink-0">
                            <div className="relative flex-1 flex items-center group">
                                <Plus className="absolute left-3 h-3.5 w-3.5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                                <Input
                                    value={quickAddValue}
                                    onChange={(e) => setQuickAddValue(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === "Enter") {
                                            e.preventDefault();
                                            onQuickAdd();
                                        }
                                    }}
                                    disabled={quickAddPending}
                                    placeholder="Швидке завдання..."
                                    className="pl-9 h-9 w-full bg-muted/40 border-0 shadow-none focus-visible:ring-0 focus-visible:bg-muted/60 transition-all font-medium text-[13px]"
                                />
                                {quickAddPending && (
                                    <div className="absolute right-3">
                                        <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground/50" />
                                    </div>
                                )}

                                <div className="absolute top-[100%] left-0 right-0 z-10">
                                    {(quickAddDate || quickAddPriority) && (
                                        <div className="flex gap-2 mt-1.5 px-1">
                                            {quickAddDate && (
                                                <div className="flex items-center gap-1 px-2 py-0.5 text-[10px] bg-primary/10 text-primary border border-primary/20 rounded-full animate-in fade-in slide-in-from-top-1">
                                                    <Wand2 className="h-2.5 w-2.5" />
                                                    <span>{formatSmartDateSuggestion(quickAddDate.date)}</span>
                                                </div>
                                            )}
                                            {quickAddPriority && (
                                                <div className="flex items-center gap-1 px-2 py-0.5 text-[10px] bg-orange-500/10 text-orange-600 border border-orange-500/20 rounded-full animate-in fade-in slide-in-from-top-1">
                                                    < Wand2 className="h-2.5 w-2.5" />
                                                    <span>{priorityLabel(quickAddPriority.priority)}</span>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="flex items-center gap-2">
                                <Button
                                    variant="default"
                                    size="sm"
                                    className="h-9 px-3 text-[13px] font-medium"
                                    onClick={() => setDialogOpen(true)}
                                >
                                    <Plus className="h-4 w-4 mr-1.5" />
                                    Створити завдання
                                </Button>

                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground">
                                            <ArrowUpDown className="h-4 w-4" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end" className="w-56">
                                        <DropdownMenuSub>
                                            <DropdownMenuSubTrigger>
                                                <Layers className="mr-2 h-4 w-4" />
                                                <span>Групувати за</span>
                                                <span className="ml-auto text-[10px] text-muted-foreground uppercase bg-muted px-1 rounded">
                                                    {groupBy === "none" ? "Немає" :
                                                        groupBy === "date" ? "Дата" :
                                                            groupBy === "project" ? "Проєкт" :
                                                                groupBy === "tag" ? "Мітка" : "Пріоритет"}
                                                </span>
                                            </DropdownMenuSubTrigger>
                                            <DropdownMenuPortal>
                                                <DropdownMenuSubContent>
                                                    <DropdownMenuItem onClick={() => setGroupBy("none")}>
                                                        Немає (Список) {groupBy === "none" && <Check className="ml-auto h-3.5 w-3.5" />}
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem onClick={() => setGroupBy("date")}>
                                                        Дата {groupBy === "date" && <Check className="ml-auto h-3.5 w-3.5" />}
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem onClick={() => setGroupBy("project")}>
                                                        Проєкт {groupBy === "project" && <Check className="ml-auto h-3.5 w-3.5" />}
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem onClick={() => setGroupBy("tag")}>
                                                        Мітка {groupBy === "tag" && <Check className="ml-auto h-3.5 w-3.5" />}
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem onClick={() => setGroupBy("priority")}>
                                                        Пріоритет {groupBy === "priority" && <Check className="ml-auto h-3.5 w-3.5" />}
                                                    </DropdownMenuItem>
                                                </DropdownMenuSubContent>
                                            </DropdownMenuPortal>
                                        </DropdownMenuSub>

                                        <DropdownMenuSub>
                                            <DropdownMenuSubTrigger>
                                                <ArrowUpDown className="mr-2 h-4 w-4" />
                                                <span>Сортувати за</span>
                                                <span className="ml-auto text-[10px] text-muted-foreground uppercase bg-muted px-1 rounded">
                                                    {sortBy === "date" ? "Дата" :
                                                        sortBy === "name" ? "Назва" :
                                                            sortBy === "tag" ? "Мітка" : "Пріор."}
                                                </span>
                                            </DropdownMenuSubTrigger>
                                            <DropdownMenuPortal>
                                                <DropdownMenuSubContent>
                                                    <DropdownMenuItem onClick={() => setSortBy("date")}>
                                                        Дата {sortBy === "date" && <Check className="ml-auto h-3.5 w-3.5" />}
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem onClick={() => setSortBy("name")}>
                                                        Назва {sortBy === "name" && <Check className="ml-auto h-3.5 w-3.5" />}
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem onClick={() => setSortBy("tag")}>
                                                        Мітка {sortBy === "tag" && <Check className="ml-auto h-3.5 w-3.5" />}
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem onClick={() => setSortBy("priority")}>
                                                        Пріоритет {sortBy === "priority" && <Check className="ml-auto h-3.5 w-3.5" />}
                                                    </DropdownMenuItem>
                                                </DropdownMenuSubContent>
                                            </DropdownMenuPortal>
                                        </DropdownMenuSub>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>
                        </header>

                        <TaskListView
                            tasks={filteredTasks}
                            selectedTaskId={selectedTaskId}
                            onSelectTask={(task: any) => setSelectedTaskId(task.id)}
                            onToggleStatus={onToggleStatus}
                            groupBy={groupBy}
                        />
                    </div>
                </ResizablePanel>

                <ResizableHandle className="w-px bg-border" />

                {/* 3. Right column (Detail Panel) */}
                <ResizablePanel
                    id="tasks-detail"
                    defaultSize={selectedTaskId ? "35" : "0"}
                    minSize={selectedTaskId ? "25" : "0"}
                    maxSize="50"
                    className={cn(
                        "bg-muted/10 transition-all duration-300",
                        !selectedTaskId && "opacity-0 pointer-events-none overflow-hidden"
                    )}
                >
                    <TaskDetailView
                        task={selectedTask}
                        projects={projects}
                        tags={tags}
                        onClose={() => setSelectedTaskId(null)}
                        onToggleStatus={onToggleStatus}
                        onUpdate={() => { }}
                    />
                </ResizablePanel>
            </ResizablePanelGroup>

            <TaskDialog
                open={dialogOpen}
                onOpenChange={setDialogOpen}
                task={null}
                projects={projects}
                tags={tags}
                defaultProjectId={projects.find((p: any) => p.id === selectedFilter)?.id}
                defaultStartDate={selectedFilter === "today" ? new Date() : null}
            />
        </div>
    );
}
