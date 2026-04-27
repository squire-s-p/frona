"use client"

import * as React from "react"
import { ColumnDef } from "@tanstack/react-table"
import { MoreHorizontal } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { DataTable } from "@/components/ui/data-table/data-table"
import { DataTableColumnHeader } from "@/components/ui/data-table/data-table-column-header"

// --- Types ---

type Payment = {
  id: string
  amount: number
  status: "pending" | "processing" | "success" | "failed"
  email: string
  customer: string
  date: string
}

// --- Data ---

const payments: Payment[] = [
  {
    id: "728ed52f",
    amount: 100,
    status: "success",
    email: "m@example.com",
    customer: "Oleksandr Fedorov",
    date: "2024-04-20",
  },
  {
    id: "489e1d42",
    amount: 125,
    status: "processing",
    email: "example@gmail.com",
    customer: "Iryna Melnyk",
    date: "2024-04-19",
  },
  {
    id: "3e9b1d42",
    amount: 250,
    status: "pending",
    email: "admin@company.ua",
    customer: "Dmitro Koval",
    date: "2024-04-18",
  },
  {
    id: "2a9b1d42",
    amount: 80,
    status: "failed",
    email: "user@test.com",
    customer: "Olena Petrenko",
    date: "2024-04-17",
  },
  {
    id: "1f9b1d42",
    amount: 1000,
    status: "success",
    email: "ceo@enterprise.com",
    customer: "Enterprise LLC",
    date: "2024-04-16",
  },
  {
    id: "0d9b1d42",
    amount: 45,
    status: "success",
    email: "support@service.io",
    customer: "Service IO",
    date: "2024-04-15",
  },
]

// --- Columns ---

const columns: ColumnDef<Payment>[] = [
  {
    id: "select",
    header: ({ table }) => (
      <div className="px-1">
        <Checkbox
          checked={
            table.getIsAllPageRowsSelected() ||
            (table.getIsSomePageRowsSelected() && "indeterminate")
          }
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Вибрати все"
        />
      </div>
    ),
    cell: ({ row }) => (
      <div className="px-1">
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Вибрати рядок"
        />
      </div>
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: "status",
    header: "Статус",
    cell: ({ row }) => {
      const status = row.getValue("status") as string
      return (
        <Badge
          variant={
            status === "success"
              ? "default"
              : status === "failed"
              ? "destructive"
              : "secondary"
          }
          className="capitalize font-bold text-[10px] tracking-wider px-2 py-0.5"
        >
          {status}
        </Badge>
      )
    },
  },
  {
    accessorKey: "customer",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Клієнт" />
    ),
  },
  {
    accessorKey: "email",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Email" />
    ),
  },
  {
    accessorKey: "amount",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Сума" />
    ),
    cell: ({ row }) => {
      const amount = parseFloat(row.getValue("amount"))
      const formatted = new Intl.NumberFormat("uk-UA", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(amount)

      return <div className="font-mono font-bold">{formatted} ₴</div>
    },
  },
  {
    accessorKey: "date",
    header: "Дата",
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const payment = row.original

      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800">
              <span className="sr-only">Відкрити меню</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="rounded-xl">
            <DropdownMenuLabel className="text-xs font-bold uppercase tracking-wider text-zinc-500">Дії</DropdownMenuLabel>
            <DropdownMenuItem
              onClick={() => navigator.clipboard.writeText(payment.id)}
            >
              Копіювати ID
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem>Переглянути клієнта</DropdownMenuItem>
            <DropdownMenuItem>Деталі платежу</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )
    },
  },
]

// --- Page ---

export default function DataTablePage() {
  return (
    <div className="space-y-10 pr-10 pb-20">
      <div className="space-y-4">
        <h1 className="scroll-m-20 text-4xl font-bold tracking-tight lg:text-5xl text-foreground">
          Data Table
        </h1>
        <p className="text-lg text-muted-foreground">
          Потужний компонент таблиці на базі @tanstack/react-table з підтримкою сортування, фільтрації та пагінації.
        </p>
      </div>

      <div className="space-y-8">
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">Демонстрація</h2>
          </div>
          <DataTable columns={columns} data={payments} searchKey="email" />
        </section>

        <section className="space-y-4 max-w-3xl">
          <h2 className="text-2xl font-bold">Особливості</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50">
              <h3 className="font-bold mb-2">Сортування</h3>
              <p className="text-sm text-muted-foreground">Натисніть на заголовок колонки (Клієнт, Email, Сума), щоб змінити порядок.</p>
            </div>
            <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50">
              <h3 className="font-bold mb-2">Фільтрація</h3>
              <p className="text-sm text-muted-foreground">Використовуйте поле пошуку зверху для миттєвої фільтрації по Email.</p>
            </div>
            <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50">
              <h3 className="font-bold mb-2">Видимість колонок</h3>
              <p className="text-sm text-muted-foreground">Кнопка "Вигляд" дозволяє приховувати або показувати окремі колонки.</p>
            </div>
            <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50">
              <h3 className="font-bold mb-2">Вибір рядків</h3>
              <p className="text-sm text-muted-foreground">Підтримка вибору окремих рядків або всіх одразу за допомогою чекбоксів.</p>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}
