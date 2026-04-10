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
        // ✅ не даємо привʼязувати archived (таблиця нижче все одно показує їх)
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
    <Card className="p-4 md:p-6">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-sm font-semibold">Проєкти клієнта</div>
          <div className="mt-1 text-sm text-muted-foreground">
            Привʼяжи або відвʼяжи існуючі проєкти від цього клієнта.
          </div>
        </div>

        <Button size="sm" className="gap-2" onClick={onSave} disabled={!dirty || isPending}>
          {isPending ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Збереження...
            </>
          ) : (
            <>
              <Save className="h-4 w-4" />
              Зберегти
            </>
          )}
        </Button>
      </div>

      <Separator className="my-4" />

      <ProjectMultiSelect projects={options} value={value} onChange={setValue} />

      {error ? (
        <div className="mt-4 rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm">
          {error}
        </div>
      ) : null}
    </Card>
  );
}
