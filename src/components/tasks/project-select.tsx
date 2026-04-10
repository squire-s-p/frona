"use client";

import * as React from "react";
import { createProjectQuick } from "@/server/tasks/actions";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command";

type ProjectOption = { id: string; name: string };

export function ProjectSelect({
  projects,
  value,
  onChange,
}: {
  projects: ProjectOption[];
  value: string | null;
  onChange: (id: string | null) => void;
}) {
  const [open, setOpen] = React.useState(false);
  const [pending, startTransition] = React.useTransition();

  const selected = projects.find((p) => p.id === value) ?? null;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" className="w-full justify-start overflow-hidden">
          <span className="truncate">
            {selected ? selected.name : "Без проєкту"}
          </span>
        </Button>
      </PopoverTrigger>

      <PopoverContent className="p-0" align="start">
        <Command>
          <CommandInput placeholder="Знайти або створити..." />
          <CommandEmpty>
            <CreateProjectInline
              onCreate={(name) => {
                startTransition(async () => {
                  const p = await createProjectQuick(name);
                  onChange(p.id);
                  setOpen(false);
                });
              }}
              disabled={pending}
            />
          </CommandEmpty>

          <CommandGroup>
            <CommandItem
              onSelect={() => {
                onChange(null);
                setOpen(false);
              }}
            >
              Без проєкту
            </CommandItem>

            {projects.map((p) => (
              <CommandItem
                key={p.id}
                value={p.name}
                onSelect={() => {
                  onChange(p.id);
                  setOpen(false);
                }}
              >
                {p.name}
              </CommandItem>
            ))}
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

function CreateProjectInline({
  onCreate,
  disabled,
}: {
  onCreate: (name: string) => void;
  disabled: boolean;
}) {
  const [name, setName] = React.useState("");

  return (
    <div className="p-3 space-y-2">
      <div className="text-sm">Проєкт не знайдено — створити?</div>
      <input
        className="h-9 w-full rounded-md border bg-background px-2 text-sm"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Назва проєкту"
      />
      <Button
        className="w-full"
        disabled={disabled || !name.trim()}
        onClick={() => onCreate(name)}
      >
        Створити проєкт
      </Button>
    </div>
  );
}
