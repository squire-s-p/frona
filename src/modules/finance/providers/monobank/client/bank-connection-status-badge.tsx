"use client";

import React from "react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { BankConnectionStatusEnum } from "../types";

const statusConfig: Record<
  BankConnectionStatusEnum,
  { label: string; className: string }
> = {
  PENDING: {
    label: "Очікує",
    className: "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400",
  },
  WAITING_CONFIRMATION: {
    label: "Очікує підтвердження",
    className: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  },
  CONNECTED: {
    label: "Підключено",
    className: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  },
  FAILED: {
    label: "Помилка",
    className: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  },
  EXPIRED: {
    label: "Прострочено",
    className: "bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-500",
  },
};

interface BankConnectionStatusBadgeProps {
  status: BankConnectionStatusEnum;
  className?: string;
}

export function BankConnectionStatusBadge({
  status,
  className,
}: BankConnectionStatusBadgeProps) {
  const config = statusConfig[status];

  return (
    <Badge
      variant="secondary"
      className={cn("text-xs", config.className, className)}
    >
      {config.label}
    </Badge>
  );
}
