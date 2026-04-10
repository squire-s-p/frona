"use client"

import { signOut } from "next-auth/react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { ThemeToggle } from "./theme-toggle";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Plus, LogOut, User as UserIcon, Play, Square, ListPlus } from "lucide-react";

// ✅ твої попапи
import { SearchCommand } from "@/components/command/search-command";
import { startWork, stopActive } from "@/app/dashboard/time/actions";
import { useRouter, usePathname } from "next/navigation";
import { useTransition, useState, useEffect } from "react";
import { SoundPopover } from "@/modules/sound/components/SoundPopover";
import { TaskDialog } from "@/components/tasks/task-dialog";
import { NotificationsSheet } from "@/components/layout/notifications-sheet";
import { cn } from "@/lib/utils";

type User = {
  name?: string | null;
  email?: string | null;
  image?: string | null;
};

function initials(name?: string | null) {
  if (!name) return "U";
  const parts = name.trim().split(/\s+/);
  return (parts[0]?.[0] ?? "U") + (parts[1]?.[0] ?? "");
}

function pad(n: number) {
  return String(n).padStart(2, "0");
}

function formatElapsed(ms: number) {
  const total = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  return `${pad(h)}:${pad(m)}:${pad(s)}`;
}

export function DashboardTopbar({ 
  user, 
  activeTimer, 
  projects = [], 
  tags = [] 
}: { 
  user: User; 
  activeTimer?: any; 
  projects?: any[]; 
  tags?: any[] 
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [now, setNow] = useState(Date.now());
  const [taskDialogOpen, setTaskDialogOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (!activeTimer) return;
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [activeTimer]);

  const onQuickStart = () => {
    startTransition(async () => {
      await startWork({});
      router.refresh();
    });
  };

  const onStopTimer = () => {
    startTransition(async () => {
      await stopActive();
      router.refresh();
    });
  };

  const elapsed = activeTimer && mounted
    ? formatElapsed(now - new Date(activeTimer.startedAt).getTime())
    : "00:00:00";

  const pathname = usePathname();

  const routeMap: Record<string, string> = {
    "/dashboard": "Огляд",
    "/dashboard/projects": "Проєкти",
    "/dashboard/tasks": "Завдання",
    "/dashboard/clients": "Клієнти",
    "/dashboard/time": "Час",
    "/dashboard/calendar": "Календар",
    "/dashboard/finance": "Фінанси",
    "/dashboard/notes": "Нотатки",
    "/dashboard/whiteboard": "Біла дошка",
    "/dashboard/settings": "Налаштування",
  };

  const currentTitle = Object.entries(routeMap).find(([route]) => 
    pathname === route || (route !== "/dashboard" && pathname.startsWith(route))
  )?.[1] || "Dashboard";

  return (
    <div className="flex h-14 items-center gap-2 px-3 md:px-4">
      {/* ✅ Trigger sidebar (працює і на мобілці, і на десктопі) */}
      <SidebarTrigger className="rounded-xl" />

      <div className="ml-2 text-sm font-medium text-foreground sm:block">
        {currentTitle}
      </div>

      <div className="flex-1" />

      {/* Actions */}
      <div className="flex items-center gap-2">

        {/* Search (Command popup button) */}
        <SearchCommand />

        {/* Quick Start / Active Timer */}
        <Button
          variant={activeTimer ? "ghost" : "outline"}
          onClick={activeTimer ? onStopTimer : onQuickStart}
          disabled={isPending}
          className={cn(
            "relative flex items-center justify-center rounded-xl transition-all duration-500 h-9 overflow-hidden group border focus-visible:ring-0",
            activeTimer 
              ? "w-[100px] sm:w-[110px] bg-primary/10 border-primary/20 text-primary hover:bg-primary/20 px-2" 
              : "w-9 border-input hover:bg-accent hover:text-accent-foreground px-0"
          )}
          title={activeTimer ? "Зупинити таймер" : "Почати таймер"}
        >
          <div className={cn(
            "flex items-center gap-1.5 transition-all duration-500",
            activeTimer ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-10"
          )}>
            <span className="text-xs sm:text-sm font-semibold tabular-nums font-mono whitespace-nowrap">
              {elapsed}
            </span>
            <Square className="h-3 sm:h-3.5 w-3 sm:w-3.5 fill-current" />
          </div>

          <div className={cn(
            "absolute inset-0 flex items-center justify-center transition-all duration-500",
            activeTimer ? "opacity-0 scale-50" : "opacity-100 scale-100"
          )}>
            <Play className="h-4 w-4 fill-current text-muted-foreground group-hover:text-foreground" />
          </div>
        </Button>


        {/* New task modal trigger */}
        <Button 
          variant="outline" 
          size="icon" 
          className="rounded-xl" 
          onClick={() => setTaskDialogOpen(true)}
          title="Нове завдання"
        >
          <Plus className="h-4 w-4" />
        </Button>

        <TaskDialog 
          open={taskDialogOpen} 
          onOpenChange={setTaskDialogOpen}
          task={null}
          projects={projects}
          tags={tags}
        />

        <SoundPopover />
        <NotificationsSheet />
        <ThemeToggle />

        {/* User menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="h-10 gap-2 rounded-xl px-2">
              <Avatar className="h-7 w-7">
                <AvatarImage src={user.image ?? ""} alt={user.name ?? "User"} />
                <AvatarFallback>{initials(user.name)}</AvatarFallback>
              </Avatar>
              <span className="hidden max-w-[180px] truncate text-sm md:inline">
                {user.name ?? "Користувач"}
              </span>
            </Button>
          </DropdownMenuTrigger>

          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel className="flex flex-col">
              <span className="text-sm font-medium">{user.name ?? "Користувач"}</span>
              <span className="text-xs text-muted-foreground">{user.email ?? ""}</span>
            </DropdownMenuLabel>

            <DropdownMenuSeparator />

            <DropdownMenuItem asChild>
              <Link href="/dashboard/settings" className="flex items-center gap-2">
                <UserIcon className="h-4 w-4" />
                Профіль / Налаштування
              </Link>
            </DropdownMenuItem>

            <DropdownMenuSeparator />

            <DropdownMenuItem
              className="flex cursor-pointer items-center gap-2"
              onClick={() => signOut({ callbackUrl: "/login" })}
            >
              <LogOut className="h-4 w-4" />
              Вийти
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}

