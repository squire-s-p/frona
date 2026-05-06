"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { format } from "date-fns";
import { uk } from "date-fns/locale";
import { 
  PencilIcon, 
  Trash2, 
  Loader2, 
  Mail, 
  MapPin, 
  Fingerprint, 
  Calendar,
} from "lucide-react";

import { updateClient, deleteClient } from "@/app/dashboard/clients/actions";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

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

export default function ClientDetailsCard({ client }: { client: ClientDTO }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isEditing = searchParams.get("edit") === "1";

  const [pending, startTransition] = React.useTransition();

  const [name, setName] = React.useState(client.name);
  const [taxId, setTaxId] = React.useState(client.taxId);
  const [email, setEmail] = React.useState(client.email);
  const [address, setAddress] = React.useState(client.address);
  const [contactInfo, setContactInfo] = React.useState(client.contactInfo);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    setName(client.name);
    setTaxId(client.taxId);
    setEmail(client.email);
    setAddress(client.address);
    setContactInfo(client.contactInfo);
  }, [client]);

  function exitEdit() {
    const sp = new URLSearchParams(searchParams.toString());
    sp.delete("edit");
    router.replace(`?${sp.toString()}`);
  }

  function onCancel() {
    setError(null);
    setName(client.name);
    setTaxId(client.taxId);
    setEmail(client.email);
    setAddress(client.address);
    setContactInfo(client.contactInfo);
    exitEdit();
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
        exitEdit();
        router.refresh();
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : "Помилка збереження");
      }
    });
  }

  function onDelete() {
    if (!window.confirm("Видалити клієнта? Це відв'яже всі його проєкти.")) return;

    startTransition(async () => {
      try {
        await deleteClient({ clientId: client.id });
        router.push("/dashboard/clients");
        router.refresh();
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : "Помилка видалення");
      }
    });
  }

  return (
    <Card className="h-full flex flex-col rounded-2xl p-0 shadow-none bg-neutral-100 dark:bg-neutral-900 border border-border/50">
      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-border/50">
        <h2 className="text-base font-bold tracking-tight text-foreground">Деталі клієнта</h2>

        {isEditing ? (
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="rounded-xl h-8 px-3 text-[11px] font-bold"
              onClick={onCancel}
              disabled={pending}
            >
              Скасувати
            </Button>
            <Button 
              size="sm" 
              className="rounded-xl h-8 px-3 text-[11px] font-bold" 
              onClick={onSave} 
              disabled={pending || !name.trim()}
            >
              {pending ? <Loader2 className="h-3 w-3 animate-spin" /> : "Зберегти"}
            </Button>
          </div>
        ) : (
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-lg hover:bg-primary/10 hover:text-primary transition-all"
              onClick={() => {
                const sp = new URLSearchParams(searchParams.toString());
                sp.set("edit", "1");
                router.push(`?${sp.toString()}`);
              }}
            >
              <PencilIcon className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-lg hover:bg-destructive/10 hover:text-destructive transition-all"
              onClick={onDelete}
              disabled={pending}
            >
              {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
            </Button>
          </div>
        )}
      </div>

      <div className="p-5 flex-1 flex flex-col">
        {!isEditing ? (
          /* VIEW MODE */
          <div className="space-y-6 flex-1 flex flex-col">
            <div className="grid gap-3 grid-cols-1 sm:grid-cols-2">
               <InfoRow 
                  label="ЄДРПОУ / ІПН" 
                  value={client.taxId} 
                  icon={<Fingerprint className="h-3 w-3" />} 
               />
               <InfoRow 
                  label="Email" 
                  value={client.email} 
                  icon={<Mail className="h-3 w-3" />} 
               />
               <InfoRow 
                  label="Дата створення" 
                  value={format(new Date(client.createdAt), "d MMMM yyyy", { locale: uk })}
                  icon={<Calendar className="h-3 w-3" />}
               />
               <InfoRow 
                  label="Останнє оновлення" 
                  value={format(new Date(client.updatedAt), "d MMMM yyyy", { locale: uk })}
                  icon={<Calendar className="h-3 w-3" />}
               />
            </div>

            <InfoRow 
                label="Адреса" 
                value={client.address} 
                icon={<MapPin className="h-3 w-3" />} 
            />

            {client.contactInfo && (
              <div className="space-y-2">
                <Label className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Контактна інформація / Нотатки</Label>
                <div className="text-sm leading-relaxed text-foreground/80 bg-muted/20 rounded-xl p-4 border border-border/40 whitespace-pre-wrap">
                  {client.contactInfo}
                </div>
              </div>
            )}
          </div>
        ) : (
          /* EDIT MODE */
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label>Назва / Ім&apos;я *</Label>
              <Input 
                value={name} 
                onChange={(e) => setName(e.target.value)} 
                disabled={pending}
                className="h-10 rounded-xl"
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label>ЄДРПОУ або ІПН</Label>
                <Input 
                  value={taxId} 
                  onChange={(e) => setTaxId(e.target.value)} 
                  disabled={pending}
                  className="h-10 rounded-xl"
                />
              </div>

              <div className="grid gap-2">
                <Label>Електронна пошта</Label>
                <Input 
                  value={email} 
                  onChange={(e) => setEmail(e.target.value)} 
                  disabled={pending}
                  className="h-10 rounded-xl"
                />
              </div>
            </div>

            <div className="grid gap-2">
              <Label>Адреса</Label>
              <Input 
                value={address} 
                onChange={(e) => setAddress(e.target.value)} 
                disabled={pending}
                className="h-10 rounded-xl"
              />
            </div>

            <div className="grid gap-2">
              <Label>Контактні дані та нотатки</Label>
              <Textarea
                value={contactInfo}
                onChange={(e) => setContactInfo(e.target.value)}
                disabled={pending}
                className="min-h-[140px] rounded-xl resize-none"
              />
            </div>

            {error && (
              <div className="rounded-xl border border-destructive/40 bg-destructive/10 p-3 text-xs font-bold text-destructive">
                {error}
              </div>
            )}
          </div>
        )}
      </div>
    </Card>
  );
}

function InfoRow({ label, value, icon }: { label: string; value?: string | null; icon?: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-border/40 bg-neutral-200/50 dark:bg-neutral-800 p-4">
      <div className="flex items-center gap-2 mb-1">
        <span className="text-primary/40">{icon}</span>
        <div className="text-[10px] uppercase font-bold text-muted-foreground/60 tracking-wider">{label}</div>
      </div>
      <div className={cn("text-sm font-medium", !value?.trim() && "text-muted-foreground italic")}>
        {value?.trim() ? value : "Не вказано"}
      </div>
    </div>
  );
}
