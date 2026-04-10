"use client";

import * as React from "react";
import { DateRange } from "react-day-picker";
import { startOfMonth, endOfMonth, subMonths } from "date-fns";
import ReportHeader from "@/components/reports/projects-summary/report-header";
import ReportFilters from "@/components/reports/projects-summary/report-filters";
import ReportChart from "@/components/reports/projects-summary/report-chart";
import ReportTable from "@/components/reports/projects-summary/report-table";
import { ProjectSummaryItem, getProjectsSummary, getReportMetaData, ReportFilterState } from "@/app/dashboard/reports/actions";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function ProjectsSummaryReportPage() {
    const [dateRange, setDateRange] = React.useState<DateRange | undefined>({
        from: startOfMonth(new Date()),
        to: endOfMonth(new Date()),
    });

    const [filters, setFilters] = React.useState<ReportFilterState>({});
    const [metaData, setMetaData] = React.useState<{
        projects: any[];
        clients: any[];
        tags: any[];
        team: any[];
    }>({ projects: [], clients: [], tags: [], team: [] });

    const [data, setData] = React.useState<ProjectSummaryItem[]>([]);
    const [loading, setLoading] = React.useState(false);
    const [hoveredProjectId, setHoveredProjectId] = React.useState<string | null>(null);

    // Initial metadata fetch
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

            <ReportFilters
                metaData={metaData}
                filters={filters}
                onChangeAction={setFilters}
            />

            {loading ? (
                <div className="h-64 flex items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
            ) : (
                <>
                    <ReportChart
                        data={data}
                        hoveredProjectId={hoveredProjectId}
                        onHoverAction={setHoveredProjectId}
                    />
                    <ReportTable
                        data={data}
                        hoveredProjectId={hoveredProjectId}
                        onHoverAction={setHoveredProjectId}
                        dateRange={dateRange}
                    />
                </>
            )}
        </div>
    );
}
