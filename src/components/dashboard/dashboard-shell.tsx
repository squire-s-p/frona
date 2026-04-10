"use client";

import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { DashboardTopbar } from "./topbar";

type User = {
  name?: string | null;
  email?: string | null;
  image?: string | null;
};

export default function DashboardShell({
  user,
  children,
}: {
  user: User;
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider>
      <div className="min-h-screen bg-background">
        <AppSidebar />

        {/* ✅ inset — це “права” частина */}
        <SidebarInset className="bg-background md:rounded-tl-3xl md:rounded-bl-3xl md:rounded-tr-3xl md:mt-2 md:mr-2 md:mb-2 md:border md:border-border md:shadow-sm overflow-hidden">
          {/* ✅ topbar з тим самим фоном, що й sidebar (візуально з’єднує) */}
          <div className="bg-sidebar">
            <DashboardTopbar user={user} />
          </div>

          <main className="flex-1 p-4 md:p-6">{children}</main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
