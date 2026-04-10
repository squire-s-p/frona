"use client";

import * as React from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ProjectSummaryItem, getProjectTaskDetails } from "@/app/dashboard/reports/actions";
import { Folder, Search, ArrowUpDown, ChevronDown, ChevronRight, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { DateRange } from "react-day-picker";

function formatDuration(seconds: number) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return `${h} год ${String(m).padStart(2, '0')} хв`;
}

type SortField = "project" | "client" | "time";
type SortOrder = "asc" | "desc";

export default function ReportTable({
  data,
  hoveredProjectId,
  onHoverAction,
  dateRange
}: {
  data: ProjectSummaryItem[];
  hoveredProjectId: string | null;
  onHoverAction: (id: string | null) => void;
  dateRange: DateRange | undefined;
}) {
  const [search, setSearch] = React.useState("");
  const [sortField, setSortField] = React.useState<SortField>("time");
  const [sortOrder, setSortOrder] = React.useState<SortOrder>("desc");

  const [expandedProjectId, setExpandedProjectId] = React.useState<string | null>(null);
  const [taskDetails, setTaskDetails] = React.useState<{ note: string, duration: number }[]>([]);
  const [loadingTasks, setLoadingTasks] = React.useState(false);

  const toggleExpand = async (projectId: string) => {
    if (expandedProjectId === projectId) {
      setExpandedProjectId(null);
      setTaskDetails([]);
      return;
    }

    setExpandedProjectId(projectId);
    setTaskDetails([]);
    setLoadingTasks(true);

    try {
      if (!dateRange?.from || !dateRange?.to) return;

      const details = await getProjectTaskDetails(projectId, {
        from: dateRange.from.toISOString(),
        to: dateRange.to.toISOString()
      });
      setTaskDetails(details);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingTasks(false);
    }
  };

  const filteredData = React.useMemo(() => {
    let res = data;
    if (search.trim()) {
      const q = search.toLowerCase();
      res = res.filter(
        (item) =>
          item.projectName.toLowerCase().includes(q) ||
          (item.clientName && item.clientName.toLowerCase().includes(q))
      );
    }
    return res;
  }, [data, search]);

  const sortedData = React.useMemo(() => {
    return [...filteredData].sort((a, b) => {
      let res = 0;
      if (sortField === "project") {
        res = a.projectName.localeCompare(b.projectName);
      } else if (sortField === "client") {
        res = (a.clientName || "").localeCompare(b.clientName || "");
      } else if (sortField === "time") {
        res = a.totalDuration - b.totalDuration;
      }

      return sortOrder === "asc" ? res : -res;
    });
  }, [filteredData, sortField, sortOrder]);

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("desc");
    }
  };

  const exportToCSV = () => {
    if (sortedData.length === 0) return;

    const headers = ["Проєкт", "Клієнт", "Час (сек)", "Час (формат)", "Зростання (%)"];
    const rows = sortedData.map(item => [
      item.projectName,
      item.clientName || "",
      item.totalDuration,
      formatDuration(item.totalDuration),
      item.growth !== undefined ? `${item.growth.toFixed(1)}%` : ""
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `report-projects-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <Card className="flex flex-col gap-4 p-4">
      {/* Table Controls */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-center">
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="h-8" onClick={exportToCSV}>
            Експортувати у CSV
          </Button>
        </div>
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Пошук"
            className="pl-8 h-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Table */}
      <div className="rounded-md border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead onClick={() => toggleSort("project")} className="cursor-pointer hover:bg-muted/50 w-[40%]">
                <div className="flex items-center gap-2">
                  Проєкт
                  {sortField === "project" && <ArrowUpDown className="h-3 w-3" />}
                </div>
              </TableHead>
              <TableHead onClick={() => toggleSort("client")} className="cursor-pointer hover:bg-muted/50 w-[30%] text-center">
                <div className="flex items-center justify-center gap-2">
                  Клієнт
                  {sortField === "client" && <ArrowUpDown className="h-3 w-3" />}
                </div>
              </TableHead>
              <TableHead onClick={() => toggleSort("time")} className="cursor-pointer hover:bg-muted/50 text-right w-[30%]">
                <div className="flex items-center justify-end gap-2">
                  Час
                  {sortField === "time" && <ArrowUpDown className="h-3 w-3" />}
                </div>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedData.length > 0 ? (
              sortedData.map((item) => (
                <React.Fragment key={item.projectId}>
                  <TableRow
                    className={cn(
                      "transition-colors cursor-pointer",
                      hoveredProjectId === item.projectId && "bg-muted/50",
                      expandedProjectId === item.projectId && "bg-muted/30"
                    )}
                    onMouseEnter={() => onHoverAction(item.projectId)}
                    onMouseLeave={() => onHoverAction(null)}
                    onClick={() => toggleExpand(item.projectId)}
                  >
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 flex items-center justify-center">
                          {expandedProjectId === item.projectId ? (
                            <ChevronDown className="h-4 w-4 text-muted-foreground" />
                          ) : (
                            <ChevronRight className="h-4 w-4 text-muted-foreground" />
                          )}
                        </div>
                        <Folder className="h-4 w-4 text-muted-foreground fill-muted-foreground/20" />
                        <span>{item.projectName}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-center">
                      {item.clientName || "Немає клієнта"}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex flex-col items-end">
                        <div className="font-medium">{formatDuration(item.totalDuration)}</div>
                        {item.growth !== undefined && (
                          <div className={cn(
                            "text-[10px] font-medium",
                            item.growth >= 0 ? "text-green-500" : "text-destructive"
                          )}>
                            {item.growth >= 0 ? "+" : ""}{item.growth.toFixed(1)}%
                          </div>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                  {expandedProjectId === item.projectId && (
                    <TableRow className="bg-muted/10 border-b-0 hover:bg-muted/10">
                      <TableCell colSpan={3} className="p-0">
                        <div className="px-12 py-3 border-l-2 border-primary/20 ml-6 mb-2 space-y-2">
                          {loadingTasks ? (
                            <div className="flex items-center gap-2 text-xs text-muted-foreground py-2">
                              <Loader2 className="h-3 w-3 animate-spin" />
                              Завантаження задач...
                            </div>
                          ) : taskDetails.length > 0 ? (
                            taskDetails.map((task, idx) => (
                              <div key={idx} className="flex justify-between items-center text-xs text-muted-foreground hover:text-foreground transition-colors py-1">
                                <span>{task.note}</span>
                                <span className="font-medium">{formatDuration(task.duration)}</span>
                              </div>
                            ))
                          ) : (
                            <div className="text-xs text-muted-foreground py-2">Немає описів</div>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </React.Fragment>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={3} className="h-24 text-center">
                  Немає даних
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </Card>
  );
}
