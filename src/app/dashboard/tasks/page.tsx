import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Завдання",
};

import { redirect } from "next/navigation";
import { getAuthSession } from "@/lib/auth-session";
import { listProjects, listTasks, listTags } from "@/server/tasks/queries";
import { TasksClient } from "@/components/tasks/tasks-client";
import { DashboardPage } from "@/components/layout/dashboard-page";

export default async function TasksPage() {
  const session = await getAuthSession();
  if (!session?.user) {
    redirect(`/login?callbackUrl=${encodeURIComponent("/dashboard/tasks")}`);
  }

  const [tasks, projects, tags] = await Promise.all([
    listTasks(session.user.id),
    listProjects(session.user.id),
    listTags(session.user.id),
  ]);

  return (
    <DashboardPage className="h-full">
      <TasksClient initialTasks={tasks} projects={projects} tags={tags} />
    </DashboardPage>
  );
}

