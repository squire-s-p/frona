"use client";

import * as React from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";

type CreatePayload = {
  name: string;
  source?: string;
  website?: string;
  price?: string; // у формі як string, на бекенді конвертнеш в Decimal
  access?: string;
  clientContact?: string;
  notes?: string;
};

export function CreateProjectDialog() {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [loading, setLoading] = React.useState(false);

  const [form, setForm] = React.useState<CreatePayload>({
    name: "",
    source: "",
    website: "",
    price: "",
    access: "",
    clientContact: "",
    notes: "",
  });

  function set<K extends keyof CreatePayload>(key: K, val: CreatePayload[K]) {
    setForm((p) => ({ ...p, [key]: val }));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) return;

    setLoading(true);
    try {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          name: form.name.trim(),
          website: form.website?.trim() || null,
          source: form.source?.trim() || null,
          access: form.access?.trim() || null,
          clientContact: form.clientContact?.trim() || null,
          notes: form.notes?.trim() || null,
          price: form.price?.trim() || null,
        }),
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || "Не вдалося створити проект");
      }

      setOpen(false);
      setForm({
        name: "",
        source: "",
        website: "",
        price: "",
        access: "",
        clientContact: "",
        notes: "",
      });

      router.refresh(); // оновити список
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="rounded-xl">+ Новий проект</Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Новий проект</DialogTitle>
        </DialogHeader>

        <form onSubmit={onSubmit} className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="name">Назва *</Label>
            <Input
              id="name"
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
              placeholder="Наприклад: Client A / Flowland / SEO"
              required
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="source">Джерело</Label>
            <Input
              id="source"
              value={form.source}
              onChange={(e) => set("source", e.target.value)}
              placeholder="Freelancehunt / рекомендація / Upwork / інше"
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="website">Сайт</Label>
            <Input
              id="website"
              value={form.website}
              onChange={(e) => set("website", e.target.value)}
              placeholder="https://..."
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="price">Вартість</Label>
            <Input
              id="price"
              value={form.price}
              onChange={(e) => set("price", e.target.value)}
              placeholder="Наприклад: 5000"
              inputMode="decimal"
            />
            <p className="text-xs text-muted-foreground">
              Пізніше додамо валюту/формат (UAH/USD).
            </p>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="access">Доступи</Label>
            <Textarea
              id="access"
              value={form.access}
              onChange={(e) => set("access", e.target.value)}
              placeholder="Webflow / GA4 / Ads / хости / паролі (як тобі зручно)"
              rows={3}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="clientContact">Контакт клієнта</Label>
            <Input
              id="clientContact"
              value={form.clientContact}
              onChange={(e) => set("clientContact", e.target.value)}
              placeholder="Telegram / Email / Phone"
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="notes">Нотатки</Label>
            <Textarea
              id="notes"
              value={form.notes}
              onChange={(e) => set("notes", e.target.value)}
              placeholder="Будь-які деталі по проекту"
              rows={4}
            />
          </div>

          <DialogFooter className="gap-2">
            <Button type="button" variant="secondary" onClick={() => setOpen(false)}>
              Скасувати
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Створення..." : "Створити"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
