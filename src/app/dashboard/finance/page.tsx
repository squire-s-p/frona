import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Фінанси',
};

import { FinancePageClient } from "@/components/finance/finance-page-client";

export default function Page() {
  return <FinancePageClient />;
}
