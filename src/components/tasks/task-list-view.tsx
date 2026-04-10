"use client";

import * as React from "react";
import { format, isToday, isTomorrow, isPast, isSameDay, addDays } from "date-fns";
import { uk } from "date-fns/locale";
import { Check, Calendar, Flag } from "lucide-react";
import { cn } from "@/lib/utils";
import type { TaskRow } from "./tasks-client";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";

interface TaskListViewProps {
    tasks: TaskRow[];
    selectedTaskId: string | null;
    onSelectTask: (task: TaskRow) => void;
    onToggleStatus: (taskId: string, isDone: boolean) => void;
    isLoading?: boolean;
    groupBy?: "project" | "date" | "tag" | "priority" | "none";
}

export function TaskListView({
    tasks,
    selectedTaskId,
    onSelectTask,
    onToggleStatus,
    groupBy = "date",
}: TaskListViewProps) {

    // Grouping logic
    const sections = React.useMemo(() => {
        const result: { title: string; tasks: TaskRow[]; color?: string; isCompletedGroup?: boolean }[] = [];

        if (groupBy === "none") {
            return [{ title: "Список", tasks }];
        }

        if (groupBy === "date") {
            const overdue: TaskRow[] = [];
            const today: TaskRow[] = [];
            const tomorrow: TaskRow[] = [];
            const upcoming: TaskRow[] = [];
            const later: TaskRow[] = [];
            const noDate: TaskRow[] = [];

            const now = new Date();
            const tomorrowDate = addDays(now, 1);
            const nextWeek = addDays(now, 7);

            tasks.forEach(task => {
                if (!task.startDate) {
                    noDate.push(task);
                    return;
                }
                const d = new Date(task.startDate);
                if (isPast(d) && !isToday(d)) overdue.push(task);
                else if (isToday(d)) today.push(task);
                else if (isSameDay(d, tomorrowDate)) tomorrow.push(task);
                else if (d <= nextWeek) upcoming.push(task);
                else later.push(task);
            });

            if (overdue.length) result.push({ title: "Прострочено", tasks: overdue, color: "text-destructive" });
            if (today.length) result.push({ title: "Сьогодні", tasks: today, color: "text-primary" });
            if (tomorrow.length) result.push({ title: "Завтра", tasks: tomorrow });
            if (upcoming.length) result.push({ title: "Наступні 7 днів", tasks: upcoming });
            if (later.length) result.push({ title: "Пізніше", tasks: later });
            if (noDate.length) result.push({ title: "Без дати", tasks: noDate });
            return result;
        }

        if (groupBy === "project") {
            const groups: Record<string, TaskRow[]> = {};
            tasks.forEach(t => {
                // Filter out DONE tasks in project view
                if (t.status === "DONE") return;

                const key = t.project?.name || "Без проєкту";
                if (!groups[key]) groups[key] = [];
                groups[key].push(t);
            });
            return Object.entries(groups).map(([title, tasks]) => ({ title, tasks }));
        }

        if (groupBy === "tag") {
            const groups: Record<string, TaskRow[]> = {};
            tasks.forEach(t => {
                // Filter out DONE tasks in tag view
                if (t.status === "DONE") return;

                const key = t.tags[0]?.name || "Без мітки";
                if (!groups[key]) groups[key] = [];
                groups[key].push(t);
            });
            return Object.entries(groups).map(([title, tasks]) => ({ title, tasks }));
        }

        if (groupBy === "priority") {
            const groups: Record<string, TaskRow[]> = {
                "Терміновий": [],
                "Високий": [],
                "Середній": [],
                "Низький": [],
                "Без пріоритету": []
            };
            tasks.forEach(t => {
                // Filter out DONE tasks in priority view
                if (t.status === "DONE") return;

                if (t.priority === "HIGH") groups["Терміновий"].push(t);
                else if (t.priority === "MEDIUM") groups["Високий"].push(t);
                else if (t.priority === "LOW") groups["Середній"].push(t);
                else groups["Без пріоритету"].push(t);
            });
            return Object.entries(groups)
                .filter(([_, t]) => t.length > 0)
                .map(([title, tasks]) => ({
                    title,
                    tasks,
                    color: title === "Терміновий" ? "text-red-500" : title === "Високий" ? "text-orange-500" : undefined
                }));
        }

        return result;
    }, [tasks, groupBy]);

    if (tasks.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                <p>Немає завдань</p>
            </div>
        );
    }

    return (
        <div className="flex-1 overflow-auto p-4 space-y-8 pb-10">
            {sections.map((section, idx) => (
                <TaskGroup
                    key={section.title + idx}
                    title={section.title}
                    tasks={section.tasks}
                    count={section.tasks.length}
                    color={section.color}
                    isCompletedGroup={section.isCompletedGroup}
                    selectedTaskId={selectedTaskId}
                    onSelectTask={onSelectTask}
                    onToggleStatus={onToggleStatus}
                />
            ))}
        </div>
    );
}

function TaskGroup({
    title,
    tasks,
    count,
    color,
    isCompletedGroup,
    selectedTaskId,
    onSelectTask,
    onToggleStatus
}: {
    title: string;
    tasks: TaskRow[];
    count: number;
    color?: string;
    isCompletedGroup?: boolean;
    selectedTaskId: string | null;
    onSelectTask: (task: TaskRow) => void;
    onToggleStatus: (taskId: string, isDone: boolean) => void;
}) {
    return (
        <div className="space-y-1">
            <div className="flex items-center gap-2 px-2 pb-1">
                <h3 className={cn("text-sm font-semibold", color)}>{title}</h3>
                <span className="text-xs text-muted-foreground">{count}</span>
            </div>
            <div>
                {tasks.map((task) => (
                    <TaskItem
                        key={task.id}
                        task={task}
                        isCompletedGroup={isCompletedGroup}
                        isSelected={selectedTaskId === task.id}
                        onClick={() => onSelectTask(task)}
                        onToggle={() => onToggleStatus(task.id, task.status !== "DONE")}
                    />
                ))}
            </div>
        </div>
    );
}

function TaskItem({
    task,
    isCompletedGroup,
    isSelected,
    onClick,
    onToggle
}: {
    task: TaskRow;
    isCompletedGroup?: boolean;
    isSelected: boolean;
    onClick: () => void;
    onToggle: () => void;
}) {

    const priorityFlag = (() => {
        const level = task.priority === "HIGH" ? 3 : task.priority === "MEDIUM" ? 2 : task.priority === "LOW" ? 1 : 0;

        if (level === 0) return null;

        return (
            <div className="flex items-center gap-0.5 text-foreground font-bold">
                {level > 1 && <span className="text-[10px] leading-none">{level}</span>}
                <Flag className="h-3 w-3 fill-current" />
            </div>
        );
    })();

    const isOverdue = !isCompletedGroup && task.startDate && isPast(new Date(task.startDate)) && !isToday(new Date(task.startDate));

    return (
        <div
            onClick={onClick}
            className={cn(
                "group flex items-center gap-3 p-2 rounded-md cursor-pointer transition-colors border border-transparent",
                isSelected ? "bg-accent/50 border-accent" : "hover:bg-accent/20",
                task.isPinned && "bg-yellow-500/5 hover:bg-yellow-500/10"
            )}
        >
            <div className="flex items-center" onClick={(e) => e.stopPropagation()}>
                <Checkbox
                    checked={task.status === "DONE"}
                    onCheckedChange={onToggle}
                    className={cn(
                        "size-4.5 rounded-[4px]",
                        isOverdue && task.status !== "DONE" && "border-destructive/50"
                    )}
                />
            </div>

            <div className="flex-1 min-w-0 flex flex-col gap-0.5">
                <div className={cn(
                    "text-sm font-medium truncate",
                    task.status === "DONE" ? "line-through text-muted-foreground" : (isOverdue ? "text-destructive" : "text-foreground")
                )}>
                    {task.title}
                </div>

                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    {task.project && (
                        <span className="flex items-center gap-1 text-primary/80">
                            <span className="w-1.5 h-1.5 rounded-full bg-primary/50" />
                            {task.project.name}
                        </span>
                    )}

                    {task.startDate && (
                        <span className={cn(
                            "flex items-center gap-1",
                            isOverdue && "text-destructive font-medium"
                        )}>
                            {format(new Date(task.startDate), "d MMM", { locale: uk })}
                        </span>
                    )}

                    {priorityFlag}
                </div>
            </div>

            {task.startDate && (
                <div className="text-xs text-muted-foreground opacity-50">
                    {/* Optional Right Side meta */}
                </div>
            )}
        </div>
    );
}
