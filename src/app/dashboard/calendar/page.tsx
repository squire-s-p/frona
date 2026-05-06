import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Календар",
};

import CalendarClient from "@/components/calendar/calendar-client";
import { DashboardPage } from "@/components/layout/dashboard-page";

export default function CalendarPage() {
  return (
    <DashboardPage className="h-full">
      <CalendarClient />
    </DashboardPage>
  );
}

