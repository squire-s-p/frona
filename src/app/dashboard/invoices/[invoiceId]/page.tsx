import Link from "next/link";
import { notFound } from "next/navigation";

import { prisma } from "@/lib/prisma";
import { getAuthSession } from "@/lib/auth-session";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

import InvoiceEditor from "@/components/invoices/invoice-editor";

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
    <div className="space-y-6">
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div className="min-w-0">
          <div className="text-2xl font-semibold truncate">
            Рахунок №{invoice.number} • {invoice.client?.name ?? "Клієнт"}
          </div>
          <div className="text-sm text-muted-foreground">
            <Link href="/dashboard/invoices" className="hover:underline underline-offset-4">
              ← Назад до рахунків
            </Link>
          </div>
        </div>

        <div className="flex gap-2">
          <Button asChild variant="outline" className="rounded-xl">
            <a href={`/dashboard/invoices/${invoice.id}/pdf`} target="_blank" rel="noreferrer">
              Завантажити PDF
            </a>
          </Button>
          <Button asChild variant="outline" className="rounded-xl">
            <Link href={`/dashboard/clients/${invoice.clientId}`}>Клієнт</Link>
          </Button>
        </div>
      </div>

      <Card className="p-4 md:p-6">
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
      </Card>
    </div>
  );
}
