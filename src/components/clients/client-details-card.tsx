"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Pencil, Save, Trash2 } from "lucide-react";

import { updateClient, deleteClient } from "@/app/dashboard/clients/actions";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";

type ClientDTO = {
  id: string;
  name: string;
  taxId: string;
  email: string;
  address: string;
  contactInfo: string;
  createdAt: Date;
  updatedAt: Date;
};

function formatDate(d: Date) {
  try {
    return new Intl.DateTimeFormat("uk-UA", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(new Date(d));
  } catch {
    return "";
  }
}

export default function ClientDetailsCard({ client }: { client: ClientDTO }) {
  const router = useRouter();

  const [isPending, startTransition] = useTransition();
  const [editing, setEditing] = useState(false);

  const [name, setName] = useState(client.name);
  const [taxId, setTaxId] = useState(client.taxId);
  const [email, setEmail] = useState(client.email);
  const [address, setAddress] = useState(client.address);
  const [contactInfo, setContactInfo] = useState(client.contactInfo);
  const [error, setError] = useState<string | null>(null);

  // keep in sync after revalidate/navigation
  useEffect(() => {
    setName(client.name);
    setTaxId(client.taxId);
    setEmail(client.email);
    setAddress(client.address);
    setContactInfo(client.contactInfo);
  }, [client.id, client.name, client.taxId, client.email, client.address, client.contactInfo]);

  const canSave = useMemo(() => {
    if (isPending) return false;
    return name.trim().length > 0;
  }, [isPending, name]);

  function onCancel() {
    setError(null);
    setName(client.name);
    setTaxId(client.taxId);
    setEmail(client.email);
    setAddress(client.address);
    setContactInfo(client.contactInfo);
    setEditing(false);
  }

  function onSave() {
    setError(null);

    startTransition(async () => {
      try {
        await updateClient({
          clientId: client.id,
          name,
          taxId,
          email,
          address,
          contactInfo,
        });
        setEditing(false);
      } catch (e: any) {
        setError(e?.message ?? "Помилка збереження");
      }
    });
  }

  function onDelete() {
    setError(null);

    const ok = window.confirm(
      "Видалити клієнта?\n\nУсі проєкти цього клієнта будуть відвʼязані (clientId стане порожнім)."
    );
    if (!ok) return;

    startTransition(async () => {
      try {
        await deleteClient({ clientId: client.id });
        router.push("/dashboard/clients");
        router.refresh();
      } catch (e: any) {
        setError(e?.message ?? "Помилка видалення");
      }
    });
  }

  return (
    <Card className="rounded-2xl border bg-card shadow-sm overflow-hidden p-0">
      {/* Unified section header */}
      <div className="flex items-center justify-between px-4 pt-4 pb-3 border-b border-border/50">
        <h2 className="text-base font-bold tracking-tight text-foreground">Деталі клієнта</h2>

        {!editing ? (
          <div className="flex gap-2">
            <Button 
                variant="outline" 
                size="icon" 
                className="h-9 w-9 rounded-lg border-border/40 hover:bg-muted" 
                onClick={() => setEditing(true)}
                title="Редагувати"
            >
              <Pencil className="h-4 w-4" />
            </Button>

            <Button
              variant="outline"
              size="icon"
              className="h-9 w-9 rounded-lg border-border/40 text-destructive hover:bg-destructive/10 hover:text-destructive hover:border-destructive/20"
              onClick={onDelete}
              disabled={isPending}
              title="Видалити клієнта"
            >
              {isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4" />
              )}
            </Button>
          </div>
        ) : (
          <div className="flex gap-2">
            <Button
                variant="ghost"
                size="sm"
                className="h-9 rounded-lg px-3 text-xs font-bold"
                onClick={onCancel}
                disabled={isPending}
            >
                Скасувати
            </Button>
            <Button 
                size="sm" 
                className="h-9 rounded-lg px-4 text-xs font-bold shadow-sm" 
                onClick={onSave} 
                disabled={!canSave}
            >
              {isPending ? (
                <Loader2 className="h-3 w-3 animate-spin mr-2" />
              ) : (
                <Save className="h-3 w-3 mr-2" />
              )}
              Зберегти
            </Button>
          </div>
        )}
      </div>

      <div className="p-4">
        <div className="mb-6 flex items-center gap-2 text-[10px] uppercase font-bold text-muted-foreground/50 tracking-wider">
            <span>Створено: {formatDate(client.createdAt)}</span>
            <span className="h-1 w-1 rounded-full bg-muted-foreground/30" />
            <span>Оновлено: {formatDate(client.updatedAt)}</span>
        </div>

      <div className="grid gap-4">
        <div className="grid gap-2">
          <Label>Назва / Ім'я *</Label>
          <Input value={name} onChange={(e) => setName(e.target.value)} disabled={!editing} />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="grid gap-2">
            <Label>ЄДРПОУ або ІПН</Label>
            <Input value={taxId} onChange={(e) => setTaxId(e.target.value)} disabled={!editing} />
          </div>

          <div className="grid gap-2">
            <Label>Електронна пошта</Label>
            <Input value={email} onChange={(e) => setEmail(e.target.value)} disabled={!editing} />
          </div>
        </div>

        <div className="grid gap-2">
          <Label>Адреса</Label>
          <Input value={address} onChange={(e) => setAddress(e.target.value)} disabled={!editing} />
        </div>

        <div className="grid gap-2">
          <Label>Контактні дані</Label>
          <Textarea
            value={contactInfo}
            onChange={(e) => setContactInfo(e.target.value)}
            disabled={!editing}
            className="min-h-[120px]"
          />
        </div>

        {error ? (
          <div className="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm">
            {error}
          </div>
        ) : null}
      </div>
      </div>
    </Card>
  );
}
