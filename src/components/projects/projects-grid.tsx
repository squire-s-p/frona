import { Folder } from "lucide-react";
import ProjectCard from "./project-card";

export type ProjectRow = {
  id: string;
  name: string;
  source: string | null;
  site: string | null;
  cost: any | null; // Prisma Decimal
  createdAt: string | Date;
  updatedAt: string | Date;
  status: "active" | "completed" | "archived";
  clientName?: string | null;
};

export default function ProjectsGrid({ projects }: { projects: ProjectRow[] }) {
  if (!projects.length) {
    return (
      <div className="rounded-2xl border bg-card/50 p-12 text-center backdrop-blur-sm">
        <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
          <Folder className="h-6 w-6 text-primary" />
        </div>
        <h3 className="text-lg font-bold">Проєктів не знайдено</h3>
        <p className="text-sm text-muted-foreground mt-1">Спробуйте змінити фільтри або створити новий проєкт.</p>
      </div>
    );
  }

  return (
    <div className="flex-1 min-h-0 overflow-y-auto pr-2 pb-10 scrollbar-hide">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {projects.map((p) => (
          <ProjectCard
            key={p.id}
            id={p.id}
            name={p.name}
            source={p.source}
            site={p.site}
            cost={p.cost ? String(p.cost) : null}
            createdAt={p.createdAt}
            updatedAt={p.updatedAt}
            status={p.status}
            clientName={p.clientName}
          />
        ))}
      </div>
    </div>
  );
}
