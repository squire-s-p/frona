"use client";

import * as React from "react";
import Link from "next/link";
import { format } from "date-fns";
import { useRouter, useSearchParams } from "next/navigation";
import { ChevronsUpDown, Check, PencilIcon, Send, Trash2Icon as TrashIconLucide } from "lucide-react";
import { updateProject, setProjectClient } from "@/app/dashboard/projects/actions";

import {
  getProjectComments,
  addProjectComment,
  deleteProjectComment,
} from "@/app/dashboard/projects/comments-actions";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

import { TrashIcon } from "@/components/icons/trash";
import { Badge } from "@/components/ui/badge";
import { uk } from "date-fns/locale";

import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";

type ProjectStatus = "active" | "completed" | "archived";

type ProjectCommentRow = {
  id: string;
  body: string;
  createdAt: Date;
  user: { name: string | null; email: string | null; image: string | null } | null;
};

type ClientOption = {
  id: string;
  name: string;
};

export default function ProjectDetailsCard({
  projectId,
  status,
  initial,
  clients,
  initialClientId,
}: {
  projectId: string;
  status: ProjectStatus;
  initial: {
    name: string;
    description: string | null;
    source: string | null;

    // legacy
    clientName: string | null;

    site: string | null;
    cost: string | null;

    // legacy (залишаємо в БД/діях, але з UI прибираємо у view)
    clientContact: string | null;

    accesses: string | null;
    notes: string | null;
  };
  clients: ClientOption[];
  initialClientId: string | null;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isEditing = searchParams.get("edit") === "1";

  const [pending, startTransition] = React.useTransition();

  const readOnly = status === "completed" || status === "archived";
  const canComment = !readOnly;

  const [name, setName] = React.useState(initial.name);
  const [description, setDescription] = React.useState(initial.description ?? "");
  const [site, setSite] = React.useState(initial.site ?? "");
  const [cost, setCost] = React.useState(initial.cost ?? "");
  const [source, setSource] = React.useState(initial.source ?? "");

  // legacy (залишаємо тільки для сумісності, UI сховає у view)
  const [clientName, setClientName] = React.useState(initial.clientName ?? "");
  const [clientContact, setClientContact] = React.useState(initial.clientContact ?? "");

  const [accesses, setAccesses] = React.useState(initial.accesses ?? "");
  const [notes, setNotes] = React.useState(initial.notes ?? "");

  // ✅ project.clientId
  const [selectedClientId, setSelectedClientId] = React.useState<string | null>(initialClientId);
  const [clientPickerOpen, setClientPickerOpen] = React.useState(false);

  const selectedClient = React.useMemo(() => {
    if (!selectedClientId) return null;
    return clients.find((c) => c.id === selectedClientId) ?? null;
  }, [clients, selectedClientId]);

  const showLegacyClientFields = selectedClientId === null;

  // Comments
  const [comment, setComment] = React.useState("");
  const [comments, setComments] = React.useState<ProjectCommentRow[]>([]);
  const [commentsLoading, setCommentsLoading] = React.useState(false);

  React.useEffect(() => {
    setName(initial.name);
    setDescription(initial.description ?? "");
    setSite(initial.site ?? "");
    setCost(initial.cost ?? "");
    setSource(initial.source ?? "");
    setClientName(initial.clientName ?? "");
    setClientContact(initial.clientContact ?? "");
    setAccesses(initial.accesses ?? "");
    setNotes(initial.notes ?? "");
    setSelectedClientId(initialClientId);
  }, [initial, initialClientId]);

  React.useEffect(() => {
    if (!projectId) return;

    setCommentsLoading(true);
    startTransition(async () => {
      try {
        const rows = await getProjectComments(projectId);
        setComments(rows as unknown as ProjectCommentRow[]);
      } finally {
        setCommentsLoading(false);
      }
    });
  }, [projectId]);

  function exitEdit() {
    const sp = new URLSearchParams(searchParams.toString());
    sp.delete("edit");
    const next = sp.toString();
    router.replace(next ? `?${next}` : `?`);
  }

  function onCancel() {
    setName(initial.name);
    setDescription(initial.description ?? "");
    setSite(initial.site ?? "");
    setCost(initial.cost ?? "");
    setSource(initial.source ?? "");
    setClientName(initial.clientName ?? "");
    setClientContact(initial.clientContact ?? "");
    setAccesses(initial.accesses ?? "");
    setNotes(initial.notes ?? "");
    setSelectedClientId(initialClientId);
    exitEdit();
  }

  function onSave() {
    startTransition(async () => {
      await updateProject(projectId, {
        name,
        description: description.trim() ? description : null,
        site: site.trim() ? site : null,
        cost: cost.trim() ? cost : null,
        source: source.trim() ? source : null,

        // legacy (записуємо лише якщо "Без клієнта")
        clientName: showLegacyClientFields && clientName.trim() ? clientName : null,
        clientContact: showLegacyClientFields && clientContact.trim() ? clientContact : null,

        accesses: accesses.trim() ? accesses : null,
        notes: notes.trim() ? notes : null,
      });

      await setProjectClient(projectId, selectedClientId);

      exitEdit();
      router.refresh();
    });
  }

  async function onAddComment() {
    if (!canComment) return;
    const text = comment.trim();
    if (!text) return;

    startTransition(async () => {
      await addProjectComment(projectId, text);

      setComments((prev) => [
        ...prev,
        {
          id: `tmp-${Date.now()}`,
          body: text,
          createdAt: new Date(),
          user: { name: "You", email: null, image: null },
        },
      ]);

      setComment("");

      const rows = await getProjectComments(projectId);
      setComments(rows as unknown as ProjectCommentRow[]);
    });
  }

  async function onDeleteComment(commentId: string) {
    if (!canComment) return;
    if (commentId.startsWith("tmp-")) return;

    startTransition(async () => {
      await deleteProjectComment(commentId);
      setComments((prev) => prev.filter((c) => c.id !== commentId));
    });
  }

  const statusText =
    status === "completed" || status === "archived" ? "Завершено" : "Активний";

  // ✅ Якщо архівний — навіть якщо edit=1, показуємо view
  const showEditUI = isEditing && !readOnly;

  // ✅ у view показуємо лінк на клієнта (або "Без клієнта")
  const viewClientNode = selectedClient?.id ? (
    <Link
      href={`/dashboard/clients/${selectedClient.id}`}
      className="hover:underline underline-offset-4"
    >
      {selectedClient.name}
    </Link>
  ) : (
    <span className="text-muted-foreground">Без клієнта</span>
  );

  return (
    <Card className="rounded-2xl overflow-hidden p-0">
      {/* Unified section header */}
      <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-border/50">
        <h2 className="text-base font-bold tracking-tight text-foreground">Деталі</h2>

        {showEditUI ? (
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
            <Button size="sm" className="rounded-xl h-8 px-3 text-[11px] font-bold" onClick={onSave} disabled={pending || !name.trim()}>
              {pending ? "..." : "Зберегти"}
            </Button>
          </div>
        ) : !readOnly ? (
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 rounded-lg hover:bg-primary/10 hover:text-primary transition-all shadow-none"
            onClick={() => {
              const sp = new URLSearchParams(searchParams.toString());
              sp.set("edit", "1");
              router.push(`?${sp.toString()}`);
            }}
          >
            <PencilIcon className="h-3.5 w-3.5" />
          </Button>
        ) : null}
      </div>

      {/* VIEW MODE */}
      {!showEditUI ? (
        <div className="p-5 space-y-6">
          {/* Core Info Grid */}
          <div className="grid gap-3 grid-cols-2">
             <InfoRow label="Статус" value={statusText} />
             <InfoRow label="Джерело" value={initial.source} />
             <InfoRowCustom label="Клієнт">{viewClientNode}</InfoRowCustom>
             <InfoRow label="Вартість" value={initial.cost ? `${initial.cost} ₴` : null} />
          </div>

          {initial.site && (
            <InfoRowCustom label="Веб-сайт">
              <a href={initial.site.startsWith('http') ? initial.site : `https://${initial.site}`} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline truncate block">
                {initial.site}
              </a>
            </InfoRowCustom>
          )}

          {initial.description && (
            <div className="space-y-2">
              <Label className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Опис проєкту</Label>
              <div className="text-sm leading-relaxed text-foreground/80 bg-muted/20 rounded-xl p-3 border border-border/40">
                {initial.description}
              </div>
            </div>
          )}

          {(initial.accesses || initial.notes) && (
            <div className="space-y-4 pt-2 border-t border-border/50">
              {initial.accesses && (
                <div className="space-y-1.5">
                  <Label className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Доступи</Label>
                  <pre className="text-xs font-mono bg-muted/30 p-3 rounded-xl border border-border/40 overflow-x-auto scrollbar-hide">
                    {initial.accesses}
                  </pre>
                </div>
              )}
              {initial.notes && (
                <div className="space-y-1.5">
                  <Label className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Нотатки</Label>
                  <div className="text-sm text-foreground/70 italic bg-muted/10 p-3 rounded-xl border border-border/40">
                    {initial.notes}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ✅ COMMENTS Section */}
          <div className="pt-4 border-t border-border/50">
            <div className="flex items-center justify-between mb-4">
              <Label className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Коментарі</Label>
              <Badge variant="secondary" className="px-1.5 py-0 h-4 text-[9px]">{comments.length}</Badge>
            </div>

            {!canComment ? (
              <div className="text-[11px] text-muted-foreground italic">
                Завершений проєкт — коментарі вимкнено.
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex gap-2">
                  <Input
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="Ваш коментар…"
                    className="h-9 rounded-xl text-xs bg-muted/20 border-border/50 focus:bg-background transition-all"
                    disabled={pending}
                    onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && onAddComment()}
                  />
                  <Button 
                    size="sm" 
                    className="h-9 w-9 rounded-xl p-0 flex items-center justify-center shrink-0"
                    onClick={onAddComment} 
                    disabled={pending || !comment.trim()}
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>

                <div className="space-y-3 max-h-[400px] overflow-y-auto scrollbar-hide pr-1">
                  {commentsLoading ? (
                    <div className="text-[11px] text-muted-foreground animate-pulse">Завантаження...</div>
                  ) : comments.length === 0 ? (
                    <div className="text-[11px] text-muted-foreground text-center py-4">Поки що немає коментарів</div>
                  ) : (
                    comments.map((c) => {
                      const author = c.user?.name || c.user?.email || "Unknown";
                      const dt = c.createdAt
                        ? format(new Date(c.createdAt), "d MMM, HH:mm", { locale: uk })
                        : "";
                      const isTemp = c.id.startsWith("tmp-");

                      return (
                        <div key={c.id} className="group relative rounded-xl border border-border/40 bg-muted/5 p-3 hover:bg-muted/10 transition-colors">
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-[11px] font-bold text-primary/80">{author}</span>
                                <span className="text-[10px] text-muted-foreground">{dt}</span>
                              </div>
                              <div className="text-xs leading-normal text-foreground/90 whitespace-pre-wrap">{c.body}</div>
                            </div>

                            {!isTemp && (
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-all"
                                onClick={() => onDeleteComment(c.id)}
                                disabled={pending}
                              >
                                <TrashIcon className="h-3 w-3" />
                              </Button>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* EDIT MODE */
        <div className="p-5 grid gap-4">
          <div className="grid gap-2">
            <Label>Назва *</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} disabled={pending} />
          </div>

          <div className="grid gap-2">
            <Label>Опис</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={pending}
            />
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label>Сайт</Label>
              <Input value={site} onChange={(e) => setSite(e.target.value)} disabled={pending} />
            </div>
            <div className="grid gap-2">
              <Label>Вартість</Label>
              <Input
                value={cost}
                onChange={(e) => setCost(e.target.value)}
                disabled={pending}
                placeholder="Напр. 500 або 1200.50"
              />
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label>Джерело</Label>
              <Input
                value={source}
                onChange={(e) => setSource(e.target.value)}
                disabled={pending}
                placeholder="Upwork / Freelancehunt / ..."
              />
            </div>

            <div className="grid gap-2">
              <Label>Клієнт</Label>

              <Popover open={clientPickerOpen} onOpenChange={setClientPickerOpen}>
                <PopoverTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    className="h-10 w-full justify-between rounded-xl"
                    disabled={pending}
                  >
                    <span className={cn("truncate", !selectedClient && "text-muted-foreground")}>
                      {selectedClient ? selectedClient.name : "Без клієнта"}
                    </span>
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>

                <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                  <Command>
                    <CommandInput placeholder="Знайти клієнта..." />
                    <CommandList>
                      <CommandEmpty>Нічого не знайдено</CommandEmpty>

                      <CommandGroup>
                        <CommandItem
                          value="none"
                          onSelect={() => {
                            setSelectedClientId(null);
                            setClientPickerOpen(false);
                          }}
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              selectedClientId === null ? "opacity-100" : "opacity-0"
                            )}
                          />
                          Без клієнта
                        </CommandItem>

                        {clients.map((c) => (
                          <CommandItem
                            key={c.id}
                            value={c.name}
                            onSelect={() => {
                              setSelectedClientId(c.id);
                              setClientPickerOpen(false);
                            }}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                selectedClientId === c.id ? "opacity-100" : "opacity-0"
                              )}
                            />
                            <span className="truncate">{c.name}</span>
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {/* ✅ legacy поля тепер видно тільки якщо обрано "Без клієнта" */}
          {showLegacyClientFields ? (
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label>Клієнт (legacy)</Label>
                <Input
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  disabled={pending}
                  placeholder="Імʼя/компанія"
                />
              </div>
              <div className="grid gap-2">
                <Label>Контакт клієнта (legacy)</Label>
                <Input
                  value={clientContact}
                  onChange={(e) => setClientContact(e.target.value)}
                  disabled={pending}
                  placeholder="Telegram / Email / телефон"
                />
              </div>
            </div>
          ) : null}

          <div className="grid gap-2">
            <Label>Доступи</Label>
            <Input
              value={accesses}
              onChange={(e) => setAccesses(e.target.value)}
              disabled={pending}
            />
          </div>

          <div className="grid gap-2">
            <Label>Нотатки</Label>
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} disabled={pending} />
          </div>

          <div className="grid gap-2">
            <Label>Коментарі</Label>
            <div className="text-sm text-muted-foreground">
              Коментарі доступні в режимі перегляду (не залежать від редагування деталей).
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}

function InfoRow({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="rounded-xl border bg-card p-3">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className={cn("mt-1 text-sm", !value?.trim() && "text-muted-foreground")}>
        {value?.trim() ? value : "—"}
      </div>
    </div>
  );
}

function InfoRowCustom({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border bg-card p-3">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="mt-1 text-sm">{children}</div>
    </div>
  );
}
