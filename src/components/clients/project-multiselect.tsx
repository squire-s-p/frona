"use client";

import * as React from "react";
import { Check, ChevronsUpDown } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command";
import { Badge } from "@/components/ui/badge";

type ProjectOption = {
  id: string;
  name: string;
  clientId: string | null;
  status: string;
};

export default function ProjectMultiSelect({
  projects,
  value,
  onChange,
}: {
  projects: ProjectOption[];
  value: string[];
  onChange: (next: string[]) => void;
}) {
  const [open, setOpen] = React.useState(false);

  const selected = React.useMemo(() => {
    const map = new Map(projects.map((p) => [p.id, p]));
    return value.map((id) => map.get(id)).filter(Boolean) as ProjectOption[];
  }, [projects, value]);

  function toggle(id: string) {
    if (value.includes(id)) onChange(value.filter((x) => x !== id));
    else onChange([...value, id]);
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="h-auto min-h-10 w-full justify-between"
        >
          <div className="flex flex-wrap gap-2">
            {selected.length === 0 ? (
              <span className="text-muted-foreground">Знайти або створити...</span>
            ) : (
              selected.slice(0, 3).map((p) => (
                <Badge key={p.id} variant="secondary" className="font-normal">
                  {p.name}
                </Badge>
              ))
            )}

            {selected.length > 3 ? (
              <Badge variant="secondary" className="font-normal">
                +{selected.length - 3}
              </Badge>
            ) : null}
          </div>

          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>

      <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
        <Command>
          <CommandInput placeholder="Знайти або створити..." />
          <CommandEmpty>Нічого не знайдено</CommandEmpty>

          <CommandGroup>
            {/* Опція "Без проєкту" тут не потрібна як value,
                бо просто не обираєш нічого. Якщо хочеш — додамо окремий toggle. */}
            {projects.map((p) => {
              const isSelected = value.includes(p.id);
              return (
                <CommandItem
                  key={p.id}
                  value={p.name}
                  onSelect={() => toggle(p.id)}
                  className="flex items-center justify-between"
                >
                  <span className="truncate">{p.name}</span>
                  <Check className={cn("h-4 w-4", isSelected ? "opacity-100" : "opacity-0")} />
                </CommandItem>
              );
            })}
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
