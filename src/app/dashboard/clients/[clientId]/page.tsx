import Link from "next/link";
import { notFound } from "next/navigation";

import { prisma } from "@/lib/prisma";
import { getAuthSession } from "@/lib/auth-session";

import { ArrowLeft, Receipt, FolderPlus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";

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

  const [clientProjects, allProjects, clientsForProjectDialog] = await Promise.all([
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
    (acc: number, p: any) => acc + (p.status === "active" ? 1 : 0),
    0
  );

  return (
    <div className="absolute inset-0 overflow-y-auto scrollbar-hide bg-background">
      <div className="p-4 md:p-6 pb-20 space-y-6">

        {/* HEADER Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between gap-4">
            <h1 className="truncate text-xl sm:text-3xl font-extrabold tracking-tight text-foreground leading-none">
              {client.name}
            </h1>

            <div className="flex items-center gap-3 shrink-0">
              <InvoiceCreateDialog
                clientId={client.id}
                trigger={
                  <Button variant="outline" className="h-9 rounded-lg gap-2 px-4 text-sm font-medium transition-all shadow-none">
                    <Receipt className="h-4 w-4" />
                    <span>Рахунок</span>
                  </Button>
                }
              />
              <ProjectCreateDialog
                clients={clientsForProjectDialog}
                defaultClientId={client.id}
                trigger={
                  <Button className="h-9 rounded-lg gap-2 px-4 text-sm font-medium transition-all">
                    <FolderPlus className="h-4 w-4" />
                    <span>Проєкт</span>
                  </Button>
                }
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">

          {/* LEFT COLUMN — Details */}
          <div className="lg:col-span-7 h-full">
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

          {/* RIGHT COLUMN — Stats & Quick Projects */}
          <div className="lg:col-span-5 flex flex-col gap-5 h-full">

            {/* Stats Block (Finance style) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div className="rounded-2xl border border-border/60 bg-neutral-100 dark:bg-neutral-900 p-5 shadow-none flex flex-col justify-between h-32">
                <p className="text-[10px] uppercase font-bold text-muted-foreground/60 tracking-wider">Активні проєкти</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-extrabold text-emerald-600 tracking-tighter">{activeCount}</span>
                  <span className="text-xs text-muted-foreground font-medium">з {clientProjects.length}</span>
                </div>
              </div>
              <div className="rounded-2xl border border-border/60 bg-neutral-100 dark:bg-neutral-900 p-5 shadow-none flex flex-col justify-between h-32">
                <p className="text-[10px] uppercase font-bold text-muted-foreground/60 tracking-wider">Загалом проєктів</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-extrabold text-foreground tracking-tighter">{clientProjects.length}</span>
                  <span className="text-xs text-muted-foreground font-medium">проєктів</span>
                </div>
              </div>
            </div>

            <ClientProjectsPicker
              clientId={client.id}
              allProjects={allProjects}
              selectedProjectIds={clientProjects.map((p: any) => p.id)}
            />

          </div>
        </div>

        {/* BOTTOM FULL WIDTH — Detailed Projects Table */}
        <div className="mt-5">
          <ClientProjectsTable
            projects={clientProjects.map((p: any) => ({
              id: p.id,
              name: p.name,
              status: p.status,
              updatedAt: p.updatedAt,
            }))}
          />
        </div>

      </div>
    </div>
  );
}
