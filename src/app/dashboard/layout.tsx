import { redirect } from "next/navigation";
import { getAuthSession } from "@/lib/auth-session";
import { prisma } from "@/lib/prisma";
import type { Metadata } from "next";

export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
  },
};

import { AppSidebar } from "@/components/app-sidebar";
import { DashboardTopbar } from "@/components/dashboard/topbar";
import ActiveTimerPill from "@/components/time/active-timer-pill";
import { getActiveTimer } from "@/app/dashboard/time/actions";
import { SoundProvider } from "@/modules/sound/components/SoundProvider";
import { listProjects, listTags } from "@/server/tasks/queries";

import { Separator } from "@/components/ui/separator";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getAuthSession();
  if (!session?.user?.id) {
    redirect(`/login?callbackUrl=${encodeURIComponent("/dashboard")}`);
  }

  // Отримуємо завжди свіжі дані профілю з БД для відображення в боковому меню та шапці
  const dbUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { name: true, image: true, email: true }
  });

  const freshUser = { ...session.user, ...dbUser };

  let rawActiveTimer = null;
  let projects: any[] = [];
  let tags: any[] = [];
  let clients: any[] = [];

  try {
    const data = await Promise.all([
      getActiveTimer().catch(() => null),
      listProjects(session.user.id).catch(() => []),
      listTags(session.user.id).catch(() => []),
      prisma.client.findMany({
        where: { userId: session.user.id },
        select: { id: true, name: true }
      }).catch(() => []),
    ]);
    
    [rawActiveTimer, projects, tags, clients] = data;
  } catch (error) {
    console.error("Layout data fetching error:", error);
  }

  // Serialize complex objects for Client Components
  const activeTimer = rawActiveTimer ? JSON.parse(JSON.stringify(rawActiveTimer)) : null;

  return (
    <SoundProvider>
      <SidebarProvider className="h-screen overflow-hidden">
        <AppSidebar user={freshUser} />

        <SidebarInset className="bg-sidebar flex flex-col min-h-0 overflow-hidden">
          <header className="flex h-14 shrink-0 items-center gap-2 bg-sidebar">
            <div className="min-w-0 flex-1">
              <DashboardTopbar 
                user={freshUser} 
                activeTimer={activeTimer} 
                projects={projects}
                tags={tags}
                clients={clients}
              />
            </div>
          </header>

          {/* ✅ BOARD: центральна секція */}
          <main className="flex-1 p-2 sm:p-4 flex flex-col min-h-0 overflow-hidden">
            <div className="flex-1 rounded-3xl bg-background shadow-sm ring-1 ring-border flex flex-col min-h-0 overflow-hidden">
              {/* Тільки цей блок буде прокручуватися */}
              <div className="flex-1 overflow-y-auto custom-scrollbar relative">
                <div className="p-3 sm:p-4 md:p-6 pb-20 sm:pb-24">
                  {children}
                </div>
              </div>
            </div>
          </main>
        </SidebarInset>
      </SidebarProvider>
    </SoundProvider>
  );
}
