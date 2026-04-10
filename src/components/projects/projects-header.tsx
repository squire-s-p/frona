"use client";

import { useRouter } from "next/navigation";
import ProjectCreateDialog from "@/components/projects/project-create-dialog";
import { Button } from "@/components/ui/button";

export default function ProjectsHeader({ count }: { count: number }) {
  const router = useRouter();

  return (
    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
      <div>
        <h1 className="text-xl font-semibold">Проєкти</h1>
        <p className="text-sm text-muted-foreground">Всього: {count}</p>
      </div>

      <div className="flex items-center gap-2">
        <ProjectCreateDialog onCreated={() => router.refresh()} />
        <Button variant="secondary" className="rounded-xl" onClick={() => router.refresh()}>
          Оновити
        </Button>
      </div>
    </div>
  );
}
