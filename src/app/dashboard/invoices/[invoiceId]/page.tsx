import Link from "next/link";
import { notFound } from "next/navigation";

import { prisma } from "@/lib/prisma";
import { getAuthSession } from "@/lib/auth-session";

import { Button } from "@/components/ui/button";
import InvoiceEditor from "@/components/invoices/invoice-editor";
import {
  DashboardPage,
  DashboardPageHeader,
  DashboardSurface,
} from "@/components/layout/dashboard-page";

export default async function InvoicePage({
  params,
}: {
  params: Promise<{ invoiceId: string }>;
}) {
  const { invoiceId } = await params;

  const session = await getAuthSession();
  if (!session?.user?.id) return null;

  const [invoice, clients] = await Promise.all([
    prisma.invoice.findFirst({
      where: { id: invoiceId, userId: session.user.id },
      include: {
        items: { orderBy: { sort: "asc" } },
        client: { select: { id: true, name: true } },
      },
    }),
    prisma.client.findMany({
      where: { userId: session.user.id },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
  ]);

  if (!invoice) notFound();

  return (
    <DashboardPage>
      <DashboardPageHeader
        title={`Рахунок №${invoice.number} • ${invoice.client?.name ?? "Клієнт"}`}
        description={
          <Link
            href="/dashboard/invoices"
            className="hover:underline underline-offset-4"
          >
            ← Назад до рахунків
          </Link>
        }
        actions={
          <div className="flex items-center gap-2">
            <Button asChild variant="outline">
              <a
                href={`/dashboard/invoices/${invoice.id}/pdf`}
                target="_blank"
                rel="noreferrer"
              >
                Завантажити PDF
              </a>
            </Button>
            <Button asChild variant="outline">
              <Link href={`/dashboard/clients/${invoice.clientId}`}>Клієнт</Link>
            </Button>
          </div>
        }
      />

      <DashboardSurface className="p-0">
        <div className="p-4 md:p-6">
          <InvoiceEditor
            invoice={{
              id: invoice.id,
              number: invoice.number,
              clientId: invoice.clientId,
              issueDate: invoice.issueDate,
              dueDate: invoice.dueDate,
              currency: invoice.currency,
              status: invoice.status,
              notes: invoice.notes ?? "",
              subtotal: Number(invoice.subtotal),
              total: Number(invoice.total),
            }}
            items={invoice.items.map((it: any) => ({
              id: it.id,
              name: it.name,
              description: (it as any).description ?? "",
              unit: it.unit ?? "",
              qty: Number(it.qty),
              price: Number(it.price),
              amount: Number(it.amount),
              sort: it.sort,
            }))}
            clients={clients}
          />
        </div>
      </DashboardSurface>
    </DashboardPage>
  );
}

