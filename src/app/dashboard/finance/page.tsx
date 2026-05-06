import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Фінанси",
};

import { FinancePageClient } from "@/components/finance/finance-page-client";
import { DashboardPage } from "@/components/layout/dashboard-page";

export default function FinancePage() {
  return (
    <DashboardPage className="h-full">
      <FinancePageClient />
    </DashboardPage>
  );
}

