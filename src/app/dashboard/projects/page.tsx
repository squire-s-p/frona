import { redirect } from "next/navigation";

import { prisma } from "@/lib/prisma";
import { getAuthSession } from "@/lib/auth-session";

import ProjectsClient from "@/components/projects/projects-client";
import { autoArchiveCompletedProjects } from "./actions";

type ProjectStatus = "active" | "completed" | "archived";

export default async function ProjectsPage() {
  const session = await getAuthSession();
  if (!session?.user) redirect("/login?callbackUrl=/dashboard/projects");

  await autoArchiveCompletedProjects();

  const [projects, clients] = await Promise.all([
    prisma.project.findMany({
      where: { userId: session.user.id },
      orderBy: { updatedAt: "desc" },
      select: {
        id: true,
        name: true,
        description: true,
        source: true,
        clientName: true,
        site: true,
        cost: true,
        status: true,
        createdAt: true,
        updatedAt: true,

        // ✅ relation
        clientId: true,
        client: { select: { id: true, name: true } },
      },
    }),

    prisma.client.findMany({
      where: { userId: session.user.id },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
  ]);

  return (
    <div className="space-y-6">
      <ProjectsClient
        clients={clients.map((c: any) => ({ id: c.id, name: c.name }))}
        projects={projects.map((p: any) => ({
          id: p.id,
          name: p.name,
          description: p.description ?? null,
          source: p.source ?? null,

          // ✅ для групування/пошуку можна лишити legacy, але краще мати name з relation
          clientName: p.client?.name ?? p.clientName ?? null,

          site: p.site ?? null,
          cost: p.cost ? p.cost.toString() : null,
          createdAt: p.createdAt,
          updatedAt: p.updatedAt,
          status: p.status as unknown as ProjectStatus,
        }))}
      />
    </div>
  );
}
