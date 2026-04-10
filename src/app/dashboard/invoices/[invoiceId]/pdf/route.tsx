import { NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";

import { prisma } from "@/lib/prisma";
import { getAuthSession } from "@/lib/auth-session";
import { InvoicePDF } from "@/lib/invoices/pdf-template";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ invoiceId: string }> }
) {
  const { invoiceId } = await params;

  const session = await getAuthSession();
  if (!session?.user?.id) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const invoice = await prisma.invoice.findFirst({
    where: { id: invoiceId, userId: session.user.id },
    include: {
      items: { orderBy: { sort: "asc" } },
      client: { select: { id: true, name: true } },
    },
  });

  if (!invoice) {
    return new NextResponse("Not found", { status: 404 });
  }

  const data = {
    number: invoice.number,
    issueDate: invoice.issueDate.toISOString(),
    dueDate: invoice.dueDate ? invoice.dueDate.toISOString() : null,
    currency: invoice.currency,
    notes: invoice.notes ?? null,
    seller: invoice.sellerSnapshot as any,
    buyer: invoice.buyerSnapshot as any,
    items: invoice.items.map((it) => ({
      name: it.name,
      description: (it as any).description ?? null,
      qty: Number(it.qty),
      price: Number(it.price),
      amount: Number(it.amount),
    })),
    subtotal: Number(invoice.subtotal),
    total: Number(invoice.total),
  };

  const pdf = await renderToBuffer(<InvoicePDF data={data} />);

  return new NextResponse(pdf, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="invoice-${invoice.number}.pdf"`,
      "Cache-Control": "no-store",
    },
  });
}
