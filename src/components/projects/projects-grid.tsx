import { SearchX } from "lucide-react";
import ProjectCard from "./project-card";
import { Card, CardContent } from "@/components/ui/card";

export type ProjectRow = {
  id: string;
  name: string;
  source: string | null;
  site: string | null;
  cost: number | null;
  createdAt: string | Date;
  updatedAt: string | Date;
  status: "active" | "completed" | "archived";
  clientName?: string | null;
};

export default function ProjectsGrid({ projects }: { projects: ProjectRow[] }) {
  if (!projects.length) {
    return (
      <Card className="rounded-2xl border-dashed bg-muted/30 p-12 text-center backdrop-blur-sm">
        <CardContent className="flex flex-col items-center">
          <div className="mx-auto w-16 h-16 rounded-2xl bg-primary/5 flex items-center justify-center mb-6 rotate-3">
            <SearchX className="h-8 w-8 text-primary/40" />
          </div>
          <h3 className="text-xl font-extrabold tracking-tight">Проєктів не знайдено</h3>
          <p className="text-sm text-muted-foreground mt-2 max-w-[250px] mx-auto">
            Спробуйте змінити фільтри або створіть свій перший проєкт.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="flex-1 min-h-0 overflow-y-auto pr-2 pb-10 scrollbar-hide">
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
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
