"use client";

import * as React from "react";
import { useRouter } from "next/navigation";

import { createInvoice } from "@/app/dashboard/invoices/actions";
import { Button } from "@/components/ui/button";

type Props = {
  clientId?: string;          // якщо створюємо в контексті клієнта
  clients?: { id: string; name: string }[]; // опційно (на майбутнє)
  trigger?: React.ReactNode;  // кастомний тригер-кнопка
};

function toISODateOnly(d: Date) {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return new Date(`${yyyy}-${mm}-${dd}T00:00:00.000Z`).toISOString();
}

export default function InvoiceCreateDialog({ clientId, trigger }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = React.useTransition();
  const [error, setError] = React.useState<string | null>(null);

  function handleCreate() {
    setError(null);

    if (!clientId) {
      setError("Немає клієнта для створення рахунку. Відкрий клієнта або додай вибір клієнта.");
      return;
    }

    startTransition(async () => {
      try {
        const now = new Date();
        const due = new Date();
        due.setDate(due.getDate() + 14);

        const created = await createInvoice({
          clientId,
          issueDate: toISODateOnly(now),
          dueDate: toISODateOnly(due),
          currency: "UAH",
          notes: "",
        });

        router.push(`/dashboard/invoices/${created.id}`);
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : "Помилка створення рахунку");
      }
    });
  }

  return (
    <div className="flex flex-col items-end gap-2">
      {trigger ? (
        <span onClick={handleCreate} className={isPending ? "pointer-events-none opacity-60" : ""}>
          {trigger}
        </span>
      ) : (
        <Button className="rounded-xl" onClick={handleCreate} disabled={isPending}>
          {isPending ? "Створюю…" : "+ Новий рахунок"}
        </Button>
      )}

      {error && <div className="text-sm text-destructive">{error}</div>}
    </div>
  );
}
