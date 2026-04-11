"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import {
  LayoutDashboard,
  FolderKanban,
  Users,
  CheckSquare,
  Clock,
  Wallet,
  Settings,
  Layout,
  Calendar,
} from "lucide-react";

import { cn } from "@/lib/utils";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  useSidebar,
} from "@/components/ui/sidebar";

import { NavUser } from "@/components/nav-user";

type User = {
  name?: string | null;
  email?: string | null;
  image?: string | null;
};

type NavItem = {
  title: string;
  url: string;
  icon: React.ComponentType<{ className?: string }>;
};

const navMain: NavItem[] = [
  { title: "Огляд", url: "/dashboard", icon: LayoutDashboard },
  { title: "Проєкти", url: "/dashboard/projects", icon: FolderKanban },
  { title: "Завдання", url: "/dashboard/tasks", icon: CheckSquare },
  { title: "Клієнти", url: "/dashboard/clients", icon: Users },
  { title: "Час", url: "/dashboard/time", icon: Clock },
  { title: "Календар", url: "/dashboard/calendar", icon: Calendar },
  { title: "Фінанси", url: "/dashboard/finance", icon: Wallet },
  { title: "Нотатки", url: "/dashboard/notes", icon: CheckSquare },
  { title: "Біла дошка", url: "/dashboard/whiteboard", icon: Layout },
  { title: "Налаштування", url: "/dashboard/settings", icon: Settings },
];

function initials(name?: string | null) {
  if (!name) return "U";
  const parts = name.trim().split(/\s+/);
  return (parts[0]?.[0] ?? "U") + (parts[1]?.[0] ?? "");
}

export function AppSidebar({
  user,
  className,
  ...props
}: React.ComponentProps<typeof Sidebar> & { user: User }) {
  const pathname = usePathname();
  const { state } = useSidebar();
  const collapsed = state === "collapsed";

  return (
    <Sidebar
      variant="inset"
      collapsible="icon"
      className={cn(className)}
      {...props}
    >
      {/* ================= HEADER ================= */}
      <SidebarHeader className="px-3">
        {/* ❗ НЕ SidebarMenuButton ❗ */}
        <div className="flex h-14 items-center gap-3">
          {/* Logo — НІКОЛИ не стискається */}
          <div className="shrink-0">
            <div className="flex size-9 items-center justify-center overflow-hidden">
              <img src="/logo.svg" alt="Frona Logo" className="size-full object-contain dark:invert" />
            </div>
          </div>

          {/* Текст ховається при collapse */}
          {!collapsed && (
            <div className="min-w-0 leading-tight">
              <div className="truncate text-base font-medium tracking-tight">Frona test</div>
            </div>
          )}
        </div>
      </SidebarHeader>

      {/* ================= CONTENT ================= */}
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Platform</SidebarGroupLabel>

          <SidebarMenu>
            {navMain.map((item) => {
              const Icon = item.icon;
              const active =
                pathname === item.url ||
                (item.url !== "/dashboard" && pathname.startsWith(item.url));

              return (
                <SidebarMenuItem key={item.url}>
                  <SidebarMenuButton
                    asChild
                    tooltip={item.title}
                    className={cn(
                      active && "bg-sidebar-accent text-sidebar-accent-foreground"
                    )}
                  >
                    <Link href={item.url}>
                      <Icon className="size-4 shrink-0" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              );
            })}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>

      {/* ================= FOOTER ================= */}
      <SidebarFooter>
        <NavUser
          user={{
            name: user.name ?? "Користувач",
            email: user.email ?? "",
            avatar: user.image ?? "",
            initials: initials(user.name),
          } as any}
        />
      </SidebarFooter>
    </Sidebar>
  );
}
