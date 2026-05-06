import { AppSidebar } from "@/components/app-sidebar";
import { DashboardTopbar as Topbar } from "@/components/dashboard/topbar";

export default function DashboardShell({
  user,
  children,
}: {
  user: { name?: string | null; email?: string | null; image?: string | null };
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-dvh bg-zinc-950 text-zinc-100">
      <div className="mx-auto flex min-h-dvh max-w-6xl">
        <aside className="hidden w-64 border-r border-zinc-800 bg-zinc-950 md:block">
          <AppSidebar user={user} />
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <Topbar user={user} />

          <main className="flex-1 p-4 md:p-6">
            <div className="rounded-2xl border border-zinc-800 bg-zinc-900/30 p-4 md:p-6">
              {children}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
