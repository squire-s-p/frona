import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getAuthSession } from "@/lib/auth-session";
import { bucketsFromEntries } from "@/lib/time-entries";

import { Card } from "@/components/ui/card";
import ProjectTimeChart from "@/components/projects/project-time-chart";

import { TrashIcon } from "@/components/icons/trash";
import { Badge } from "@/components/ui/badge";
import ProjectHeader from "@/components/projects/project-header";
import ProjectDetailsCard from "@/components/projects/project-details-card";

import ProjectTasksClient from "@/components/projects/project-tasks-client";

type ActiveTimer = any;

export default async function ProjectDetailsPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const session = await getAuthSession();
  const userId = session?.user?.id;

  if (!userId) {
    redirect("/login?callbackUrl=/dashboard/projects");
  }

  const resolved = await params;
  const projectId =
    typeof resolved?.projectId === "string" ? resolved.projectId.trim() : "";

  if (!projectId) {
    redirect("/dashboard/projects");
  }

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: {
      id: true,
      userId: true,
      name: true,
      status: true,

      description: true,
      source: true,
      clientName: true, // legacy
      site: true,
      cost: true,
      accesses: true,
      clientContact: true, // legacy
      notes: true,

      // ✅ NEW: relation to Client
      client: {
        select: {
          id: true,
          name: true,
        },
      },

      timeEntries: {
        orderBy: { startAt: "desc" },
        take: 500,
        select: { startAt: true, endAt: true },
      },
    },
  });

  if (!project || project.userId !== userId) {
    redirect("/dashboard/projects");
  }

  const isArchived = project.status === "archived";

  const tasks = isArchived
    ? []
    : await prisma.task.findMany({
        where: { userId, projectId },
        orderBy: { updatedAt: "desc" },
        select: {
          id: true,
          title: true,
          description: true,
          status: true,
          priority: true,
          startAt: true,
          endAt: true,
          createdAt: true,
          updatedAt: true,
          project: { select: { id: true, name: true } },
          _count: { select: { comments: true } },
        },
      });

  const projectsOptions = isArchived
    ? []
    : await prisma.project.findMany({
        where: { userId, status: { not: "archived" } },
        orderBy: { updatedAt: "desc" },
        select: { id: true, name: true },
      });

  // ✅ NEW: clients for combobox (only for non-archived)
  const clients = isArchived
    ? []
    : await prisma.client.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        select: { id: true, name: true },
      });

  // 4) Time buckets (ALL period)
  const entries = project.timeEntries;
  const oldestStart = entries.length
    ? new Date(entries[entries.length - 1].startAt)
    : new Date();
  const daysAll = Math.max(
    1,
    Math.ceil((Date.now() - oldestStart.getTime()) / (24 * 60 * 60 * 1000)) + 1
  );

  const bucketsAll = bucketsFromEntries(entries, daysAll);

  return (
    <div className="absolute inset-0 overflow-y-auto scrollbar-hide bg-background">
      <div className="p-4 md:p-6 pb-20 space-y-6">
        {/* TOP BAR / BREADCRUMBS handled by ProjectHeader */}
        <ProjectHeader
          projectId={project.id}
          name={project.name}
          status={project.status as any}
          client={project.client}
        />

        {/* TOP ROW: Details / Tasks + Finance */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">

          {/* LEFT — Details (full height) */}
          <div className="lg:col-span-7">
            <ProjectDetailsCard
              projectId={project.id}
              status={project.status as any}
              clients={clients}
              initialClientId={project.client?.id ?? null}
              initial={{
                name: project.name,
                description: project.description ?? null,
                source: project.source ?? null,
                clientName: project.clientName ?? null,
                site: project.site ?? null,
                cost: project.cost ? project.cost.toString() : null,
                clientContact: project.clientContact ?? null,
                accesses: project.accesses ?? null,
                notes: project.notes ?? null,
              }}
            />
          </div>

          {/* RIGHT — Tasks + Finance */}
          <div className="lg:col-span-5 space-y-5">

            {/* Tasks Block */}
            {!isArchived && (
              <div className="rounded-2xl border bg-card shadow-sm overflow-hidden">
                <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-border/50">
                  <h2 className="text-base font-bold tracking-tight text-foreground">Список задач</h2>
                </div>
                <ProjectTasksClient initialTasks={tasks} projects={projectsOptions} />
              </div>
            )}

            {/* Analytics Block */}
            <div className="rounded-2xl border bg-card shadow-sm overflow-hidden">
              <div className="px-5 pt-5 pb-4 border-b border-border/50">
                <h2 className="text-base font-bold tracking-tight text-foreground">Часові звіти</h2>
              </div>
              <div className="p-5">
                <ProjectTimeChart buckets={bucketsAll} />
              </div>
            </div>

          </div>
        </div>

        {/* BOTTOM ROW: Finance — full width */}
        <div className="rounded-2xl border bg-card shadow-sm overflow-hidden mt-5">
          <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-border/50">
            <h2 className="text-base font-bold tracking-tight text-foreground">Фінансовий звіт</h2>
          </div>
          <div className="p-5">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="rounded-xl border border-border/40 bg-muted/10 p-4">
                <p className="text-[10px] uppercase font-bold text-muted-foreground/60 tracking-wider mb-1">Бюджет</p>
                <p className="text-xl font-bold text-foreground">
                  {project.cost ? `${project.cost} ₴` : "—"}
                </p>
              </div>
              <div className="rounded-xl border border-border/40 bg-muted/10 p-4">
                <p className="text-[10px] uppercase font-bold text-muted-foreground/60 tracking-wider mb-1">Відпрацьовано</p>
                <p className="text-xl font-bold text-foreground">—</p>
              </div>
              <div className="rounded-xl border border-border/40 bg-muted/10 p-4">
                <p className="text-[10px] uppercase font-bold text-muted-foreground/60 tracking-wider mb-1">Ставка / год</p>
                <p className="text-xl font-bold text-foreground">—</p>
              </div>
              <div className="rounded-xl border border-border/40 bg-muted/10 p-4">
                <p className="text-[10px] uppercase font-bold text-muted-foreground/60 tracking-wider mb-1">Зароблено</p>
                <p className="text-xl font-bold text-foreground">—</p>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
