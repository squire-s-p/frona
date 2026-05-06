"use client";

import * as React from "react";
import { DateRange } from "react-day-picker";
import { startOfMonth, endOfMonth } from "date-fns";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import ReportHeader from "@/components/reports/projects-summary/report-header";
import ReportFilters from "@/components/reports/projects-summary/report-filters";
import ReportChart from "@/components/reports/projects-summary/report-chart";
import ReportTable from "@/components/reports/projects-summary/report-table";
import {
  ProjectSummaryItem,
  getProjectsSummary,
  getReportMetaData,
  ReportFilterState,
} from "@/app/dashboard/reports/actions";
import { DashboardSurface } from "@/components/layout/dashboard-page";

export default function ProjectsSummaryReportPage() {
  const [dateRange, setDateRange] = React.useState<DateRange | undefined>({
    from: startOfMonth(new Date()),
    to: endOfMonth(new Date()),
  });

  const [filters, setFilters] = React.useState<ReportFilterState>({});
  const [metaData, setMetaData] = React.useState<{
    projects: Array<{ id: string; name: string; clientId: string | null }>;
    clients: Array<{ id: string; name: string }>;
    tags: Array<{ id: string; name: string }>;
    team: Array<{ id: string; name: string }>;
  }>({ projects: [], clients: [], tags: [], team: [] });

  const [data, setData] = React.useState<ProjectSummaryItem[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [hoveredProjectId, setHoveredProjectId] = React.useState<string | null>(
    null
  );

  React.useEffect(() => {
    async function fetchMeta() {
      try {
        const meta = await getReportMetaData();
        setMetaData(meta);
      } catch (err) {
        console.error("Failed to fetch report metadata", err);
      }
    }
    fetchMeta();
  }, []);

  React.useEffect(() => {
    async function loadData() {
      if (!dateRange?.from || !dateRange?.to) return;

      setLoading(true);
      try {
        const res = await getProjectsSummary(
          {
            from: dateRange.from.toISOString(),
            to: dateRange.to.toISOString(),
          },
          filters
        );
        setData(res);
      } catch (error) {
        console.error(error);
        toast.error("Не вдалося завантажити звіт");
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [dateRange, filters]);

  return (
    <div className="flex flex-col gap-6">
      <ReportHeader
        dateRange={dateRange}
        setDateRangeAction={setDateRange}
        data={data}
        loading={loading}
      />

      <ReportFilters metaData={metaData} filters={filters} onChangeAction={setFilters} />

      {loading ? (
        <DashboardSurface>
          <div className="h-64 flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        </DashboardSurface>
      ) : (
        <>
          <DashboardSurface className="p-0">
            <ReportChart
              data={data}
              hoveredProjectId={hoveredProjectId}
              onHoverAction={setHoveredProjectId}
            />
          </DashboardSurface>
          <DashboardSurface className="p-0">
            <ReportTable
              data={data}
              hoveredProjectId={hoveredProjectId}
              onHoverAction={setHoveredProjectId}
              dateRange={dateRange}
            />
          </DashboardSurface>
        </>
      )}
    </div>
  );
}

