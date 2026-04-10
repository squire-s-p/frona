"use client";

import { useMemo, useState, useTransition } from "react";
import { Loader2 } from "lucide-react";

import { createClient } from "@/app/dashboard/clients/actions";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";

import ProjectMultiSelect from "@/components/clients/project-multiselect";

type ProjectOption = {
  id: string;
  name: string;
  clientId: string | null;
  status: string;
};

type CreatedClient = { id: string; name: string };

export default function NewClientDialog({
  open,
  onOpenChange,
  projects,
  mode = "full",
  onCreated,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  projects: ProjectOption[];
  mode?: "full" | "quick";
  onCreated?: (client: CreatedClient) => void;
}) {
  const [isPending, startTransition] = useTransition();

  const [name, setName] = useState("");
  const [taxId, setTaxId] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [contactInfo, setContactInfo] = useState("");
  const [projectIds, setProjectIds] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  const projectOptions = useMemo(() => {
    return projects.slice().sort((a, b) => a.name.localeCompare(b.name, "uk"));
  }, [projects]);

  function reset() {
    setName("");
    setTaxId("");
    setEmail("");
    setAddress("");
    setContactInfo("");
    setProjectIds([]);
    setError(null);
  }

  function onClose(nextOpen: boolean) {
    if (!nextOpen) reset();
    onOpenChange(nextOpen);
  }

  function onSubmit() {
    setError(null);

    startTransition(async () => {
      try {
        const result = await createClient({
          name,
          taxId,
          email,
          address,
          contactInfo,
          projectIds: mode === "quick" ? [] : projectIds,
        });

        // ✅ очікуємо, що createClient повертає створеного клієнта {id, name}
        const created = result as unknown as CreatedClient | undefined;
        if (created?.id && created?.name) onCreated?.(created);

        onClose(false);
      } catch (e: any) {
        setError(e?.message ?? "Помилка створення клієнта");
      }
    });
  }

  const canSubmit = name.trim().length > 0 && !isPending;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[640px]">
        <DialogHeader>
          <DialogTitle>Новий клієнт</DialogTitle>
        </DialogHeader>

        <div className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="client-name">Назва / Ім'я *</Label>
            <Input
              id="client-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Наприклад: test / Іван Петренко"
              autoFocus
            />
          </div>

          <div className="grid gap-2 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="taxId">ЄДРПОУ або ІПН</Label>
              <Input
                id="taxId"
                value={taxId}
                onChange={(e) => setTaxId(e.target.value)}
                placeholder="12345678"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="email">Електронна пошта</Label>
              <Input
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="mail@example.com"
              />
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="address">Адреса</Label>
            <Input
              id="address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Місто, вулиця, будинок"
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="contactInfo">Контактні дані</Label>
            <Textarea
              id="contactInfo"
              value={contactInfo}
              onChange={(e) => setContactInfo(e.target.value)}
              placeholder="Телефон, Telegram, відповідальна особа, посилання..."
              className="min-h-[96px]"
            />
          </div>

          {/* ✅ в quick-режимі проєкти не показуємо */}
          {mode === "full" ? (
            <>
              <Separator />

              <div className="grid gap-2">
                <Label>Проєкти</Label>
                <ProjectMultiSelect
                  projects={projectOptions}
                  value={projectIds}
                  onChange={setProjectIds}
                />
                <p className="text-xs text-muted-foreground">
                  Можна вибрати кілька. Обрані проєкти отримають цього клієнта.
                </p>
              </div>
            </>
          ) : null}

          {error ? (
            <div className="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm">
              {error}
            </div>
          ) : null}

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" onClick={() => onClose(false)} disabled={isPending}>
              Скасувати
            </Button>
            <Button onClick={onSubmit} disabled={!canSubmit}>
              {isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Створення...
                </>
              ) : (
                "Створити"
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
