"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

import {
  LayoutDashboard,
  FolderKanban,
  CheckSquare,
  Clock,
  Wallet,
  Settings,
  Users,
} from "lucide-react";

type NavItem = {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
};

const nav: NavItem[] = [
  { href: "/dashboard", label: "Огляд", icon: LayoutDashboard },
  { href: "/dashboard/projects", label: "Проєкти", icon: FolderKanban },
  { href: "/dashboard/clients", label: "Клієнти", icon: Users }, // ✅ НОВИЙ
  { href: "/dashboard/tasks", label: "Завдання", icon: CheckSquare },
  { href: "/dashboard/time", label: "Час", icon: Clock },
  { href: "/dashboard/finance", label: "Фінанси", icon: Wallet },
  { href: "/dashboard/settings", label: "Налаштування", icon: Settings },
];

function cn(...classes: Array<string | false | undefined | null>) {
  return classes.filter(Boolean).join(" ");
}

export function DashboardSidebar({
  variant = "desktop",
  onNavigate,
  collapsed = false,
  onToggleCollapsed: _onToggleCollapsed,
}: {
  variant?: "desktop" | "mobile";
  onNavigate?: () => void;

  // тільки для desktop
  collapsed?: boolean;
  onToggleCollapsed?: () => void;
}) {
  const pathname = usePathname();
  const isDesktop = variant === "desktop";
  const widthClass = isDesktop
    ? collapsed
      ? "md:w-[76px]"
      : "md:w-72"
    : "w-72 max-w-[85vw]";

  return (
    <TooltipProvider delayDuration={150}>
      <aside
        className={cn(
          isDesktop ? "hidden md:block md:shrink-0" : "block",
          widthClass,
          "h-screen border-r bg-background"
        )}
      >
        <div className="flex h-full flex-col">
          {/* Brand */}
          <div
            className={cn(
              "flex h-14 items-center gap-3 px-4",
              collapsed && isDesktop && "justify-center"
            )}
          >
            {/* ✅ DB НЕ стискається */}
            <div className="shrink-0">
              <div className="grid size-9 place-items-center rounded-xl bg-foreground text-background text-sm font-bold">
                DB
              </div>
            </div>

            {!collapsed && isDesktop && (
              <div className="min-w-0 leading-tight">
                <div className="truncate font-semibold">Dashboard</div>
                <div className="truncate text-xs text-muted-foreground">
                  Твій робочий простір
                </div>
              </div>
            )}

            {/* ❌ СТАРУ КНОПКУ згортання прибрано повністю.
               Тепер toggle має бути в Topbar. */}
          </div>

          <Separator />

          {/* Nav */}
          <ScrollArea className="flex-1">
            <nav className={cn("p-2", collapsed && isDesktop && "px-2")}>
              {nav.map((item) => {
                const Icon = item.icon;
                const active =
                  pathname === item.href ||
                  (item.href !== "/dashboard" && pathname.startsWith(item.href));

                const link = (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={onNavigate}
                    className={cn(
                      "mb-1 flex items-center gap-3 rounded-xl px-3 py-2 text-sm transition",
                      "hover:bg-accent hover:text-accent-foreground",
                      active && "bg-accent text-accent-foreground",
                      collapsed && isDesktop && "justify-center px-2"
                    )}
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    {!collapsed && isDesktop && (
                      <span className="truncate">{item.label}</span>
                    )}
                  </Link>
                );

                // desktop collapsed -> tooltips
                if (!collapsed || !isDesktop) return link;

                return (
                  <Tooltip key={item.href}>
                    <TooltipTrigger asChild>{link}</TooltipTrigger>
                    <TooltipContent side="right" className="rounded-xl">
                      {item.label}
                    </TooltipContent>
                  </Tooltip>
                );
              })}
            </nav>

            {/* Tip card (hide when collapsed desktop) */}
            {(!collapsed || !isDesktop) && (
              <div className="px-4 pb-4">
                <div className="mt-4 rounded-xl border bg-card p-3 text-sm">
                  <div className="text-muted-foreground">
                    Порада: почни з <b>Проєктів</b> і додай перші завдання.
                  </div>
                </div>
              </div>
            )}
          </ScrollArea>
        </div>
      </aside>
    </TooltipProvider>
  );
}
