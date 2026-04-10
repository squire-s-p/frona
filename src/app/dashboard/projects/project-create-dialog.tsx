"use client";

import * as React from "react";
import { useTransition } from "react";

import { createProject } from "@/app/dashboard/projects/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export default function ProjectCreateDialog({
  onCreated,
}: {
  onCreated?: () => void;
}) {
  const [open, setOpen] = React.useState(false);
  const [name, setName] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function submit() {
    setError(null);

    const fd = new FormData();
    fd.set("name", name);

    startTransition(async () => {
      try {
        await createProject(fd);
        setName("");
        setOpen(false);
        onCreated?.();
      } catch (e: any) {
        setError(e?.message ?? "Помилка створення");
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="rounded-xl">+ Новий проєкт</Button>
      </DialogTrigger>

      <DialogContent className="rounded-2xl">
        <DialogHeader>
          <DialogTitle>Новий проєкт</DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          <Input
            placeholder="Наприклад: Client A / Flowland / SEO"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") submit();
            }}
          />

          {error && <div className="text-sm text-destructive">{error}</div>}

          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              className="rounded-xl"
              onClick={() => setOpen(false)}
              disabled={isPending}
            >
              Скасувати
            </Button>
            <Button className="rounded-xl" onClick={submit} disabled={isPending}>
              {isPending ? "Створюю…" : "Створити"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
