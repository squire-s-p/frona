import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Звіти • Проєкти",
};

import ProjectsSummaryReportPage from "@/components/reports/projects-summary/projects-summary-report-page";
import { DashboardPage } from "@/components/layout/dashboard-page";

export default function ProjectsReportPage() {
  return (
    <DashboardPage className="h-full">
      <ProjectsSummaryReportPage />
    </DashboardPage>
  );
}

