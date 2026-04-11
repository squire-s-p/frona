import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getAuthSession } from "@/lib/auth-session";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

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
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="text-2xl font-semibold">Рахунки</div>
          <div className="text-sm text-muted-foreground">MVP: створення + позиції + PDF</div>
        </div>

        <Button asChild className="rounded-xl">
          <Link href="/dashboard/clients">+ Новий рахунок</Link>
        </Button>
      </div>

      <Card className="overflow-hidden">
        <div className="border-b p-4 md:p-6 text-sm font-semibold">Останні рахунки</div>

        <div className="divide-y">
          {invoices.length === 0 ? (
            <div className="p-6 text-sm text-muted-foreground">Поки немає рахунків</div>
          ) : (
            invoices.map((inv: any) => (
              <div
                key={inv.id}
                className="flex flex-col gap-2 p-4 md:flex-row md:items-center md:justify-between md:p-6"
              >
                <div className="min-w-0">
                  <div className="font-medium truncate">
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

                  <Button asChild variant="outline" className="rounded-xl">
                    <Link href={`/dashboard/invoices/${inv.id}`}>Відкрити</Link>
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </Card>
    </div>
  );
}
