"use client";

import * as React from "react";
import { toast } from "sonner";
import { createTask, toggleTaskStatus } from "@/server/tasks/actions";
import { parseSmartDate } from "@/lib/smart-date";
import { parseSmartPriority } from "@/lib/smart-priority";
import dynamic from "next/dynamic";

// Components for normalization and types
export type ProjectOption = { id: string; name: string; isPinned?: boolean };
export type TagOption = { id: string; name: string; color?: string | null; isPinned?: boolean };

export type TaskRow = {
  id: string;
  title: string;
  description: string | null;
  status: "TODO" | "DONE";
  priority: "LOW" | "MEDIUM" | "HIGH" | "NONE";
  isPinned: boolean;
  isTemplate: boolean;
  startDate: string | null;
  endDate: string | null;
  updatedAt: string;
  createdAt: string;
  project: ProjectOption | null;
  recurrenceRule: string | null;
  parentTaskId: string | null;
  tags: TagOption[];
  _count: { comments: number };
};

function normalizeTasks(tasks: any[]): TaskRow[] {
  return tasks.map((t) => ({
    id: t.id,
    title: t.title,
    description: t.description ?? null,
    status: t.status === "done" ? "DONE" : "TODO",
    priority: (t.priority === "urgent" ? "HIGH" : t.priority === "high" ? "MEDIUM" : t.priority === "medium" ? "LOW" : "NONE"),
    isPinned: t.isPinned ?? false,
    isTemplate: t.isTemplate ?? false,
    startDate: t.startAt ? new Date(t.startAt).toISOString() : null,
    endDate: t.endAt ? new Date(t.endAt).toISOString() : null,
    updatedAt: new Date(t.updatedAt).toISOString(),
    createdAt: new Date(t.createdAt).toISOString(),
    project: t.project ?? null,
    recurrenceRule: t.recurrenceRule ?? null,
    parentTaskId: t.parentTaskId ?? null,
    tags: (t.taskTags ?? []).map((tt: any) => ({
      id: tt.tag.id,
      name: tt.tag.name,
      color: tt.tag.color,
    })),
    _count: t._count ?? { comments: 0 },
  }));
}

function priorityLabel(p: string) {
  switch (p) {
    case "LOW": return "Низький";
    case "MEDIUM": return "Середній";
    case "HIGH": return "Високий";
    default: return "Не встановлено";
  }
}

// Dynamic import of the layout to prevent SSR issues (localStorage & Radix ID shifts)
const TasksLayoutInner = dynamic(() => import("./tasks-layout-inner"), {
  ssr: false,
  loading: () => (
    <div className="flex-1 flex flex-col min-h-0 -m-4 md:-m-6 bg-background overflow-hidden relative border-0 h-full w-full items-center justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
    </div>
  ),
});

export function TasksClient({
  initialTasks,
  projects,
  tags,
}: {
  initialTasks: any[];
  projects: ProjectOption[];
  tags: TagOption[];
}) {
  const allTasks = React.useMemo(() => normalizeTasks(initialTasks), [initialTasks]);

  const [selectedFilter, setSelectedFilter] = React.useState("inbox");
  const [selectedTaskId, setSelectedTaskId] = React.useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [sortBy, setSortBy] = React.useState<"date" | "name" | "tag" | "priority">("date");
  const [groupBy, setGroupBy] = React.useState<"project" | "date" | "tag" | "priority" | "none">("date");

  // Filtering & Sorting logic
  const filteredTasks = React.useMemo(() => {
    let result = [...allTasks];
    const now = new Date();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(now.getDate() - 30);

    result = result.filter(t => {
      if (t.status === "DONE") {
        return new Date(t.updatedAt) >= thirtyDaysAgo;
      }
      return true;
    });

    if (selectedFilter === "today") {
      result = result.filter(t => t.status !== "DONE" && t.startDate && new Date(t.startDate).toDateString() === now.toDateString());
    } else if (selectedFilter === "upcoming") {
      const next7 = new Date();
      next7.setDate(now.getDate() + 7);
      result = result.filter(t => t.status !== "DONE" && t.startDate && new Date(t.startDate) > now && new Date(t.startDate) <= next7);
    } else if (selectedFilter === "completed") {
      result = result.filter(t => t.status === "DONE");
    } else if (selectedFilter === "inbox") {
      result = result.filter(t => t.status !== "DONE");
    } else {
      result = result.filter(t => t.status !== "DONE" && (t.project?.id === selectedFilter || t.tags.some(tag => tag.id === selectedFilter)));
    }


    return result.sort((a, b) => {
      if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1;
      if (sortBy === "name") return a.title.localeCompare(b.title);
      if (sortBy === "tag") {
        const tagA = a.tags[0]?.name || "zzz";
        const tagB = b.tags[0]?.name || "zzz";
        return tagA.localeCompare(tagB);
      }
      if (sortBy === "priority") {
        const pOrder = { HIGH: 0, MEDIUM: 1, LOW: 2, NONE: 3 };
        return (pOrder[a.priority] ?? 3) - (pOrder[b.priority] ?? 3);
      }
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }, [allTasks, selectedFilter, sortBy]);

  const [quickAddValue, setQuickAddValue] = React.useState("");
  const [quickAddPending, setQuickAddPending] = React.useState(false);

  const quickAddDate = React.useMemo(() => parseSmartDate(quickAddValue), [quickAddValue]);
  const quickAddPriority = React.useMemo(() => parseSmartPriority(quickAddValue), [quickAddValue]);

  async function onQuickAdd() {
    const title = quickAddValue.trim();
    if (!title) return;

    setQuickAddPending(true);
    try {
      let cleanTitle = title;
      if (quickAddDate) cleanTitle = cleanTitle.replace(quickAddDate.text, "");
      if (quickAddPriority) cleanTitle = cleanTitle.replace(quickAddPriority.text, "");
      cleanTitle = cleanTitle.replace(/\s\s+/g, " ").trim();
      if (!cleanTitle) cleanTitle = title;

      let projectId = null;
      if (projects.some(p => p.id === selectedFilter)) {
        projectId = selectedFilter;
      }

      await createTask({
        title: cleanTitle,
        status: "TODO",
        priority: (quickAddPriority?.priority ?? "NONE") as any,
        startDate: quickAddDate?.date?.toISOString() || (selectedFilter === "today" ? new Date().toISOString() : undefined),
        projectId,
      });

      setQuickAddValue("");
      toast.success("Завдання створено");
    } catch (error) {
      toast.error("Помилка при створенні");
    } finally {
      setQuickAddPending(false);
    }
  }

  async function onToggleStatus(taskId: string, isDone: boolean) {
    try {
      await toggleTaskStatus(taskId, isDone ? "DONE" : "TODO");
    } catch (err) {
      toast.error("Не вдалося змінити статус");
    }
  }

  const counts = React.useMemo(() => {
    const now = new Date();
    const todayStr = now.toDateString();
    const next7 = new Date();
    next7.setDate(now.getDate() + 7);

    return {
      inbox: allTasks.filter(t => t.status !== "DONE").length,
      today: allTasks.filter(t => t.status !== "DONE" && t.startDate && new Date(t.startDate).toDateString() === todayStr).length,
      upcoming: allTasks.filter(t => t.status !== "DONE" && t.startDate && new Date(t.startDate) > now && new Date(t.startDate) <= next7).length,
      completed: allTasks.filter(t => t.status === "DONE").length,
    };
  }, [allTasks]);


  return (
    <TasksLayoutInner
      allTasks={allTasks}
      filteredTasks={filteredTasks}
      selectedTaskId={selectedTaskId}
      setSelectedTaskId={setSelectedTaskId}
      onToggleStatus={onToggleStatus}
      selectedFilter={selectedFilter}
      setSelectedFilter={setSelectedFilter}
      projects={projects}
      tags={tags}
      counts={counts}
      quickAddValue={quickAddValue}
      setQuickAddValue={setQuickAddValue}
      onQuickAdd={onQuickAdd}
      quickAddPending={quickAddPending}
      quickAddDate={quickAddDate}
      quickAddPriority={quickAddPriority}
      priorityLabel={priorityLabel}
      setDialogOpen={setDialogOpen}
      groupBy={groupBy}
      setGroupBy={setGroupBy}
      sortBy={sortBy}
      setSortBy={setSortBy}
      dialogOpen={dialogOpen}
    />
  );
}
