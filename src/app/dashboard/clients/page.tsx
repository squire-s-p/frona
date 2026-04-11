import { prisma } from "@/lib/prisma";
import { getAuthSession } from "@/lib/auth-session";

import ClientsClient from "@/components/clients/clients-client";

export default async function ClientsPage() {
  const session = await getAuthSession();
  if (!session?.user?.id) return null;

  const [clients, projects] = await Promise.all([
    prisma.client.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
      include: {
        projects: {
          select: { id: true, status: true },
        },
      },
    }),
    prisma.project.findMany({
      where: { userId: session.user.id },
      orderBy: { updatedAt: "desc" },
      select: { id: true, name: true, clientId: true, status: true },
    }),
  ]);

  const rows = clients.map((c: any) => {
    const totalProjects = c.projects.length;
    const activeProjects = c.projects.filter((p: any) => p.status === "active").length;

    return {
      id: c.id,
      name: c.name,
      activeProjects,
      totalProjects,
      createdAt: c.createdAt,
    };
  });

  return (
    <div className="space-y-6">
      <ClientsClient clients={rows} projects={projects} />
    </div>
  );
}
