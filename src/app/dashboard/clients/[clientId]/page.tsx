import { notFound } from "next/navigation";

import { prisma } from "@/lib/prisma";
import { getAuthSession } from "@/lib/auth-session";

import { Receipt, FolderPlus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  DashboardPage,
  DashboardPageHeader,
} from "@/components/layout/dashboard-page";

import ClientDetailsCard from "@/components/clients/client-details-card";
import ClientProjectsTable from "@/components/clients/client-projects-table";
import ClientProjectsPicker from "@/components/clients/client-projects-picker";

import ProjectCreateDialog from "@/components/projects/project-create-dialog";
import InvoiceCreateDialog from "@/components/invoices/invoice-create-dialog";

export default async function ClientPage({
  params,
}: {
  params: Promise<{ clientId: string }>;
}) {
  const { clientId } = await params;

  const session = await getAuthSession();
  if (!session?.user?.id) return null;

  const client = await prisma.client.findFirst({
    where: { id: clientId, userId: session.user.id },
    select: {
      id: true,
      name: true,
      taxId: true,
      email: true,
      address: true,
      contactInfo: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  if (!client) notFound();

  const [clientProjects, allProjects, clientsForProjectDialog] =
    await Promise.all([
      prisma.project.findMany({
        where: { userId: session.user.id, clientId: client.id },
        orderBy: { updatedAt: "desc" },
        select: {
          id: true,
          name: true,
          status: true,
          updatedAt: true,
          clientId: true,
        },
      }),
      prisma.project.findMany({
        where: { userId: session.user.id },
        orderBy: { updatedAt: "desc" },
        select: { id: true, name: true, status: true, clientId: true },
      }),
      prisma.client.findMany({
        where: { userId: session.user.id },
        orderBy: { name: "asc" },
        select: { id: true, name: true },
      }),
    ]);

  const activeCount = clientProjects.reduce(
    (acc: number, p) => acc + (p.status === "active" ? 1 : 0),
    0
  );

  return (
    <DashboardPage>
      <DashboardPageHeader
        title={client.name}
        actions={
          <div className="flex items-center gap-2">
            <InvoiceCreateDialog
              clientId={client.id}
              trigger={
                <Button variant="outline" className="gap-2">
                  <Receipt className="h-4 w-4" />
                  <span>Рахунок</span>
                </Button>
              }
            />
            <ProjectCreateDialog
              clients={clientsForProjectDialog}
              defaultClientId={client.id}
              trigger={
                <Button className="gap-2">
                  <FolderPlus className="h-4 w-4" />
                  <span>Проєкт</span>
                </Button>
              }
            />
          </div>
        }
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <div className="min-w-0 lg:col-span-7">
          <ClientDetailsCard
            client={{
              id: client.id,
              name: client.name,
              taxId: client.taxId ?? "",
              email: client.email ?? "",
              address: client.address ?? "",
              contactInfo: client.contactInfo ?? "",
              createdAt: client.createdAt,
              updatedAt: client.updatedAt,
            }}
          />
        </div>

        <div className="min-w-0 lg:col-span-5 flex flex-col gap-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Card className="gap-2 py-4">
              <div className="px-6 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                Активні проєкти
              </div>
              <div className="px-6 flex items-baseline gap-2">
                <span className="text-3xl font-semibold tabular-nums">
                  {activeCount}
                </span>
                <span className="text-xs text-muted-foreground">
                  з {clientProjects.length}
                </span>
              </div>
            </Card>

            <Card className="gap-2 py-4">
              <div className="px-6 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                Всього проєктів
              </div>
              <div className="px-6 flex items-baseline gap-2">
                <span className="text-3xl font-semibold tabular-nums">
                  {clientProjects.length}
                </span>
                <span className="text-xs text-muted-foreground">проєктів</span>
              </div>
            </Card>
          </div>

          <ClientProjectsPicker
            clientId={client.id}
            allProjects={allProjects}
            selectedProjectIds={clientProjects.map((p) => p.id)}
          />
        </div>
      </div>

      <ClientProjectsTable
        projects={clientProjects.map((p) => ({
          id: p.id,
          name: p.name,
          status: p.status,
          updatedAt: p.updatedAt,
        }))}
      />
    </DashboardPage>
  );
}

