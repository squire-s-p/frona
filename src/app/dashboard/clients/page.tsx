import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Клієнти',
};

import { prisma } from "@/lib/prisma";
import { getAuthSession } from "@/lib/auth-session";
import ClientsClient from "@/components/clients/clients-client";
import { DashboardPage } from "@/components/layout/dashboard-page";

export default async function ClientsPage() {
  const session = await getAuthSession();
  if (!session?.user?.id) return null;

  let clients: { id: string; name: string; projects: { id: string; status: string }[]; createdAt: Date }[] = [];
  let projects: { id: string; name: string; clientId: string | null; status: string }[] = [];

  try {
    const data = await Promise.all([
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
    clients = data[0];
    projects = data[1];
  } catch (e) {
    console.error("Failed to load clients page data:", e);
  }

  const rows = clients.map((c) => {
    const totalProjects = c.projects.length;
    const activeProjects = c.projects.filter((p) => p.status === "active").length;

    return {
      id: c.id,
      name: c.name,
      activeProjects,
      totalProjects,
      createdAt: c.createdAt instanceof Date ? c.createdAt.toISOString() : c.createdAt,
    };
  });

  return (
    <DashboardPage>
      <ClientsClient clients={rows} projects={projects} />
    </DashboardPage>
  );
}
