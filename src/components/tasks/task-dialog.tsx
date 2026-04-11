"use client";

import * as React from "react";
import { format } from "date-fns";
import { uk } from "date-fns/locale";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

import { ProjectSelect } from "@/components/tasks/project-select";
import { TagSelect } from "@/components/tasks/tag-select";
import type { TaskRow } from "@/components/tasks/tasks-client";
import {
  createTask,
  updateTask,
  deleteTask,
  addTaskComment,
  getTaskComments,
  deleteTaskComment,
  addTaskAttachment,
  getTaskAttachments,
  deleteTaskAttachment,
  createSubtask,
  toggleSubtask,
  deleteSubtask,
  getTaskSubtasks,
  duplicateTask,
} from "@/server/tasks/actions";
import { parseSmartDate, formatSmartDateSuggestion, type SmartDateResult } from "@/lib/smart-date";
import { parseSmartPriority, type SmartPriorityResult } from "@/lib/smart-priority";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
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
import { Button } from "@/components/ui/button";

import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";

import { PencilIcon } from "@/components/icons/pencil";
import { TrashIcon } from "@/components/icons/trash";
import { Upload, File, FileText, Image as ImageIcon, X, Calendar as CalendarIcon, Wand2, Plus, CheckCircle2, Circle, Sun, Sunrise, CalendarPlus, Moon, Clock, Bell, RotateCcw, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import { RichTextEditor } from "./rich-text-editor";


type ProjectOption = { id: string; name: string };
type TagOption = { id: string; name: string };
type Priority = "LOW" | "MEDIUM" | "HIGH" | "NONE";
type Status = "TODO" | "DONE";
type RecurrenceFrequency = "daily" | "weekly" | "monthly" | "yearly";

type RecurrenceRule = {
  frequency: RecurrenceFrequency;
  interval: number;
  endDate?: string; // ISO
} | null;

type TaskCommentRow = {
  id: string;
  body: string;
  createdAt: Date;
  user: { name: string | null; email: string | null; image: string | null } | null;
};

type TaskAttachmentRow = {
  id: string;
  name: string;
  url: string;
  mimeType: string | null;
  size: number | null;
  createdAt: Date;
};

type SubtaskRow = {
  id: string;
  title: string;
  isDone: boolean;
};

function priorityLabel(p: Priority) {
  switch (p) {
    case "LOW":
      return "Низький";
    case "MEDIUM":
      return "Середній";
    case "HIGH":
      return "Високий";
    case "NONE":
      return "Не встановлено";
  }
}

function statusLabel(s: Status) {
  return s === "DONE" ? "Done" : "Todo";
}

function FieldView({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid gap-2">
      <Label>{label}</Label>
      <div className="rounded-md border bg-muted/30 px-3 py-2 text-sm">{children}</div>
    </div>
  );
}

function Pill({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-md border bg-background px-2 py-0.5 text-xs">
      {children}
    </span>
  );
}

function AdvancedDatePicker({
  range,
  setRange,
  isRecurring,
  setIsRecurring,
  recurrenceFrequency,
  setRecurrenceFrequency,
  onClose
}: {
  range: { from: Date | undefined; to?: Date | undefined };
  setRange: (r: { from: Date | undefined; to?: Date | undefined }) => void;
  isRecurring: boolean;
  setIsRecurring: (v: boolean) => void;
  recurrenceFrequency: RecurrenceFrequency;
  setRecurrenceFrequency: (v: RecurrenceFrequency) => void;
  onClose: () => void;
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
            <Button variant="ghost" size="icon" onClick={() => setShortcut("today")} className="h-9 w-9 hover:bg-muted rounded-md transition-colors"><Sun className="h-4 w-4" /></Button>
            <Button variant="ghost" size="icon" onClick={() => setShortcut("tomorrow")} className="h-9 w-9 hover:bg-muted rounded-md transition-colors"><Sunrise className="h-4 w-4" /></Button>
            <Button variant="ghost" size="icon" onClick={() => setShortcut("next-week")} className="h-9 w-9 hover:bg-muted rounded-md transition-colors"><CalendarPlus className="h-4 w-4" /></Button>
            <Button variant="ghost" size="icon" onClick={() => setShortcut("next-month")} className="h-9 w-9 hover:bg-muted rounded-md transition-colors"><Moon className="h-4 w-4" /></Button>
          </div>

          <Calendar
            mode="single"
            locale={uk}
            selected={range?.from}
            onSelect={(d) => setRange({ from: d ?? undefined, to: undefined })}
            className="w-full flex justify-center !p-0"
          />

          <div className="space-y-1">
            <Button variant="ghost" className="w-full flex items-center justify-between p-2 hover:bg-muted rounded-md transition-colors text-sm font-normal">
              <div className="flex items-center gap-3">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span>Термін виконання</span>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </Button>
            <Button variant="ghost" className="w-full flex items-center justify-between p-2 hover:bg-muted rounded-md transition-colors text-sm font-normal">
              <div className="flex items-center gap-3">
                <Bell className="h-4 w-4 text-muted-foreground" />
                <span>Нагадування</span>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </Button>

            <Popover>
              <PopoverTrigger asChild>
                <Button variant="ghost" className="w-full flex items-center justify-between p-2 hover:bg-muted rounded-md transition-colors text-sm font-normal">
                  <div className="flex items-center gap-3">
                    <RotateCcw className="h-4 w-4 text-muted-foreground" />
                    <span>{isRecurring ? `Повторювати (${recurrenceFrequency})` : "Не повторювати"}</span>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[200px] p-1" side="right">
                <div className="grid gap-1">
                  {[
                    { id: "none", label: "Не повторювати" },
                    { id: "daily", label: "Щодня" },
                    { id: "weekly", label: "Щотижня" },
                    { id: "monthly", label: "Щомісяця" },
                    { id: "yearly", label: "Щороку" },
                    { id: "workday", label: "Кожен будній день" },
                  ].map((opt) => (
                    <Button
                      key={opt.id}
                      variant="ghost"
                      onClick={() => {
                        if (opt.id === "none") setIsRecurring(false);
                        else {
                          setIsRecurring(true);
                          setRecurrenceFrequency(opt.id as any);
                        }
                      }}
                      className="w-full flex items-center gap-2 p-2 hover:bg-muted text-xs rounded-md text-left justify-start font-normal h-8"
                    >
                      {opt.label}
                    </Button>
                  ))}
                </div>
              </PopoverContent>
            </Popover>
          </div>
        </>
      ) : (
        <Calendar
          mode="range"
          locale={uk}
          selected={{ from: range?.from, to: range?.to }}
          onSelect={(r) => setRange(r ?? { from: undefined, to: undefined })}
          className="w-full flex justify-center !p-0"
        />
      )}

      <div className="flex items-center gap-2 pt-2 border-t mt-2">
        <Button variant="ghost" size="sm" className="flex-1 h-10" onClick={() => { setRange({ from: undefined, to: undefined }); setIsRecurring(false); }}>
          Очистити
        </Button>
        <Button size="sm" className="flex-1 h-10 bg-white hover:bg-white/90 text-black border shadow-sm" onClick={onClose}>
          OK
        </Button>
      </div>
    </div>
  );
}

export function TaskDialog({
  open,
  onOpenChange,
  task,
  projects,
  tags,
  defaultProjectId,
  defaultStartDate,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  task: TaskRow | null;
  projects: ProjectOption[];
  tags: TagOption[];
  defaultProjectId?: string | null;
  defaultStartDate?: Date | null;
}) {
  const isExisting = !!task;

  // Helpers to map DB enums (lowercase) back to UI enums (UPPERCASE)
  function mapPriorityToUI(p: string): Priority {
    switch (p) {
      case "medium": return "LOW";
      case "high": return "MEDIUM";
      case "urgent": return "HIGH";
      case "low":
      default: return "NONE";
    }
  }

  function mapStatusToUI(s: string): Status {
    return s === "done" ? "DONE" : "TODO";
  }

  const [pending, startTransition] = React.useTransition();

  const [isEditing, setIsEditing] = React.useState(!isExisting);

  const [title, setTitle] = React.useState(task?.title ?? "");
  const [description, setDescription] = React.useState(task?.description ?? "");
  const [projectId, setProjectId] = React.useState<string | null>(task?.project?.id ?? defaultProjectId ?? null);

  const [priority, setPriority] = React.useState<Priority>(() => {
    if (!task) return "NONE";
    return mapPriorityToUI(task.priority);
  });

  const [status, setStatus] = React.useState<Status>(() => {
    if (!task) return "TODO";
    return mapStatusToUI(task.status);
  });
  const [isPinned, setIsPinned] = React.useState(task?.isPinned ?? false);
  const [isTemplate, setIsTemplate] = React.useState(task?.isTemplate ?? false);
  const [isPreviewMode, setIsPreviewMode] = React.useState(false);

  const [range, setRange] = React.useState<{ from: Date | undefined; to?: Date | undefined }>({
    from: task?.startDate ? new Date(task.startDate) : (defaultStartDate ?? undefined),
    to: task?.endDate ? new Date(task.endDate) : undefined,
  });

  // Tags
  const [tagIds, setTagIds] = React.useState<string[]>([]);

  // Recurring
  const [isRecurring, setIsRecurring] = React.useState(false);
  const [recurrenceFrequency, setRecurrenceFrequency] = React.useState<RecurrenceFrequency>("daily");
  const [recurrenceInterval, setRecurrenceInterval] = React.useState(1);
  const [recurrenceEndDate, setRecurrenceEndDate] = React.useState<Date | undefined>(undefined);

  const [comment, setComment] = React.useState("");
  const [showDeleteDialog, setShowDeleteDialog] = React.useState(false);
  const [comments, setComments] = React.useState<TaskCommentRow[]>([]);

  const [commentsLoading, setCommentsLoading] = React.useState(false);

  const [attachments, setAttachments] = React.useState<TaskAttachmentRow[]>([]);
  const [attachmentsLoading, setAttachmentsLoading] = React.useState(false);
  const [uploading, setUploading] = React.useState(false);
  const [pendingAttachments, setPendingAttachments] = React.useState<any[]>([]);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // Subtasks
  const [subtasks, setSubtasks] = React.useState<SubtaskRow[]>([]);
  const [subtasksLoading, setSubtasksLoading] = React.useState(false);
  const [newSubtaskTitle, setNewSubtaskTitle] = React.useState("");
  const [addingSubtask, setAddingSubtask] = React.useState(false);

  const [dateSuggestion, setDateSuggestion] = React.useState<SmartDateResult | null>(null);
  const [prioritySuggestion, setPrioritySuggestion] = React.useState<SmartPriorityResult | null>(null);
  const [dateOpen, setDateOpen] = React.useState(false);

  function handleTitleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const text = e.target.value;
    setTitle(text);

    // Smart date parsing
    const dateResult = parseSmartDate(text);
    if (dateResult && dateResult.date) {
      setDateSuggestion(dateResult);
    } else {
      setDateSuggestion(null);
    }

    // Smart priority parsing
    const priorityResult = parseSmartPriority(text);
    if (priorityResult) {
      setPrioritySuggestion(priorityResult);
    } else {
      setPrioritySuggestion(null);
    }
  }

  function applyDateSuggestion() {
    if (!dateSuggestion) return;

    setRange({
      from: dateSuggestion.date,
      to: undefined,
    });

    // Remove the date text from the title (optional, but good UX)
    // We replace the date text with empty string, and trim extra spaces
    const newTitle = title.replace(dateSuggestion.text, "").replace(/\s\s+/g, " ").trim();
    setTitle(newTitle);
    setDateSuggestion(null);
    toast.success(`Встановлено дату: ${formatSmartDateSuggestion(dateSuggestion.date)}`);
  }

  function applyPrioritySuggestion() {
    if (!prioritySuggestion) return;

    setPriority(prioritySuggestion.priority);

    const newTitle = title.replace(prioritySuggestion.text, "").replace(/\s\s+/g, " ").trim();
    setTitle(newTitle);
    setPrioritySuggestion(null);
    toast.success(`Встановлено пріоритет: ${priorityLabel(prioritySuggestion.priority)}`);
  }

  function parseRecurrenceRule(rule: string | null): RecurrenceRule {
    if (!rule) return null;
    try {
      return JSON.parse(rule);
    } catch {
      return null;
    }
  }

  function resetToTaskValues() {
    setTitle(task?.title ?? "");
    setDescription(task?.description ?? "");
    setProjectId(task?.project?.id ?? null);
    setPriority(task ? mapPriorityToUI(task.priority) : "NONE");
    setStatus(task ? mapStatusToUI(task.status) : "TODO");
    setIsPinned(task?.isPinned ?? false);
    setIsTemplate(task?.isTemplate ?? false);
    setRange({
      from: task?.startDate ? new Date(task.startDate) : undefined,
      to: task?.endDate ? new Date(task.endDate) : undefined,
    });
    setTagIds(task?.tags?.map((t: any) => t.id) ?? []);

    const recurrence = parseRecurrenceRule(task?.recurrenceRule ?? null);
    setIsRecurring(!!recurrence);
    if (recurrence) {
      setRecurrenceFrequency(recurrence.frequency);
      setRecurrenceInterval(recurrence.interval);
      setRecurrenceEndDate(recurrence.endDate ? new Date(recurrence.endDate) : undefined);
    } else {
      setRecurrenceFrequency("daily");
      setRecurrenceInterval(1);
      setRecurrenceEndDate(undefined);
    }
  }

  React.useEffect(() => {
    const existing = !!task;

    setTitle(task?.title ?? "");
    setDescription(task?.description ?? "");
    setProjectId(task?.project?.id ?? null);
    setPriority(task ? mapPriorityToUI(task.priority) : "NONE");
    setStatus(task ? mapStatusToUI(task.status) : "TODO");
    setIsPinned(task?.isPinned ?? false);
    setIsTemplate(task?.isTemplate ?? false);
    setRange({
      from: task?.startDate ? new Date(task.startDate) : undefined,
      to: task?.endDate ? new Date(task.endDate) : undefined,
    });

    setTagIds(task?.tags?.map((t: any) => t.id) ?? []);

    const recurrence = parseRecurrenceRule(task?.recurrenceRule ?? null);
    setIsRecurring(!!recurrence);
    if (recurrence) {
      setRecurrenceFrequency(recurrence.frequency);
      setRecurrenceInterval(recurrence.interval);
      setRecurrenceEndDate(recurrence.endDate ? new Date(recurrence.endDate) : undefined);
    } else {
      setRecurrenceFrequency("daily");
      setRecurrenceInterval(1);
      setRecurrenceEndDate(undefined);
    }

    setComment("");

    if (open) setIsEditing(!existing);

    if (open && task?.id) {
      setCommentsLoading(true);
      setAttachmentsLoading(true);
      startTransition(async () => {
        try {
          const [commentsData, attachmentsData, subtasksData] = await Promise.all([
            getTaskComments(task.id),
            getTaskAttachments(task.id),
            getTaskSubtasks(task.id),
          ]);
          setComments(commentsData as unknown as TaskCommentRow[]);
          setAttachments(attachmentsData as unknown as TaskAttachmentRow[]);
          setSubtasks(subtasksData as unknown as SubtaskRow[]);
        } finally {
          setCommentsLoading(false);
          setAttachmentsLoading(false);
          setSubtasksLoading(false);
        }
      });
    } else {
      setComments([]);
      setAttachments([]);
      setSubtasks([]);
      setCommentsLoading(false);
      setAttachmentsLoading(false);
      setSubtasksLoading(false);
    }
  }, [task, open]);

  async function onSave() {
    // Process detected date/priority if any
    let finalTitle = title;
    let finalPriority = priority;
    let finalStartDate = range.from;
    let finalEndDate = range.to;

    if (dateSuggestion) {
      finalTitle = finalTitle.replace(dateSuggestion.text, "");
      finalStartDate = dateSuggestion.date;
      finalEndDate = undefined; // Reset end date if smart date found (usually single date)
    }

    if (prioritySuggestion) {
      finalTitle = finalTitle.replace(prioritySuggestion.text, "");
      finalPriority = prioritySuggestion.priority;
    }

    // Clean up title
    finalTitle = finalTitle.replace(/\s\s+/g, " ").trim();
    if (!finalTitle) finalTitle = title; // Revert if everything removed (edge case)

    const recurrenceRule: RecurrenceRule = isRecurring
      ? {
        frequency: recurrenceFrequency,
        interval: recurrenceInterval,
        endDate: recurrenceEndDate ? recurrenceEndDate.toISOString() : undefined,
      }
      : null;

    const payload = {
      title: finalTitle,
      description: description?.trim() ? description : null,
      projectId: projectId ?? null,
      priority: finalPriority,
      status,
      startDate: finalStartDate ? finalStartDate.toISOString() : null,
      endDate: finalEndDate ? finalEndDate.toISOString() : null,
      recurrenceRule: recurrenceRule ? JSON.stringify(recurrenceRule) : null,
      tagIds,
      isPinned,
      isTemplate,
    };

    startTransition(async () => {
      let savedTask: any;
      if (task) {
        await updateTask(task.id, payload as any);
        savedTask = task;
      } else {
        savedTask = await createTask(payload as any);
      }

      // Persist pending attachments
      if (pendingAttachments.length > 0 && savedTask?.id) {
        for (const att of pendingAttachments) {
          await addTaskAttachment(savedTask.id, {
            name: att.name,
            url: att.url,
            mimeType: att.mimeType,
            size: att.size,
          });
        }
      }

      onOpenChange(false);
    });
  }

  async function onDelete() {
    if (!task) return;
    setShowDeleteDialog(true);
  }

  async function confirmDelete() {
    if (!task) return;
    startTransition(async () => {
      await deleteTask(task.id);
      setShowDeleteDialog(false);
      onOpenChange(false);
    });
  }


  async function onAddComment() {
    if (!task) return;
    const text = comment.trim();
    if (!text) return;

    startTransition(async () => {
      await addTaskComment(task.id, text);

      setComments((prev: any[]) => [
        ...prev,
        {
          id: `tmp-${Date.now()}`,
          body: text,
          createdAt: new Date(),
          user: { name: "You", email: null, image: null },
        },
      ]);

      setComment("");

      const rows = await getTaskComments(task.id);
      setComments(rows as unknown as TaskCommentRow[]);
    });
  }

  async function onDeleteComment(commentId: string) {
    if (!task) return;
    startTransition(async () => {
      await deleteTaskComment(commentId);
      setComments((prev: any[]) => prev.filter((c: any) => c.id !== commentId));
    });
  }

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const maxSize = 20 * 1024 * 1024;
    setUploading(true);

    try {
      for (const file of files) {
        if (file.size > maxSize) {
          toast.error(`Файл "${file.name}" занадто великий. Максимум 20MB.`);
          continue;
        }

        const formData = new FormData();
        formData.append("file", file);

        const response = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });

        if (!response.ok) {
          toast.error(`Помилка завантаження "${file.name}"`);
          continue;
        }

        const data = await response.json();

        if (task) {
          await addTaskAttachment(task.id, {
            name: data.name,
            url: data.url,
            mimeType: data.mimeType,
            size: data.size,
          });
        } else {
          // New task - store in pending state
          setPendingAttachments((prev: any[]) => [...prev, {
            id: `pending-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            name: data.name,
            url: data.url,
            mimeType: data.mimeType,
            size: data.size,
            createdAt: new Date()
          }]);
        }
      }

      if (task) {
        const attachmentsData = await getTaskAttachments(task.id);
        setAttachments(attachmentsData as unknown as TaskAttachmentRow[]);
      }

      toast.success("Файли завантажено");
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch (error) {
      console.error("Upload error:", error);
      toast.error("Помилка при завантаженні файлів");
    } finally {
      setUploading(false);
    }
  }

  async function onDeleteAttachment(attachmentId: string) {
    if (!task) return;
    startTransition(async () => {
      await deleteTaskAttachment(attachmentId);
      setAttachments((prev: any[]) => prev.filter((a: any) => a.id !== attachmentId));
    });
  }

  async function onAddSubtask() {
    if (!task || !newSubtaskTitle.trim()) return;
    const title = newSubtaskTitle.trim();
    setAddingSubtask(true);
    try {
      const subtask = await createSubtask(task.id, title);
      setSubtasks((prev: any[]) => [...prev, subtask as unknown as SubtaskRow]);
      setNewSubtaskTitle("");
    } catch (error) {
      toast.error("Failed to create subtask");
    } finally {
      setAddingSubtask(false);
    }
  }

  async function onToggleSubtask(subtaskId: string, isDone: boolean) {
    if (!task) return;
    // Optimistic update
    setSubtasks((prev: any[]) => prev.map((s: any) => s.id === subtaskId ? { ...s, isDone } : s));

    startTransition(async () => {
      try {
        await toggleSubtask(subtaskId, isDone);
      } catch (error) {
        // Revert on error
        setSubtasks((prev: any[]) => prev.map((s: any) => s.id === subtaskId ? { ...s, isDone: !isDone } : s));
        toast.error("Failed to update subtask");
      }
    });
  }

  async function onDeleteSubtask(subtaskId: string) {
    if (!task) return;
    // Optimistic update
    const previous = subtasks;
    setSubtasks((prev: any[]) => prev.filter((s: any) => s.id !== subtaskId));

    startTransition(async () => {
      try {
        await deleteSubtask(subtaskId);
      } catch (error) {
        setSubtasks(previous);
        toast.error("Failed to delete subtask");
      }
    });
  }

  async function onDuplicate() {
    if (!task) return;
    startTransition(async () => {
      try {
        await duplicateTask(task.id);
        toast.success("Завдання дубльовано");
        onOpenChange(false);
      } catch (error) {
        toast.error("Failed to duplicate task");
      }
    });
  }

  function getFileIcon(mimeType: string | null) {
    if (!mimeType) return <File className="h-4 w-4" />;
    if (mimeType.startsWith("image/")) return <ImageIcon className="h-4 w-4" />;
    if (mimeType.includes("pdf")) return <FileText className="h-4 w-4" />;
    return <File className="h-4 w-4" />;
  }

  function formatFileSize(bytes: number | null) {
    if (!bytes) return "—";
    const kb = bytes / 1024;
    if (kb < 1024) return `${kb.toFixed(1)} KB`;
    const mb = kb / 1024;
    return `${mb.toFixed(1)} MB`;
  }

  const fieldsDisabled = isExisting && !isEditing;

  const projectName = projects.find((p) => p.id === projectId)?.name ?? "Без проєкту";

  const dateText = range?.from
    ? range.to
      ? `${format(range.from, "dd.MM.yyyy")} – ${format(range.to, "dd.MM.yyyy")}`
      : format(range.from, "dd.MM.yyyy")
    : "Не вибрано";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{isExisting ? "Завдання" : "Нове завдання"}</DialogTitle>
        </DialogHeader>

        <div className="grid gap-4">
          {!fieldsDisabled ? (
            <div className="grid gap-2">
              <Label>Назва *</Label>
              <div className="relative">
                <Input
                  value={title}
                  disabled={pending}
                  onChange={handleTitleChange}
                  placeholder="Наприклад: Додати таблицю задач"
                />

                {(dateSuggestion || prioritySuggestion) && (
                  <div className="absolute top-full left-0 mt-1 z-10 w-full flex flex-col gap-1 animate-in fade-in slide-in-from-top-1">
                    {dateSuggestion && (
                      <button
                        type="button"
                        onClick={applyDateSuggestion}
                        className="flex items-center gap-2 p-2 text-xs bg-primary/10 text-primary border border-primary/20 rounded-md shadow-sm hover:bg-primary/20 transition-colors w-full text-left"
                      >
                        <Wand2 className="h-3 w-3" />
                        <span>
                          Виявлено дату: <strong>{formatSmartDateSuggestion(dateSuggestion.date)}</strong>
                        </span>
                        <span className="ml-auto opacity-70">Натисніть, щоб застосувати</span>
                      </button>
                    )}

                    {prioritySuggestion && (
                      <button
                        type="button"
                        onClick={applyPrioritySuggestion}
                        className="flex items-center gap-2 p-2 text-xs bg-orange-500/10 text-orange-600 border border-orange-500/20 rounded-md shadow-sm hover:bg-orange-500/20 transition-colors w-full text-left"
                      >
                        <Wand2 className="h-3 w-3" />
                        <span>
                          Виявлено пріоритет: <strong>{priorityLabel(prioritySuggestion.priority)}</strong>
                        </span>
                        <span className="ml-auto opacity-70">Натисніть, щоб застосувати</span>
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <FieldView label="Назва *">
              <span className="font-medium">{title || "—"}</span>
            </FieldView>
          )}

          {!fieldsDisabled ? (
            <div className="grid gap-2">
              <Label>Опис</Label>
              <RichTextEditor
                content={description}
                onChange={setDescription}
                placeholder="Деталі завдання..."
                showSaveButton={false}
                className="min-h-[150px]"
              />
            </div>


          ) : (
            <FieldView label="Опис">
              <div
                className="prose prose-sm dark:prose-invert max-w-none"
                dangerouslySetInnerHTML={{ __html: description?.trim() ? description : "—" }}
              />
            </FieldView>

          )}

          {!fieldsDisabled ? (
            <>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="grid gap-2">
                  <Label>Проєкт</Label>
                  <ProjectSelect projects={projects} value={projectId} onChange={setProjectId} />
                </div>

                <div className="grid gap-2">
                  <Label>Пріоритет</Label>
                  <Select
                    value={priority}
                    onValueChange={(v) => setPriority(v as Priority)}
                    disabled={pending}
                  >
                    <SelectTrigger className="h-9 w-full">
                      <SelectValue placeholder="Виберіть пріоритет" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="NONE">Не встановлено</SelectItem>
                      <SelectItem value="LOW">Низький</SelectItem>
                      <SelectItem value="MEDIUM">Середній</SelectItem>
                      <SelectItem value="HIGH">Високий</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>


              <div className="grid gap-2">
                <Label>Теги</Label>
                <TagSelect tags={tags} value={tagIds} onChange={setTagIds} disabled={pending} />
              </div>

              {isExisting && (
                <div className="grid gap-2">
                  <Label>Чек-ліст ({subtasks.filter(s => s.isDone).length}/{subtasks.length})</Label>
                  <div className="space-y-2">
                    {subtasks.map((subtask) => (
                      <div key={subtask.id} className="flex items-center gap-2 group">
                        <button
                          type="button"
                          onClick={() => onToggleSubtask(subtask.id, !subtask.isDone)}
                          className={cn(
                            "flex-shrink-0 text-muted-foreground hover:text-primary transition-colors",
                            subtask.isDone && "text-primary"
                          )}
                        >
                          {subtask.isDone ? (
                            <CheckCircle2 className="h-5 w-5" />
                          ) : (
                            <Circle className="h-5 w-5" />
                          )}
                        </button>
                        <span className={cn(
                          "flex-grow text-sm transition-all",
                          subtask.isDone && "line-through text-muted-foreground"
                        )}>
                          {subtask.title}
                        </span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => onDeleteSubtask(subtask.id)}
                          className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}

                    <div className="flex items-center gap-2">
                      <Plus className="h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Додати пункт..."
                        value={newSubtaskTitle}
                        onChange={(e) => setNewSubtaskTitle(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            onAddSubtask();
                          }
                        }}
                        className="h-8 text-sm border-none shadow-none focus-visible:ring-0 px-0 bg-transparent placeholder:text-muted-foreground"
                      />
                    </div>
                  </div>
                </div>
              )}
            </>
          ) : (
            <>
              <div className="grid gap-3 sm:grid-cols-3">
                <FieldView label="Проєкт">{projectName}</FieldView>
                <FieldView label="Пріоритет">
                  <Pill>{priorityLabel(priority)}</Pill>
                </FieldView>
                <FieldView label="Статус">
                  <Pill>{statusLabel(status)}</Pill>
                </FieldView>
              </div>


              {task?.tags && task.tags.length > 0 && (
                <FieldView label="Теги">
                  <div className="flex flex-wrap gap-2">
                    {task.tags.map((tag) => (
                      <Pill key={tag.id}>{tag.name}</Pill>
                    ))}
                  </div>
                </FieldView>
              )}


              {subtasks.length > 0 && (
                <FieldView label={`Чек-ліст (${subtasks.filter(s => s.isDone).length}/${subtasks.length})`}>
                  <div className="space-y-1">
                    {subtasks.map((subtask) => (
                      <div key={subtask.id} className="flex items-center gap-2">
                        {subtask.isDone ? (
                          <CheckCircle2 className="h-4 w-4 text-primary" />
                        ) : (
                          <Circle className="h-4 w-4 text-muted-foreground" />
                        )}
                        <span className={cn("text-sm", subtask.isDone && "line-through text-muted-foreground")}>
                          {subtask.title}
                        </span>
                      </div>
                    ))}
                  </div>
                </FieldView>
              )}
            </>
          )}

          {!fieldsDisabled ? (
            <div className="grid gap-2">
              <Label>Календар</Label>

              <Popover open={dateOpen} onOpenChange={setDateOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    disabled={pending}
                    className={cn("justify-start h-10 w-full", !range?.from && "text-muted-foreground")}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {range?.from ? dateText : "Встановити дату..."}
                  </Button>
                </PopoverTrigger>

                <PopoverContent className="w-[320px] p-0 overflow-hidden bg-background border rounded-lg shadow-xl" align="start">
                  <AdvancedDatePicker
                    range={range || { from: undefined, to: undefined }}
                    setRange={(r: any) => setRange(r)}
                    isRecurring={isRecurring}
                    setIsRecurring={setIsRecurring}
                    recurrenceFrequency={recurrenceFrequency}
                    setRecurrenceFrequency={setRecurrenceFrequency}
                    onClose={() => setDateOpen(false)}
                  />
                </PopoverContent>
              </Popover>

            </div>
          ) : (
            <>
              <FieldView label="Дата та час">{dateText}</FieldView>
              {task?.recurrenceRule && (
                <FieldView label="Повторюване завдання">
                  {(() => {
                    const rec = parseRecurrenceRule(task.recurrenceRule);
                    if (!rec) return "—";
                    const freqLabels: Record<RecurrenceFrequency, string> = {
                      daily: "Щодня",
                      weekly: "Щотижня",
                      monthly: "Щомісяця",
                      yearly: "Щороку",
                    };
                    return `${freqLabels[rec.frequency]}, кожні ${rec.interval}`;
                  })()}
                </FieldView>
              )}
            </>
          )}


          <div className="grid gap-2">
            <Label>Вкладення</Label>

            <div className="space-y-4">
              {/* Список вкладень */}
              {(attachments.length > 0 || pendingAttachments.length > 0) && (
                <div className="grid gap-2">
                  {[...attachments, ...pendingAttachments].map((file) => (
                    <div
                      key={file.id}
                      className="flex items-center justify-between rounded-md border p-2 text-sm"
                    >
                      <a
                        href={file.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 hover:underline min-w-0"
                      >
                        {getFileIcon(file.mimeType)}
                        <span className="truncate">{file.name}</span>
                        <span className="text-xs text-muted-foreground whitespace-nowrap">
                          ({formatFileSize(file.size)})
                        </span>
                      </a>

                      {!fieldsDisabled && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-destructive shrink-0"
                          onClick={() => {
                            if (file.id.startsWith("pending-")) {
                              setPendingAttachments(prev => prev.filter(a => a.id !== file.id));
                            } else {
                              onDeleteAttachment(file.id);
                            }
                          }}
                          disabled={pending}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Завантаження */}
              {!fieldsDisabled && (
                <div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    className="hidden"
                    onChange={handleFileUpload}
                    disabled={uploading || pending}
                    multiple={true}
                  />

                  <Button
                    type="button"
                    variant="outline"
                    className="w-full"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading || pending}
                  >
                    {uploading ? (
                      "Завантаження..."
                    ) : (
                      <>
                        <Upload className="mr-2 h-4 w-4" />
                        Додати файл (макс. 20MB)
                      </>
                    )}
                  </Button>
                </div>
              )}

              {attachmentsLoading && (
                <div className="text-sm text-muted-foreground">Завантаження файлів...</div>
              )}
            </div>
          </div>

          {isExisting ? (
            <div className="grid gap-2">
              <Label>Коментарі</Label>

              <div className="flex gap-2">
                <Input
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Написати коментар..."
                  disabled={pending}
                />
                <Button onClick={onAddComment} disabled={pending || !comment.trim()}>
                  Додати
                </Button>
              </div>

              <div className="mt-2 space-y-2">
                {commentsLoading ? (
                  <div className="text-sm text-muted-foreground">Завантаження...</div>
                ) : comments.length === 0 ? (
                  <div className="text-sm text-muted-foreground">Поки немає коментарів.</div>
                ) : (
                  comments.map((c) => {
                    const author = c.user?.name || c.user?.email || "Unknown";
                    const dt = c.createdAt ? format(new Date(c.createdAt), "dd.MM.yyyy HH:mm") : "";
                    const isTemp = c.id.startsWith("tmp-");

                    return (
                      <div key={c.id} className="rounded-lg border bg-muted/20 p-3">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="text-sm font-medium">{author}</span>
                              <span className="text-xs text-muted-foreground">{dt}</span>
                            </div>
                            <div className="mt-1 whitespace-pre-wrap text-sm">{c.body}</div>
                          </div>

                          {!isTemp && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-muted-foreground hover:text-destructive"
                              onClick={() => onDeleteComment(c.id)}
                              disabled={pending}
                              aria-label="Видалити коментар"
                            >
                              <TrashIcon className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          ) : null}

          <div className="flex items-center justify-between gap-2 pt-2">
            {isExisting ? (
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={onDelete}
                  disabled={pending}
                  aria-label="Видалити"
                  className={cn(
                    "border-destructive text-destructive bg-transparent",
                    "hover:bg-destructive hover:text-destructive-foreground"
                  )}
                >
                  <TrashIcon className="h-5 w-5" />
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={onDuplicate}
                  disabled={pending}
                  title="Дублювати"
                >
                  Дублювати
                </Button>
              </div>
            ) : (
              <div />
            )}

            <div className="flex gap-2">
              {!isEditing ? (
                isExisting ? (
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setIsEditing(true)}
                    disabled={pending}
                    aria-label="Редагувати"
                  >
                    <PencilIcon className="h-5 w-5" />
                  </Button>
                ) : null
              ) : (
                <>
                  <Button
                    variant="outline"
                    onClick={() => {
                      if (isExisting) {
                        resetToTaskValues();
                        setIsEditing(false);
                      } else {
                        onOpenChange(false);
                      }
                    }}
                    disabled={pending}
                  >
                    Скасувати
                  </Button>

                  <Button onClick={onSave} disabled={pending || !title.trim()}>
                    {pending ? "Зберігаю..." : "Зберегти"}
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </DialogContent>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Ви впевнені?</AlertDialogTitle>
            <AlertDialogDescription>
              Ця дія незворотна. Завдання "{task?.title}" буде видалено назавжди.
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
    </Dialog >

  );
}
