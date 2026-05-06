"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Check, ChevronsUpDown, Plus, Trash2 } from "lucide-react";

import { cn } from "@/lib/utils";

import { updateInvoice, upsertInvoiceItem, deleteInvoiceItem } from "@/app/dashboard/invoices/actions";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";

import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";

import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";

type Currency = "UAH" | "EUR" | "USD";
type ClientOption = { id: string; name: string };

type InvoiceVM = {
  id: string;
  number: string;
  clientId: string;
  issueDate: Date;
  dueDate: Date | null;
  currency: string;
  status: string;
  notes: string;
  subtotal: number;
  total: number;
};

type ItemVM = {
  id?: string;
  name: string;
  description?: string;
  qty: number;
  price: number;
  amount: number;
  sort: number;
  _deleted?: boolean;
};

function round2(n: number) {
  return Math.round(n * 100) / 100;
}

function moneyUA(n: number) {
  return new Intl.NumberFormat("uk-UA", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n);
}

function fmtDate(d: Date) {
  return new Intl.DateTimeFormat("uk-UA", { day: "2-digit", month: "2-digit", year: "numeric" }).format(d);
}

function toISODateOnly(d: Date) {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return new Date(`${yyyy}-${mm}-${dd}T00:00:00.000Z`).toISOString();
}

function currencyLabel(c: Currency) {
  if (c === "UAH") return "грн";
  if (c === "EUR") return "€";
  if (c === "USD") return "$";
  return c;
}

function uniqSort(rows: ItemVM[]) {
  return rows
    .map((r, i) => ({ ...r, sort: Number.isFinite(r.sort) ? r.sort : i }))
    .sort((a, b) => (a.sort ?? 0) - (b.sort ?? 0));
}

function normalizeNumberInput(v: string) {
  // просто trim + max length (сервер теж перевіряє)
  const s = (v ?? "").trimStart(); // trimStart щоб не стрибав курсор
  return s.slice(0, 32);
}

export default function InvoiceEditor({
  invoice,
  items,
  clients = [],
}: {
  invoice: InvoiceVM;
  items: ItemVM[];
  clients?: ClientOption[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = React.useTransition();

  const [error, setError] = React.useState<string | null>(null);

  const isLocked = invoice.status === "paid" || invoice.status === "canceled";

  // Header fields
  const [number, setNumber] = React.useState(invoice.number);
  const [issueDate, setIssueDate] = React.useState<Date>(new Date(invoice.issueDate));
  const [dueDate, setDueDate] = React.useState<Date | null>(invoice.dueDate ? new Date(invoice.dueDate) : null);
  const [clientId, setClientId] = React.useState<string>(invoice.clientId);
  const [currency, setCurrency] = React.useState<Currency>(((invoice.currency as Currency) ?? "UAH") as Currency);
  const [notes, setNotes] = React.useState<string>(invoice.notes ?? "");

  // Popovers
  const [issueOpen, setIssueOpen] = React.useState(false);
  const [dueOpen, setDueOpen] = React.useState(false);
  const [clientOpen, setClientOpen] = React.useState(false);
  const [currencyOpen, setCurrencyOpen] = React.useState(false);

  // Items state
  const [rows, setRows] = React.useState<ItemVM[]>(() => uniqSort(items.map((x) => ({ ...x }))));

  React.useEffect(() => {
    setNumber(invoice.number);
    setIssueDate(new Date(invoice.issueDate));
    setDueDate(invoice.dueDate ? new Date(invoice.dueDate) : null);
    setClientId(invoice.clientId);
    setCurrency(((invoice.currency as Currency) ?? "UAH") as Currency);
    setNotes(invoice.notes ?? "");
    setRows(uniqSort(items.map((x) => ({ ...x }))));
    setError(null);
  }, [invoice.id]);

  const selectedClient = React.useMemo(() => {
    return clients.find((c) => c.id === clientId) ?? null;
  }, [clients, clientId]);

  const activeRows = React.useMemo(() => rows.filter((r) => !r._deleted), [rows]);

  const computedRows = React.useMemo(() => {
    return activeRows.map((r) => {
      const qty = Number.isFinite(r.qty) ? r.qty : 0;
      const price = Number.isFinite(r.price) ? r.price : 0;
      const amount = round2(qty * price);
      return { ...r, qty, price, amount };
    });
  }, [activeRows]);

  const total = React.useMemo(() => {
    return round2(computedRows.reduce((acc, r) => acc + r.amount, 0));
  }, [computedRows]);

  function setRow(idx: number, patch: Partial<ItemVM>) {
    setRows((prev) => {
      const next = [...prev];
      next[idx] = { ...next[idx], ...patch };
      return next;
    });
  }

  function addRow() {
    if (isLocked) return;
    setRows((prev) => {
      const maxSort = prev.reduce((m, r) => Math.max(m, r.sort ?? 0), 0);
      return [
        ...prev,
        {
          id: undefined,
          name: "",
          description: "",
          qty: 1,
          price: 0,
          amount: 0,
          sort: maxSort + 1,
        },
      ];
    });
  }

  function removeRow(idx: number) {
    if (isLocked) return;
    setRows((prev) => {
      const next = [...prev];
      if (next[idx]?.id) next[idx] = { ...next[idx], _deleted: true };
      else next.splice(idx, 1);
      return next;
    });
  }

  function validateBeforeSave() {
    if (!clientId) return "Оберіть клієнта";
    if (!number.trim()) return "Номер рахунку не може бути порожнім";
    if (number.trim().length > 32) return "Номер рахунку занадто довгий (max 32)";

    for (const r of computedRows) {
      if (!r.name.trim()) return "Заповни назву для кожної позиції (або видали порожню).";
      if (!Number.isFinite(r.qty) || r.qty <= 0) return "Кількість має бути > 0.";
      if (!Number.isFinite(r.price) || r.price < 0) return "Ціна не може бути відʼємною.";
    }
    return null;
  }

  async function save() {
    if (isLocked) return;
    setError(null);

    const v = validateBeforeSave();
    if (v) {
      setError(v);
      return;
    }

    startTransition(async () => {
      try {
        // 1) invoice meta (✅ number + clientId теж зберігаємо)
        await updateInvoice({
          invoiceId: invoice.id,
          number: number.trim(),
          clientId,
          issueDate: toISODateOnly(issueDate),
          dueDate: dueDate ? toISODateOnly(dueDate) : "",
          currency,
          notes,
        });

        // 2) deleted items
        const toDelete = rows.filter((r) => r._deleted && r.id).map((r) => r.id!) as string[];
        for (const itemId of toDelete) {
          await deleteInvoiceItem({ invoiceId: invoice.id, itemId });
        }

        // 3) upsert active items
        for (let i = 0; i < computedRows.length; i++) {
          const r = computedRows[i];
          await upsertInvoiceItem({
            invoiceId: invoice.id,
            itemId: r.id,
            name: r.name,
            description: r.description ?? "",
            unit: "", // MVP: окремо не показуємо
            qty: Number(r.qty),
            price: Number(r.price),
            sort: r.sort ?? i,
          });
        }

        router.refresh();
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : "Помилка збереження");
      }
    });
  }

  return (
    <div className="space-y-8">
      {/* Верхня форма */}
      <div className="grid gap-4">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {/* Номер */}
          <div className="grid gap-2">
            <Label>Номер</Label>
            <Input
              value={number}
              onChange={(e) => setNumber(normalizeNumberInput(e.target.value))}
              className="rounded-xl"
              disabled={isPending || isLocked}
            />
          </div>

          {/* Дата */}
          <div className="grid gap-2">
            <Label>Дата</Label>
            <Popover open={issueOpen} onOpenChange={setIssueOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="justify-start rounded-xl font-normal"
                  disabled={isPending || isLocked}
                >
                  {issueDate ? fmtDate(issueDate) : "Оберіть дату"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="p-2" align="start">
                <Calendar
                  mode="single"
                  selected={issueDate}
                  onSelect={(d) => {
                    if (d) setIssueDate(d);
                    setIssueOpen(false);
                  }}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Термін сплати */}
          <div className="grid gap-2">
            <Label>Термін сплати</Label>
            <Popover open={dueOpen} onOpenChange={setDueOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="justify-start rounded-xl font-normal"
                  disabled={isPending || isLocked}
                >
                  {dueDate ? fmtDate(dueDate) : "Не задано"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="p-2" align="start">
                <div className="flex justify-end pb-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    className="rounded-xl"
                    onClick={() => {
                      setDueDate(null);
                      setDueOpen(false);
                    }}
                    disabled={isPending || isLocked}
                  >
                    Очистити
                  </Button>
                </div>
                <Calendar
                  mode="single"
                  selected={dueDate ?? undefined}
                  onSelect={(d) => {
                    if (d) setDueDate(d);
                    setDueOpen(false);
                  }}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Клієнт */}
          <div className="grid gap-2">
            <Label>Клієнт</Label>
            <Popover open={clientOpen} onOpenChange={setClientOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full justify-between rounded-xl"
                  disabled={isPending || isLocked}
                >
                  <span className={cn("truncate", !selectedClient && "text-muted-foreground")}>
                    {selectedClient ? selectedClient.name : "Оберіть клієнта"}
                  </span>
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>

              <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                <Command>
                  <CommandInput placeholder="Знайти клієнта..." />
                  <CommandList>
                    <CommandEmpty>Нічого не знайдено</CommandEmpty>
                    <CommandGroup>
                      {clients.map((c) => (
                        <CommandItem
                          key={c.id}
                          value={c.name}
                          onSelect={() => {
                            setClientId(c.id);
                            setClientOpen(false);
                          }}
                        >
                          <Check className={cn("mr-2 h-4 w-4", c.id === clientId ? "opacity-100" : "opacity-0")} />
                          <span className="truncate">{c.name}</span>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>
        </div>

        {/* Валюта */}
        <div className="grid gap-2 max-w-sm">
          <Label>Валюта</Label>
          <Popover open={currencyOpen} onOpenChange={setCurrencyOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="justify-between rounded-xl"
                disabled={isPending || isLocked}
              >
                <span>{currencyLabel(currency)}</span>
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
              <Command>
                <CommandList>
                  <CommandGroup>
                    {(["UAH", "EUR", "USD"] as Currency[]).map((c) => (
                      <CommandItem
                        key={c}
                        value={c}
                        onSelect={() => {
                          setCurrency(c);
                          setCurrencyOpen(false);
                        }}
                      >
                        <Check className={cn("mr-2 h-4 w-4", currency === c ? "opacity-100" : "opacity-0")} />
                        {currencyLabel(c)}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        </div>

        {isLocked && (
          <div className="text-sm text-muted-foreground">
            Рахунок у статусі <b>{invoice.status}</b> — редагування вимкнено.
          </div>
        )}
      </div>

      <Separator />

      {/* Товари/послуги */}
      <div className="space-y-3">
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="text-lg font-semibold">Товари та послуги</div>
            <div className="text-sm text-muted-foreground">
              Назва, опис, кількість і ціна. Сума порахується автоматично.
            </div>
          </div>

          {/* ✅ ТУТ ЛИШАЄМО ТІЛЬКИ "ДОДАТИ" */}
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              className="rounded-xl"
              onClick={addRow}
              disabled={isPending || isLocked}
            >
              <Plus className="mr-2 h-4 w-4" />
              Додати
            </Button>
          </div>
        </div>

        {/* Таблиця */}
        <div className="overflow-hidden rounded-2xl border">
          <div className="grid grid-cols-12 gap-2 border-b bg-muted/30 p-3 text-xs font-semibold">
            <div className="col-span-4">Назва</div>
            <div className="col-span-4">Опис</div>
            <div className="col-span-1 text-right">К-сть</div>
            <div className="col-span-1 text-right">Ціна</div>
            <div className="col-span-1 text-right">Сума</div>
            <div className="col-span-1 text-right"></div>
          </div>

          {computedRows.length === 0 ? (
            <div className="p-6 text-sm text-muted-foreground">Додай першу позицію</div>
          ) : (
            computedRows.map((r, idx) => (
              <div key={idx} className="grid grid-cols-12 gap-2 border-b p-3 last:border-b-0">
                <div className="col-span-4">
                  <Input
                    value={r.name}
                    onChange={(e) => setRow(idx, { name: e.target.value })}
                    className="rounded-xl"
                    placeholder="Напр: Розробка сайту"
                    disabled={isPending || isLocked}
                  />
                </div>

                <div className="col-span-4">
                  <Input
                    value={r.description ?? ""}
                    onChange={(e) => setRow(idx, { description: e.target.value })}
                    className="rounded-xl"
                    placeholder="Деталі / уточнення"
                    disabled={isPending || isLocked}
                  />
                </div>

                <div className="col-span-1">
                  <Input
                    inputMode="decimal"
                    value={String(r.qty)}
                    onChange={(e) => setRow(idx, { qty: Number(e.target.value.replace(",", ".")) || 0 })}
                    className="rounded-xl text-right"
                    disabled={isPending || isLocked}
                  />
                </div>

                <div className="col-span-1">
                  <Input
                    inputMode="decimal"
                    value={String(r.price)}
                    onChange={(e) => setRow(idx, { price: Number(e.target.value.replace(",", ".")) || 0 })}
                    className="rounded-xl text-right"
                    disabled={isPending || isLocked}
                  />
                </div>

                <div className="col-span-1 flex items-center justify-end text-sm tabular-nums">
                  {moneyUA(r.amount)}
                </div>

                <div className="col-span-1 flex justify-end">
                  <Button
                    type="button"
                    variant="ghost"
                    className="rounded-xl"
                    onClick={() => removeRow(idx)}
                    disabled={isPending || isLocked}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Загальна сума */}
        <div className="flex items-center justify-end gap-3">
          <div className="text-sm font-semibold text-muted-foreground">Загальна сума</div>
          <div className="min-w-[160px] rounded-xl border px-3 py-2 text-right text-sm tabular-nums">
            {moneyUA(total)} {currencyLabel(currency)}
          </div>
        </div>
      </div>

      {/* Примітка */}
      <div className="grid gap-2">
        <Label>Примітка</Label>
        <Textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className="min-h-[120px] rounded-2xl"
          placeholder="Рахунок дійсний протягом 14-ти банківських днів…"
          disabled={isPending || isLocked}
        />
      </div>

      {error && <div className="text-sm text-destructive">{error}</div>}

      {/* ✅ НИЖНІЙ ФУТЕР — ЄДИНА КНОПКА ЗБЕРЕГТИ */}
      <div className="flex items-center justify-between">
        <Badge variant="outline" className="rounded-xl">
          subtotal: {moneyUA(invoice.subtotal)} • total: {moneyUA(invoice.total)}
        </Badge>

        <Button className="rounded-xl" onClick={save} disabled={isPending || isLocked}>
          {isPending ? "Зберігаю…" : "Зберегти"}
        </Button>
      </div>
    </div>
  );
}
