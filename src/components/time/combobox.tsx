"use client";

import * as React from "react";
import { Check, ChevronsUpDown, Plus } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";

export function Combobox({
  value,
  onChange,
  items,
  placeholder,
  emptyText,
  disabled,
  clearable,
  actionLabel,
  actionDisabled,
  onAction,
}: {
  value: string | null;
  onChange: (next: string | null) => void;
  items: Array<{ value: string; label: string }>;
  placeholder: string;
  emptyText: string;
  disabled?: boolean;
  clearable?: boolean;

  actionLabel?: string;
  actionDisabled?: boolean;
  onAction?: () => void;
}) {
  const [open, setOpen] = React.useState(false);
  const selected = items.find((i) => i.value === value) ?? null;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
          disabled={disabled}
        >
          <span className={cn("truncate", !selected && "text-muted-foreground")}>
            {selected ? selected.label : placeholder}
          </span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>

      <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
        <Command>
          <CommandInput placeholder="Пошук..." />
          <CommandList>
            <CommandEmpty>{emptyText}</CommandEmpty>
            <CommandGroup>
              {clearable && value ? (
                <CommandItem
                  value="__clear__"
                  onSelect={() => {
                    onChange(null);
                    setOpen(false);
                  }}
                >
                  <span className="text-muted-foreground">— Очистити —</span>
                </CommandItem>
              ) : null}
              {items.map((i) => (
                <CommandItem
                  key={i.value}
                  value={i.label}
                  onSelect={() => {
                    onChange(i.value);
                    setOpen(false);
                  }}
                >
                  <Check className={cn("mr-2 h-4 w-4", value === i.value ? "opacity-100" : "opacity-0")} />
                  <span className="truncate">{i.label}</span>
                </CommandItem>
              ))}

              {actionLabel ? (
                <>
                  <div className="my-1 h-px bg-border" />
                  <CommandItem
                    value={actionLabel}
                    disabled={actionDisabled}
                    onSelect={() => {
                      if (actionDisabled) return;
                      onAction?.();
                      setOpen(false);
                    }}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    {actionLabel}
                  </CommandItem>
                </>
              ) : null}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
