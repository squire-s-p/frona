"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { Loader2, Save } from "lucide-react";

import { setClientProjects } from "@/app/dashboard/clients/actions";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

import ProjectMultiSelect from "@/components/clients/project-multiselect";

type ProjectOption = {
  id: string;
  name: string;
  clientId: string | null;
  status: string;
};

export default function ClientProjectsPicker({
  clientId,
  allProjects,
  selectedProjectIds,
}: {
  clientId: string;
  allProjects: ProjectOption[];
  selectedProjectIds: string[];
}) {
  const [isPending, startTransition] = useTransition();
  const [value, setValue] = useState<string[]>(selectedProjectIds);
  const [savedSnapshot, setSavedSnapshot] = useState<string[]>(selectedProjectIds);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setValue(selectedProjectIds);
    setSavedSnapshot(selectedProjectIds);
  }, [clientId, selectedProjectIds.join("|")]);

  const options = useMemo(() => {
    return (
      allProjects
        .filter((p) => p.status !== "archived")
        .slice()
        .sort((a, b) => a.name.localeCompare(b.name, "uk"))
    );
  }, [allProjects]);

  const dirty = useMemo(() => {
    if (value.length !== savedSnapshot.length) return true;
    const a = new Set(value);
    for (const id of savedSnapshot) if (!a.has(id)) return true;
    return false;
  }, [value, savedSnapshot]);

  function onSave() {
    setError(null);
    startTransition(async () => {
      try {
        await setClientProjects({ clientId, projectIds: value });
        setSavedSnapshot(value);
      } catch (e: any) {
        setError(e?.message ?? "Помилка збереження");
      }
    });
  }

  return (
    <Card className="rounded-2xl border bg-neutral-100 dark:bg-neutral-900 shadow-none flex flex-col flex-1 overflow-hidden p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h2 className="text-base font-bold tracking-tight text-foreground leading-none">Проєкти клієнта</h2>
          <p className="text-[10px] uppercase font-bold text-muted-foreground/40 tracking-wider">Привʼяжіть існуючі проєкти</p>
        </div>

        <Button 
            size="sm" 
            className="rounded-xl h-8 px-3 text-[11px] font-bold shadow-none gap-1.5 transition-all active:scale-95 disabled:opacity-30" 
            onClick={onSave} 
            disabled={!dirty || isPending}
        >
          {isPending ? (
            <Loader2 className="h-3 w-3 animate-spin" />
          ) : (
            <Save className="h-3 w-3" />
          )}
          Зберегти
        </Button>
      </div>

      <ProjectMultiSelect projects={options} value={value} onChange={setValue} />

      {error && (
          <div className="rounded-xl border border-destructive/40 bg-destructive/10 p-3 text-[10px] font-bold text-destructive">
              {error}
          </div>
      )}
    </Card>
  );
}
