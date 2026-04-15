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

  const [activeTimer, projects, tags] = await Promise.all([
    getActiveTimer(),
    listProjects(session.user.id),
    listTags(session.user.id),
  ]);

  const isTimerRunning = !!activeTimer;
  const isDeepWorkMode = activeTimer?.mode === "work";

  return (
    <SoundProvider>
      <SidebarProvider>
        <AppSidebar user={freshUser} />

        {/* ✅ SidebarInset робимо "порожнім" контейнером без rounded/shadow */}
        <SidebarInset className="bg-sidebar">
          {/* ✅ TOPBAR: той самий фон що й sidebar */}
          <header className="flex h-14 shrink-0 items-center gap-2 bg-sidebar">


            {/* твій існуючий topbar з іконками/діалогами */}
            <div className="min-w-0 flex-1">
              <DashboardTopbar 
                user={freshUser} 
                activeTimer={activeTimer} 
                projects={projects}
                tags={tags}
              />
            </div>

          </header>

          {/* ✅ BOARD: тільки тут rounded + shadow */}
          <main className="flex-1 p-2 sm:p-4 flex flex-col min-h-0">
            <div className="flex-1 rounded-2xl bg-background shadow-sm ring-1 ring-border overflow-hidden flex flex-col">
              <div className="p-3 sm:p-4 md:p-6 flex-1 flex flex-col min-h-0 relative">{children}</div>
            </div>
          </main>
        </SidebarInset>
      </SidebarProvider>
    </SoundProvider>
  );
}
