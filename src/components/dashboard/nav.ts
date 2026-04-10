import {
  LayoutDashboard,
  ListTodo,
  FolderKanban,
  Timer,
  Wallet,
  Settings,
} from "lucide-react";

export const dashboardNav = [
  { title: "Огляд", href: "/dashboard", icon: LayoutDashboard },
  { title: "Проєкти", href: "/dashboard/projects", icon: FolderKanban },
  { title: "Завдання", href: "/dashboard/tasks", icon: ListTodo },
  { title: "Клієнти", href: "/dashboard/clients", icon: ListTodo },
  { title: "Час", href: "/dashboard/time", icon: Timer },
  { title: "Фінанси", href: "/dashboard/finance", icon: Wallet },
  { title: "Налаштування", href: "/dashboard/settings", icon: Settings },
];
