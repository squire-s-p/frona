"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  FolderKanban,
  CheckSquare,
  Clock,
  Wallet,
  Settings,
  Command,
} from "lucide-react";

import { NavMain } from "@/components/nav-main";
import { NavProjects } from "@/components/nav-projects";
import { NavSecondary } from "@/components/nav-secondary";
import { NavUser } from "@/components/nav-user";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

type User = {
  name?: string | null;
  email?: string | null;
  image?: string | null;
};

type ProjectItem = { id: string; name: string };

function _initials(name?: string | null) {
  if (!name) return "U";
  const parts = name.trim().split(/\s+/);
  return (parts[0]?.[0] ?? "U") + (parts[1]?.[0] ?? "");
}

export function AppSidebarClient({
  user,
  projects,
  ...props
}: React.ComponentProps<typeof Sidebar> & {
  user: User;
  projects: ProjectItem[];
}) {
  const pathname = usePathname();

  const navMain = [
    {
      title: "Огляд",
      url: "/dashboard",
      icon: LayoutDashboard,
      isActive: pathname === "/dashboard",
      items: [],
    },
    {
      title: "Проєкти",
      url: "/dashboard/projects",
      icon: FolderKanban,
      isActive: pathname.startsWith("/dashboard/projects"),
      items: [],
    },
    {
      title: "Завдання",
      url: "/dashboard/tasks",
      icon: CheckSquare,
      isActive: pathname.startsWith("/dashboard/tasks"),
      items: [],
    },
    {
      title: "Час",
      url: "/dashboard/time",
      icon: Clock,
      isActive: pathname.startsWith("/dashboard/time"),
      items: [],
    },
    {
      title: "Фінанси",
      url: "/dashboard/finance",
      icon: Wallet,
      isActive: pathname.startsWith("/dashboard/finance"),
      items: [],
    },
    {
      title: "Налаштування",
      url: "/dashboard/settings",
      icon: Settings,
      isActive: pathname.startsWith("/dashboard/settings"),
      items: [],
    },
  ];

  const navSecondary = [
    { title: "Support", url: "#", icon: Command },
  ];

  const projectsForNav = projects.map((p) => ({
    name: p.name,
    url: `/dashboard/projects/${p.id}`,
    icon: FolderKanban,
  }));

  return (
    <Sidebar variant="inset" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link href="/dashboard">
                <div className="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
                  <Command className="size-4" />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">Dashboard</span>
                  <span className="truncate text-xs">Workspace</span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        {/* Platform (твої розділи) */}
        <NavMain
          items={navMain.map((x) => ({
            ...x,
            // NavMain зараз використовує <a href>, ми лишимо як є.
            // Якщо хочеш Next <Link>, я перероблю NavMain окремо.
          }))}
        />

        {/* Projects (реальні з БД) */}
        <NavProjects projects={projectsForNav} />

        <NavSecondary items={navSecondary} className="mt-auto" />
      </SidebarContent>

      <SidebarFooter>
        <NavUser
          user={{
            name: user.name ?? "Користувач",
            email: user.email ?? "",
            avatar: user.image ?? "",
          }}
        />
      </SidebarFooter>
    </Sidebar>
  );
}
