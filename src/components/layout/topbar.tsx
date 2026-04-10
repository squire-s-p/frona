"use client";

import Link from "next/link";
import { useState } from "react";
import { signOut } from "next-auth/react";

import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { Menu, LogOut, User as UserIcon, Plus } from "lucide-react";
import { AppSidebar as DashboardSidebar } from "@/components/app-sidebar";
import { ModeToggle as ThemeToggle } from "@/components/mode-toggle";

import { SearchCommand } from "@/components/command/search-command";
import { StartTimerDialog } from "@/components/time/start-timer-dialog";
import { NotificationsSheet } from "./notifications-sheet";

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

export function DashboardTopbar({
  user,
  projects,
  tasksByProject,
}: {
  user: User;
  projects: { id: string; name: string }[];
  tasksByProject: Record<string, { id: string; title: string }[]>;
}) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex h-14 items-center gap-3 border-b bg-background px-4 md:px-6">
      {/* Mobile */}
      <div className="md:hidden">
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetTrigger asChild>
            <Button variant="outline" size="icon" className="rounded-xl">
              <Menu className="h-4 w-4" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="p-0">
            <DashboardSidebar user={user} />
          </SheetContent>
        </Sheet>
      </div>

      {/* Left */}
      <div className="hidden md:block text-sm text-muted-foreground">
        Dashboard
      </div>

      <div className="ml-auto flex items-center gap-2">
        {/* Search */}
        <SearchCommand />

        {/* Time tracking */}
        <StartTimerDialog
          projects={projects}
          tasksByProject={tasksByProject}
        />

        {/* New task */}
        <Button
          asChild
          size="icon"
          variant="outline"
          className="rounded-xl"
          title="Нова задача"
        >
          <Link href="/dashboard/tasks/new">
            <Plus className="h-4 w-4" />
          </Link>
        </Button>

        <NotificationsSheet />

        <ThemeToggle />

        {/* User */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="h-10 gap-2 rounded-xl px-2">
              <Avatar className="h-7 w-7">
                <AvatarImage src={user.image ?? ""} />
                <AvatarFallback>{initials(user.name)}</AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>

          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>
              {user.name ?? "Користувач"}
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/dashboard/settings">
                <UserIcon className="mr-2 h-4 w-4" />
                Налаштування
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => signOut({ callbackUrl: "/login" })}
            >
              <LogOut className="mr-2 h-4 w-4" />
              Вийти
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
