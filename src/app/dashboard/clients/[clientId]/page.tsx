import Link from "next/link";
import { notFound } from "next/navigation";

import { prisma } from "@/lib/prisma";
import { getAuthSession } from "@/lib/auth-session";

import { ArrowLeft } from "lucide-react";
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
    (acc, p) => acc + (p.status === "active" ? 1 : 0),
    0
  );

  return (
    <div className="absolute inset-0 overflow-y-auto scrollbar-hide bg-background">
      <div className="p-4 md:p-6 pb-20 space-y-6">
        
        {/* HEADER — Identical pattern to projects */}
        <div className="mb-8">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div className="min-w-0 space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <Link href="/dashboard/clients">
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="h-7 w-7 shrink-0 rounded-full border-border/40 bg-card hover:bg-muted hover:text-primary transition-all group"
                  >
                    <ArrowLeft className="h-3.5 w-3.5 transition-transform group-hover:-translate-x-0.5" />
                  </Button>
                </Link>
                
                <Badge variant="secondary" className="rounded-lg px-2 py-0.5 text-[10px] uppercase font-bold tracking-wider bg-primary/5 text-primary border-primary/10">
                  Клієнт
                </Badge>
              </div>

              <div className="flex flex-col ml-0.5">
                <h1 className="truncate text-2xl sm:text-4xl font-extrabold tracking-tight text-foreground leading-none">
                  {client.name}
                </h1>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 shrink-0">
              <InvoiceCreateDialog
                clientId={client.id}
                trigger={
                  <Button variant="outline" className="h-11 rounded-2xl border-border/40 px-5 text-[11px] font-bold hover:bg-zinc-500/5">
                    + Новий рахунок
                  </Button>
                }
              />

              <ProjectCreateDialog
                clients={clientsForProjectDialog}
                defaultClientId={client.id}
                trigger={
                  <Button className="h-11 rounded-2xl px-6 text-[11px] font-bold shadow-lg shadow-primary/10">
                    + Новий проєкт
                  </Button>
                }
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          
          {/* LEFT COLUMN — Details */}
          <div className="lg:col-span-7 space-y-5">
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
            
            <Card className="rounded-2xl border bg-card shadow-sm overflow-hidden">
                <div className="px-5 pt-5 pb-4 border-b border-border/50">
                    <h2 className="text-base font-bold tracking-tight text-foreground">Нотатки</h2>
                </div>
                <div className="p-5">
                    <div className="text-sm text-muted-foreground bg-muted/20 p-4 rounded-xl border border-dashed border-border/60 text-center italic">
                        Тут можна буде додати коментарі або чат, як у проєктах.
                    </div>
                </div>
            </Card>
          </div>

          {/* RIGHT COLUMN — Stats & Quick Projects */}
          <div className="lg:col-span-5 space-y-5">
            
            {/* Stats Cards */}
            <div className="grid grid-cols-2 gap-4">
                <div className="rounded-2xl border bg-card p-5 shadow-sm">
                    <p className="text-[10px] uppercase font-bold text-muted-foreground/60 tracking-wider mb-2">Активні проєкти</p>
                    <div className="flex items-baseline gap-2">
                        <span className="text-3xl font-extrabold text-emerald-600">{activeCount}</span>
                        <span className="text-xs text-muted-foreground font-medium">з {clientProjects.length}</span>
                    </div>
                </div>
                <div className="rounded-2xl border bg-card p-5 shadow-sm">
                    <p className="text-[10px] uppercase font-bold text-muted-foreground/60 tracking-wider mb-2">Загалом проєктів</p>
                    <div className="flex items-baseline gap-2">
                        <span className="text-3xl font-extrabold text-foreground">{clientProjects.length}</span>
                    </div>
                </div>
            </div>

            <ClientProjectsPicker
                clientId={client.id}
                allProjects={allProjects}
                selectedProjectIds={clientProjects.map((p) => p.id)}
            />

          </div>
        </div>

        {/* BOTTOM FULL WIDTH — Detailed Projects Table */}
        <div className="mt-5">
            <ClientProjectsTable
                projects={clientProjects.map((p) => ({
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
