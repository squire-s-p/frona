"use client";

import * as React from "react";
import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, ChevronsUpDown } from "lucide-react";

import { createProject } from "@/app/dashboard/projects/actions";
import NewClientDialog from "@/components/clients/new-client-dialog";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";

type ClientOption = { id: string; name: string };

type Props = {
  onCreated?: () => void;
  trigger?: React.ReactNode;
  clients?: ClientOption[]; // ✅ список клієнтів з сервера
  defaultClientId?: string | null; // ✅ preselect (наприклад зі сторінки клієнта)
};

function uniqClients(list: ClientOption[]) {
  const map = new Map<string, ClientOption>();
  for (const c of list) {
    if (!c?.id) continue;
    map.set(c.id, c);
  }
  return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name, "uk"));
}

export default function ProjectCreateDialog({
  onCreated,
  trigger,
  clients = [],
  defaultClientId = null,
}: Props) {
  const router = useRouter();

  const [open, setOpen] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const [name, setName] = React.useState("");
  const [source, setSource] = React.useState("");
  const [site, setSite] = React.useState("");
  const [cost, setCost] = React.useState("");
  const [accesses, setAccesses] = React.useState("");
  const [notes, setNotes] = React.useState("");

  // ✅ локальні додані клієнти (створені з модалки)
  const [extraClients, setExtraClients] = React.useState<ClientOption[]>([]);

  // ✅ ВАЖЛИВО: НЕ синхронізуємо стейт з props через useEffect (це і було loop)
  const allClients = React.useMemo(() => {
    return uniqClients([...(clients ?? []), ...extraClients]);
  }, [clients, extraClients]);

  const [clientId, setClientId] = React.useState<string | null>(defaultClientId);
  const [clientOpen, setClientOpen] = React.useState(false);

  // ✅ Коли відкрили діалог — підставляємо defaultClientId (якщо він є)
  // Це не "sync props -> state" на кожен рендер, а одноразова ініціалізація на open.
  React.useEffect(() => {
    if (!open) return;
    if (defaultClientId) setClientId(defaultClientId);
    if (defaultClientId === null) setClientId(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const selectedClient = React.useMemo(() => {
    if (!clientId) return null;
    return allClients.find((c) => c.id === clientId) ?? null;
  }, [allClients, clientId]);

  const [newClientOpen, setNewClientOpen] = React.useState(false);

  function reset() {
    setName("");
    setSource("");
    setSite("");
    setCost("");
    setAccesses("");
    setNotes("");
    setClientId(defaultClientId ?? null);
    setError(null);
    // extraClients не чіпаємо — хай живе до перезавантаження сторінки
  }

  function submit() {
    setError(null);

    startTransition(async () => {
      try {
        const created = await createProject({
          name,
          source: source.trim() ? source : null,
          site: site.trim() ? site : null,
          cost: cost.trim() ? cost : null,
          accesses: accesses.trim() ? accesses : null,
          notes: notes.trim() ? notes : null,
          clientId,
        });

        setOpen(false);
        onCreated?.();
        reset();
        router.push(`/dashboard/projects/${created.id}`);
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : "Помилка створення");
      }
    });
  }

  const canSubmit = name.trim().length > 0 && name.trim().length <= 60;

  return (
    <>
      <Dialog
        open={open}
        onOpenChange={(v) => {
          setOpen(v);
          if (!v) setError(null);
        }}
      >
        <DialogTrigger asChild>
          {trigger ? trigger : <Button className="rounded-lg">+ Новий проєкт</Button>}
        </DialogTrigger>

        <DialogContent className="rounded-2xl sm:max-w-xl p-0 flex flex-col max-h-[95vh] sm:max-h-[90vh] overflow-hidden border-none shadow-2xl">
          <DialogHeader className="p-6 pb-2">
            <DialogTitle className="text-xl font-bold">Новий проєкт</DialogTitle>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto px-6 py-2 custom-scrollbar min-h-0">
            <div className="grid gap-5 pb-4">
              {/* Назва */}
              <div className="grid gap-2">
                <Label htmlFor="p-name">Назва *</Label>
                <Input
                  id="p-name"
                  className="rounded-lg bg-neutral-100 dark:bg-input/30"
                  placeholder="Наприклад: Client A / Flowland / SEO"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && submit()}
                />
              </div>

              {/* 2 колонки */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="hidden sm:grid gap-2">
                  <Label htmlFor="p-source">Джерело</Label>
                  <Input
                    id="p-source"
                    className="rounded-lg bg-neutral-100 dark:bg-input/30"
                    placeholder="Upwork / Freelancehunt / рекомендація…"
                    value={source}
                    onChange={(e) => setSource(e.target.value)}
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="p-cost">Вартість</Label>
                  <Input
                    id="p-cost"
                    className="rounded-lg bg-neutral-100 dark:bg-input/30"
                    placeholder="12480 або 12480.50"
                    inputMode="decimal"
                    value={cost}
                    onChange={(e) => setCost(e.target.value)}
                  />
                </div>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="p-site">Сайт</Label>
                <Input
                  id="p-site"
                  className="rounded-lg bg-neutral-100 dark:bg-input/30"
                  placeholder="https://..."
                  value={site}
                  onChange={(e) => setSite(e.target.value)}
                />
              </div>

              {/* ✅ Client dropdown + create */}
              <div className="grid gap-2">
                <Label>Клієнт</Label>

                <Popover open={clientOpen} onOpenChange={setClientOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      type="button"
                      variant="outline"
                      className="h-10 w-full justify-between rounded-lg bg-neutral-100 dark:bg-input/30"
                      disabled={isPending}
                    >
                      <span className={cn("truncate", !selectedClient && "text-muted-foreground")}>
                        {selectedClient ? selectedClient.name : "Без клієнта"}
                      </span>
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>

                  <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                    <Command>
                      <CommandInput placeholder="Знайти або створити..." />
                      <CommandList>
                        <CommandEmpty>Нічого не знайдено</CommandEmpty>

                        <CommandGroup>
                          <CommandItem
                            value="none"
                            onSelect={() => {
                              setClientId(null);
                              setClientOpen(false);
                            }}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                clientId === null ? "opacity-100" : "opacity-0"
                              )}
                            />
                            Без клієнта
                          </CommandItem>

                          {allClients.map((c) => (
                            <CommandItem
                              key={c.id}
                              value={c.name}
                              onSelect={() => {
                                setClientId(c.id);
                                setClientOpen(false);
                              }}
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4",
                                  clientId === c.id ? "opacity-100" : "opacity-0"
                                )}
                              />
                              <span className="truncate">{c.name}</span>
                            </CommandItem>
                          ))}
                        </CommandGroup>

                        <CommandSeparator />

                        <CommandGroup>
                          <CommandItem
                            value="create-client"
                            onSelect={() => {
                              setClientOpen(false);
                              setNewClientOpen(true);
                            }}
                          >
                            + Створити клієнта
                          </CommandItem>
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>

              <div className="hidden sm:grid gap-2">
                <Label htmlFor="p-accesses">Доступи</Label>
                <Textarea
                  id="p-accesses"
                  placeholder="Логіни, посилання на доступи, нотатки по 2FA…"
                  className="min-h-[90px] rounded-lg bg-neutral-100 dark:bg-input/30"
                  value={accesses}
                  onChange={(e) => setAccesses(e.target.value)}
                />
              </div>

              <div className="hidden sm:grid gap-2">
                <Label htmlFor="p-notes">Нотатки</Label>
                <Textarea
                  id="p-notes"
                  placeholder="Будь-які деталі по проєкту…"
                  className="min-h-[110px] rounded-lg bg-neutral-100 dark:bg-input/30"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>

              {error && <div className="text-sm text-destructive">{error}</div>}
            </div>
          </div>

          <div className="p-6 pt-2 flex justify-end gap-3 border-t border-border/50 bg-muted/5">
            <Button
              variant="outline"
              size="lg"
              className="flex-1 sm:flex-none bg-neutral-100 dark:bg-transparent"
              onClick={() => {
                setOpen(false);
                setError(null);
              }}
              disabled={isPending}
            >
              Скасувати
            </Button>

            <Button 
              variant="default"
              size="lg"
              className="flex-1 sm:flex-none" 
              onClick={submit} 
              disabled={isPending || !canSubmit}
            >
              {isPending ? "Створюю…" : "Створити проєкт"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ✅ embedded create client */}
      <NewClientDialog
        open={newClientOpen}
        onOpenChange={setNewClientOpen}
        projects={[]}
        mode="quick"
        onCreated={(c) => {
          setExtraClients((prev) => uniqClients([...prev, { id: c.id, name: c.name }]));
          setClientId(c.id);
        }}
      />
    </>
  );
}
