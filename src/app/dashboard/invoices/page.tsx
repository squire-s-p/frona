import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getAuthSession } from "@/lib/auth-session";

import { Button } from "@/components/ui/button";
import {
  DashboardPage,
  DashboardPageHeader,
  DashboardSurface,
} from "@/components/layout/dashboard-page";

export default async function InvoicesPage() {
  const session = await getAuthSession();
  if (!session?.user?.id) return null;

  const invoices = await prisma.invoice.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      number: true,
      status: true,
      issueDate: true,
      total: true,
      currency: true,
      client: { select: { id: true, name: true } },
    },
  });

  return (
    <DashboardPage>
      <DashboardPageHeader
        title="Рахунки"
        description="MVP: створення + позиції + PDF"
        actions={
          <Button asChild>
            <Link href="/dashboard/clients">+ Новий рахунок</Link>
          </Button>
        }
      />

      <DashboardSurface>
        <div className="border-b border-border/50 px-6 py-4 text-sm font-semibold">
          Останні рахунки
        </div>

        <div className="divide-y divide-border/60">
          {invoices.length === 0 ? (
            <div className="px-6 py-8 text-sm text-muted-foreground">
              Поки немає рахунків
            </div>
          ) : (
            invoices.map((inv: any) => (
              <div
                key={inv.id}
                className="flex flex-col gap-2 px-6 py-4 md:flex-row md:items-center md:justify-between"
              >
                <div className="min-w-0">
                  <div className="truncate font-medium">
                    №{inv.number} • {inv.client?.name ?? "Клієнт"}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {new Intl.DateTimeFormat("uk-UA", {
                      year: "numeric",
                      month: "2-digit",
                      day: "2-digit",
                    }).format(new Date(inv.issueDate))}{" "}
                    • {inv.status}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <div className="text-sm tabular-nums text-muted-foreground">
                    {new Intl.NumberFormat("uk-UA", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    }).format(Number(inv.total))}{" "}
                    {inv.currency}
                  </div>

                  <Button asChild variant="outline">
                    <Link href={`/dashboard/invoices/${inv.id}`}>Відкрити</Link>
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </DashboardSurface>
    </DashboardPage>
  );
}

