"use client";

import * as React from "react";
import type { TaskRow } from "./tasks-client";
import { Pin } from "lucide-react";
import {
  ColumnDef,
  getCoreRowModel,
  getSortedRowModel,
  SortingState,
  useReactTable,
} from "@tanstack/react-table";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";

function formatDateRange(startIso: string | null, endIso: string | null) {
  if (!startIso && !endIso) return "—";
  const start = startIso ? new Date(startIso) : null;
  const end = endIso ? new Date(endIso) : null;
  const s = start ? start.toLocaleDateString() : "…";
  const e = end ? end.toLocaleDateString() : "…";
  return `${s} – ${e}`;
}

function priorityLabel(p: TaskRow["priority"]) {
  switch (p) {
    case "LOW": return "Low";
    case "MEDIUM": return "Medium";
    case "HIGH": return "High";
    case "NONE": return "None";
    default: return "None";
  }
}

function statusLabel(s: TaskRow["status"]) {
  switch (s) {
    case "TODO": return "Todo";
    case "DONE": return "Done";
    default: return "Todo";
  }
}

const columns: ColumnDef<TaskRow>[] = [
  {
    accessorKey: "title",
    header: "Назва",
    cell: ({ row }) => (
      <div className="min-w-0">
        <div className={cn(
          "flex items-center gap-2 font-medium truncate",
          row.original.status === "DONE" && "line-through text-muted-foreground opacity-70"
        )}>
          {row.original.isPinned && (
            <Pin className="h-3.5 w-3.5 fill-primary text-primary shrink-0" />
          )}
          {row.original.title}
        </div>
        <div className="flex flex-wrap items-center gap-1.5 mt-1">
          {row.original.project?.name ? (
            <span className="text-xs text-muted-foreground truncate">
              {row.original.project.name}
            </span>
          ) : null}
          {row.original.tags && row.original.tags.length > 0 && (
            <>
              {row.original.project?.name && <span className="text-xs text-muted-foreground">•</span>}
              <div className="flex flex-wrap gap-1">
                {row.original.tags.map((tag) => (
                  <span
                    key={tag.id}
                    className="inline-flex items-center rounded-md border bg-muted/50 px-1.5 py-0.5 text-xs text-muted-foreground"
                  >
                    {tag.name}
                  </span>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    ),
  },
  {
    accessorKey: "priority",
    header: "Пріоритет",
    sortingFn: "alphanumeric",
    cell: ({ row }) => priorityLabel(row.original.priority),
  },
  {
    accessorKey: "status",
    header: "Статус",
    sortingFn: "alphanumeric",
    cell: ({ row }) => statusLabel(row.original.status),
  },
  {
    id: "dateRange",
    header: "Дата",
    accessorFn: (row) => row.startDate ?? row.endDate ?? row.updatedAt,
    cell: ({ row }) => formatDateRange(row.original.startDate, row.original.endDate),
  },
  {
    accessorKey: "updatedAt",
    header: "Оновлено",
    cell: ({ row }) => new Date(row.original.updatedAt).toLocaleString(),
  },
];

function filterByQuery(tasks: TaskRow[], query: string) {
  const q = query.trim().toLowerCase();
  if (!q) return tasks;

  return tasks.filter((t) => {
    const hay = [
      t.title,
      t.description ?? "",
      t.project?.name ?? "",
      t.status,
      t.priority,
      ...(t.tags?.map((tag) => tag.name) ?? []),
    ]
      .join(" ")
      .toLowerCase();

    return hay.includes(q);
  });
}

function groupTasks(tasks: TaskRow[]) {
  const map = new Map<string, { projectName: string; items: TaskRow[] }>();

  for (const t of tasks) {
    const key = t.project?.id ?? "__no_project__";
    const name = t.project?.name ?? "Без проєкту";

    if (!map.has(key)) map.set(key, { projectName: name, items: [] });
    map.get(key)!.items.push(t);
  }

  // стабільний порядок: за назвою проєкту
  return Array.from(map.entries())
    .sort((a, b) => a[1].projectName.localeCompare(b[1].projectName))
    .map(([, v]) => v);
}

export function TasksTable({
  tasks,
  query,
  groupByProject,
  onRowClick,
}: {
  tasks: TaskRow[];
  query: string;
  groupByProject: boolean;
  onRowClick: (task: TaskRow) => void;
}) {
  const [sorting, setSorting] = React.useState<SortingState>([
    { id: "updatedAt", desc: true },
  ]);

  const filtered = React.useMemo(() => filterByQuery(tasks, query), [tasks, query]);

  const table = useReactTable({
    data: filtered,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  if (!filtered.length) {
    return (
      <div className="flex flex-col items-center justify-center py-10 text-center rounded-2xl border border-dashed bg-muted/20">
        <div className="text-sm font-medium text-muted-foreground">Завдань не знайдено</div>
        <div className="text-xs text-muted-foreground mt-1">Спробуйте змінити пошуковий запит</div>
      </div>
    );
  }

  if (groupByProject) {
    const groups = groupTasks(table.getRowModel().rows.map((r) => r.original));
    return (
      <div className="space-y-6">
        {groups.map((g) => (
          <div key={g.projectName} className="space-y-3">
            <div className="flex items-center justify-between px-1">
              <div className="text-sm font-semibold tracking-tight">{g.projectName}</div>
              <div className="text-[10px] uppercase font-bold text-muted-foreground bg-muted px-2 py-0.5 rounded-full">{g.items.length} задач</div>
            </div>
            <div className="">
              <InnerTable
                data={g.items}
                sorting={sorting}
                setSorting={setSorting}
                onRowClick={onRowClick}
              />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="">
      <InnerTable
        data={table.getRowModel().rows.map((r) => r.original)}
        sorting={sorting}
        setSorting={setSorting}
        onRowClick={onRowClick}
      />
    </div>
  );
}

function InnerTable({
  data,
  sorting,
  setSorting,
  onRowClick,
}: {
  data: TaskRow[];
  sorting: SortingState;
  setSorting: any;
  onRowClick: (task: TaskRow) => void;
}) {
  const table = useReactTable({
    data,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  return (
    <div className="space-y-4">
      {/* Mobile View: Cards */}
      <div className="grid grid-cols-1 gap-3 md:hidden">
        {data.map((task) => (
          <div
            key={task.id}
            className="group relative flex flex-col gap-3 rounded-2xl border bg-card p-4 shadow-sm transition-all hover:border-primary/50"
            onClick={() => onRowClick(task)}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <div className={cn(
                  "flex items-center gap-2 font-medium break-words",
                  task.status === "DONE" && "line-through text-muted-foreground opacity-70"
                )}>
                  {task.isPinned && (
                    <Pin className="h-3.5 w-3.5 fill-primary text-primary shrink-0" />
                  )}
                  {task.title}
                </div>
                {task.project?.name && (
                  <div className="mt-1 text-[11px] text-muted-foreground">
                    Проєкт: <span className="font-medium">{task.project.name}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <span className={cn(
                "inline-flex items-center rounded-lg border px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider",
                task.priority === "HIGH" ? "border-orange-500/30 bg-orange-500/10 text-orange-700" :
                task.priority === "MEDIUM" ? "border-blue-500/30 bg-blue-500/10 text-blue-700" :
                "border-border bg-muted/50 text-muted-foreground"
              )}>
                {priorityLabel(task.priority)}
              </span>
              <span className={cn(
                "inline-flex items-center rounded-lg border px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider",
                task.status === "DONE" ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-700" :
                "border-border bg-muted/50 text-muted-foreground"
              )}>
                {statusLabel(task.status)}
              </span>
            </div>

            {task.tags && task.tags.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {task.tags.map((tag) => (
                  <span
                    key={tag.id}
                    className="rounded-md border bg-muted/30 px-1.5 py-0.5 text-[10px] text-muted-foreground"
                  >
                    #{tag.name}
                  </span>
                ))}
              </div>
            )}

            <div className="flex items-center justify-between border-t border-dashed pt-3 text-[10px] text-muted-foreground">
              <div className="flex flex-wrap gap-x-3 gap-y-1">
                <span>{formatDateRange(task.startDate, task.endDate)}</span>
              </div>
              <span>Оновлено: {new Date(task.updatedAt).toLocaleDateString("uk-UA")}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Desktop View: Table */}
      <div className="hidden md:block rounded-2xl border bg-card overflow-hidden">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((hg) => (
              <TableRow key={hg.id} className="hover:bg-transparent border-b">
                {hg.headers.map((h) => (
                  <TableHead
                    key={h.id}
                    className={cn("h-10 text-xs font-semibold px-4 cursor-default", h.column.getCanSort() && "cursor-pointer select-none")}
                    onClick={h.column.getToggleSortingHandler()}
                  >
                    <div className="flex items-center gap-2">
                      {h.isPlaceholder ? null : (h.column.columnDef.header as any)}
                      {h.column.getIsSorted() === "asc" ? "▲" : null}
                      {h.column.getIsSorted() === "desc" ? "▼" : null}
                    </div>
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>

          <TableBody>
            {table.getRowModel().rows.map((row) => (
              <TableRow
                key={row.id}
                className="cursor-pointer group hover:bg-muted/30 border-b last:border-0"
                onClick={() => onRowClick(row.original)}
              >
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id} className="px-4 py-3">
                    {cell.column.columnDef.cell
                      ? (cell.column.columnDef.cell as any)({ row })
                      : (cell.getValue() as any)}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
