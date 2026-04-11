"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { getAuthSession } from "@/lib/auth-session";

function getSellerSnapshot() {
  return {
    name: process.env.INVOICE_SELLER_NAME ?? "Продавець",
    taxId: process.env.INVOICE_SELLER_TAX_ID ?? "",
    address: process.env.INVOICE_SELLER_ADDRESS ?? "",
    iban: process.env.INVOICE_SELLER_IBAN ?? "",
    bank: process.env.INVOICE_SELLER_BANK ?? "",
    phone: process.env.INVOICE_SELLER_PHONE ?? "",
    email: process.env.INVOICE_SELLER_EMAIL ?? "",
    signName: process.env.INVOICE_SELLER_SIGN_NAME ?? "",
  };
}

function addDays(d: Date, days: number) {
  const copy = new Date(d);
  copy.setDate(copy.getDate() + days);
  return copy;
}

function toMoney(n: number) {
  return Math.round(n * 100) / 100;
}

function normalizeInvoiceNumber(s: string) {
  // дозволяємо "0174", "174", "INV-0174" — але збережемо як trimmed string
  const v = (s ?? "").trim();
  if (!v) return null;
  if (v.length > 32) throw new Error("Номер занадто довгий (max 32)");
  return v;
}

/* =========================
   CREATE
========================= */

const createInvoiceSchema = z.object({
  clientId: z.string().min(1),
  issueDate: z.string().optional(), // ISO
  dueDate: z.string().optional(), // ISO
  currency: z.enum(["UAH", "EUR", "USD"]).optional(),
  notes: z.string().max(5000).optional().or(z.literal("")),
});

export async function createInvoice(input: unknown) {
  const session = await getAuthSession();
  if (!session?.user?.id) throw new Error("Unauthorized");
  const data = createInvoiceSchema.parse(input);

  const client = await prisma.client.findFirst({
    where: { id: data.clientId, userId: session.user.id },
    select: {
      id: true,
      name: true,
      taxId: true,
      email: true,
      address: true,
      contactInfo: true,
    },
  });
  if (!client) throw new Error("Client not found");

  const sellerSnapshot = getSellerSnapshot();
  const buyerSnapshot = {
    id: client.id,
    name: client.name,
    taxId: client.taxId ?? "",
    email: client.email ?? "",
    address: client.address ?? "",
    contactInfo: client.contactInfo ?? "",
  };

  const issueDate = data.issueDate ? new Date(data.issueDate) : new Date();
  const dueDate = data.dueDate ? new Date(data.dueDate) : addDays(issueDate, 7);

  const invoice = await prisma.$transaction(async (tx: any) => {
    const last = await tx.invoice.findFirst({
      where: { userId: session.user.id },
      orderBy: { numberInt: "desc" },
      select: { numberInt: true },
    });

    const nextInt = (last?.numberInt ?? 0) + 1;
    const number = String(nextInt).padStart(4, "0");

    return tx.invoice.create({
      data: {
        userId: session.user.id,
        clientId: client.id,
        numberInt: nextInt,
        number,
        issueDate,
        dueDate,
        currency: data.currency ?? "UAH",
        status: "draft",
        notes: data.notes?.trim() ? data.notes.trim() : null,
        sellerSnapshot,
        buyerSnapshot,
        subtotal: 0,
        total: 0,
      },
      select: { id: true },
    });
  });

  revalidatePath("/dashboard/invoices");
  revalidatePath(`/dashboard/invoices/${invoice.id}`);
  revalidatePath(`/dashboard/invoices/${invoice.id}/pdf`);
  revalidatePath(`/dashboard/clients/${data.clientId}`);
  return { ok: true, id: invoice.id };
}

/* =========================
   UPDATE (invoice fields)
========================= */

const updateInvoiceSchema = z.object({
  invoiceId: z.string().min(1),

  // ✅ нове
  number: z.string().max(32).optional().or(z.literal("")),
  clientId: z.string().optional().or(z.literal("")),

  issueDate: z.string().optional(),
  dueDate: z.string().optional().or(z.literal("")),
  currency: z.enum(["UAH", "EUR", "USD"]).optional(),
  notes: z.string().max(5000).optional().or(z.literal("")),
  status: z.enum(["draft", "issued", "paid", "canceled"]).optional(),
});

export async function updateInvoice(input: unknown) {
  const session = await getAuthSession();
  if (!session?.user?.id) throw new Error("Unauthorized");
  const data = updateInvoiceSchema.parse(input);

  const inv = await prisma.invoice.findFirst({
    where: { id: data.invoiceId, userId: session.user.id },
    select: { id: true, clientId: true, status: true },
  });
  if (!inv) throw new Error("Not found");

  // 🔒 paid / canceled — read-only (MVP правило)
  if (inv.status === "paid" || inv.status === "canceled") {
    throw new Error("Цей рахунок не можна редагувати (paid/canceled).");
  }

  // ✅ якщо міняємо клієнта — перевіряємо ownership і оновлюємо buyerSnapshot
  let nextClientId: string | undefined = undefined;
  let nextBuyerSnapshot: any | undefined = undefined;

  const requestedClientId = (data.clientId ?? "").trim();
  if (requestedClientId && requestedClientId !== inv.clientId) {
    const client = await prisma.client.findFirst({
      where: { id: requestedClientId, userId: session.user.id },
      select: {
        id: true,
        name: true,
        taxId: true,
        email: true,
        address: true,
        contactInfo: true,
      },
    });
    if (!client) throw new Error("Client not found");

    nextClientId = client.id;
    nextBuyerSnapshot = {
      id: client.id,
      name: client.name,
      taxId: client.taxId ?? "",
      email: client.email ?? "",
      address: client.address ?? "",
      contactInfo: client.contactInfo ?? "",
    };
  }

  // ✅ номер — збережемо кастомний, але без перерахунку numberInt (MVP)
  let nextNumber: string | undefined = undefined;
  if (data.number !== undefined) {
    const normalized = normalizeInvoiceNumber(data.number);
    if (normalized) nextNumber = normalized;
  }

  await prisma.invoice.update({
    where: { id: inv.id },
    data: {
      number: nextNumber ?? undefined,
      clientId: nextClientId ?? undefined,
      buyerSnapshot: nextBuyerSnapshot ?? undefined,

      issueDate: data.issueDate ? new Date(data.issueDate) : undefined,
      dueDate:
        data.dueDate === ""
          ? null
          : data.dueDate
          ? new Date(data.dueDate)
          : undefined,
      currency: data.currency,
      notes: data.notes?.trim() ? data.notes.trim() : null,
      status: data.status,
    },
  });

  // revalidate
  revalidatePath("/dashboard/invoices");
  revalidatePath(`/dashboard/invoices/${inv.id}`);
  revalidatePath(`/dashboard/invoices/${inv.id}/pdf`);
  revalidatePath(`/dashboard/clients/${inv.clientId}`);
  if (nextClientId) revalidatePath(`/dashboard/clients/${nextClientId}`);

  return { ok: true };
}

/* =========================
   UPSERT ITEM
========================= */

const upsertItemSchema = z.object({
  invoiceId: z.string().min(1),
  itemId: z.string().optional(),

  name: z.string().min(1).max(300),
  description: z.string().max(5000).optional().or(z.literal("")),
  unit: z.string().max(32).optional().or(z.literal("")),
  qty: z.number().positive(),
  price: z.number().min(0),
  sort: z.number().int().optional(),
});

export async function upsertInvoiceItem(input: unknown) {
  const session = await getAuthSession();
  if (!session?.user?.id) throw new Error("Unauthorized");
  const data = upsertItemSchema.parse(input);

  const inv = await prisma.invoice.findFirst({
    where: { id: data.invoiceId, userId: session.user.id },
    select: { id: true, clientId: true, status: true },
  });
  if (!inv) throw new Error("Not found");

  if (inv.status === "paid" || inv.status === "canceled") {
    throw new Error("Цей рахунок не можна редагувати (paid/canceled).");
  }

  const amount = toMoney(data.qty * data.price);

  if (data.itemId) {
    await prisma.invoiceItem.update({
      where: { id: data.itemId },
      data: {
        name: data.name.trim(),
        description: data.description?.trim() ? data.description.trim() : null,
        unit: data.unit?.trim() || null,
        qty: data.qty,
        price: data.price,
        amount,
        sort: data.sort ?? 0,
      },
    });
  } else {
    await prisma.invoiceItem.create({
      data: {
        invoiceId: inv.id,
        name: data.name.trim(),
        description: data.description?.trim() ? data.description.trim() : null,
        unit: data.unit?.trim() || null,
        qty: data.qty,
        price: data.price,
        amount,
        sort: data.sort ?? 0,
      },
    });
  }

  await recalcTotals(inv.id);

  revalidatePath(`/dashboard/invoices/${inv.id}`);
  revalidatePath(`/dashboard/invoices/${inv.id}/pdf`);
  revalidatePath(`/dashboard/clients/${inv.clientId}`);
  return { ok: true };
}

/* =========================
   DELETE ITEM
========================= */

const deleteItemSchema = z.object({
  invoiceId: z.string().min(1),
  itemId: z.string().min(1),
});

export async function deleteInvoiceItem(input: unknown) {
  const session = await getAuthSession();
  if (!session?.user?.id) throw new Error("Unauthorized");
  const data = deleteItemSchema.parse(input);

  const inv = await prisma.invoice.findFirst({
    where: { id: data.invoiceId, userId: session.user.id },
    select: { id: true, clientId: true, status: true },
  });
  if (!inv) throw new Error("Not found");

  if (inv.status === "paid" || inv.status === "canceled") {
    throw new Error("Цей рахунок не можна редагувати (paid/canceled).");
  }

  await prisma.invoiceItem.delete({ where: { id: data.itemId } });
  await recalcTotals(inv.id);

  revalidatePath(`/dashboard/invoices/${inv.id}`);
  revalidatePath(`/dashboard/invoices/${inv.id}/pdf`);
  revalidatePath(`/dashboard/clients/${inv.clientId}`);
  return { ok: true };
}

/* =========================
   TOTALS
========================= */

async function recalcTotals(invoiceId: string) {
  const items = await prisma.invoiceItem.findMany({
    where: { invoiceId },
    select: { amount: true },
  });

  const subtotal = items.reduce((acc: number, i: any) => acc + Number(i.amount), 0);
  const total = subtotal;

  await prisma.invoice.update({
    where: { id: invoiceId },
    data: { subtotal, total },
  });
}
