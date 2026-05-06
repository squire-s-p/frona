"use client";

import * as React from "react";
import { 
  Bell, 
  CheckCheck, 
  Trash2, 
  AlertCircle, 
  TrendingUp, 
  Clock,
  Zap,
  CheckCircle2
} from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

export type NotificationType = "TASK_OVERDUE" | "FINANCE_ALERT" | "SYSTEM_UPDATE" | "PROJECT_MILESTONE" | "NEW_FEATURE";

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  date: string;
  isRead: boolean;
  priority: "low" | "medium" | "high";
}

const MOCK_NOTIFICATIONS: Notification[] = [
  {
    id: "1",
    type: "TASK_OVERDUE",
    title: "Прострочене завдання",
    message: "Завдання 'Макет дашборду' мало бути виконане вчора.",
    date: new Date(Date.now() - 3600000 * 2).toISOString(),
    isRead: false,
    priority: "high"
  },
  {
    id: "2",
    type: "FINANCE_ALERT",
    title: "Великий вхідний платіж",
    message: "Ви отримали +45,000 грн від клієнта 'Art-Studio'.",
    date: new Date(Date.now() - 3600000 * 5).toISOString(),
    isRead: false,
    priority: "medium"
  },
  {
    id: "3",
    type: "SYSTEM_UPDATE",
    title: "Оновлення платформи",
    message: "Ми додали нові віджети! Спробуйте їх у налаштуваннях.",
    date: new Date(Date.now() - 86400000).toISOString(),
    isRead: true,
    priority: "low"
  },
  {
    id: "4",
    type: "PROJECT_MILESTONE",
    title: "Проєкт завершено",
    message: "Вітаємо! Проєкт 'E-commerce App' відмічено як виконаний.",
    date: new Date(Date.now() - 86400000 * 2).toISOString(),
    isRead: true,
    priority: "medium"
  }
];

const formatRelativeDate = (iso: string) => {
  const d = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffH = Math.floor(diffMs / 3600000);
  const diffD = Math.floor(diffMs / 86400000);
  if (diffH < 1) return "Тільки що";
  if (diffH < 24) return `${diffH}г тому`;
  if (diffD === 1) return "Вчора";
  return d.toLocaleDateString("uk-UA", { day: "numeric", month: "short" });
};

export function NotificationsSheet() {
  const [notifications, setNotifications] = React.useState<Notification[]>(MOCK_NOTIFICATIONS);
  const unreadCount = notifications.filter(n => !n.isRead).length;

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
  };

  const clearAll = () => {
    setNotifications([]);
  };

  const getIcon = (type: NotificationType) => {
    switch (type) {
      case "TASK_OVERDUE": return <AlertCircle className="h-3 w-3 text-destructive" />;
      case "FINANCE_ALERT": return <TrendingUp className="h-3 w-3 text-emerald-500" />;
      case "SYSTEM_UPDATE": return <Zap className="h-3 w-3 text-blue-500" />;
      case "PROJECT_MILESTONE": return <CheckCircle2 className="h-3 w-3 text-primary" />;
      default: return <Bell className="h-3 w-3 text-muted-foreground" />;
    }
  };

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" size="icon-lg" className="relative transition-all duration-300">
          <Bell className="h-4 w-4 text-muted-foreground" />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-destructive shadow-none border border-background" />
          )}
        </Button>
      </SheetTrigger>
      <SheetContent showCloseButton={false} className="w-[350px] sm:w-[400px] p-0 flex flex-col border-l outline-none">
        <div className="flex flex-col gap-4 p-4 pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h2 className="text-base font-semibold tracking-tight">Сповіщення</h2>
              {unreadCount > 0 && (
                <Badge variant="secondary" className="px-1 py-0 h-4 text-[9px] font-bold">
                  {unreadCount}
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-0.5">
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-7 w-7 text-muted-foreground" 
                onClick={markAllAsRead} 
                title="Прочитати все"
              >
                <CheckCheck className="h-3.5 w-3.5" />
              </Button>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-7 w-7 text-muted-foreground" 
                onClick={clearAll} 
                title="Очистити все"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
          <Separator className="opacity-50" />
        </div>

        <ScrollArea className="flex-1">
          <div className="px-4 pb-4 space-y-2">
             {notifications.length === 0 ? (
               <div className="flex flex-col items-center justify-center py-20 text-center text-muted-foreground">
                  <Bell className="h-8 w-8 opacity-20 mb-3" />
                  <p className="text-xs font-medium">Сповіщень немає</p>
               </div>
             ) : (
               notifications.map((n) => (
                 <div 
                   key={n.id} 
                   className={cn(
                     "relative flex gap-3 p-3 rounded-md border transition-all duration-200",
                     n.isRead 
                       ? "bg-transparent border-border/40 opacity-70" 
                       : "bg-accent/30 border-border/80 shadow-none"
                   )}
                 >
                    {!n.isRead && (
                       <span className="absolute top-3 right-3 h-1.5 w-1.5 rounded-full bg-destructive" />
                    )}
                    
                    <div className={cn(
                      "mt-0.5 h-7 w-7 rounded flex items-center justify-center shrink-0",
                      n.isRead ? "bg-muted/50" : "bg-background border shadow-none"
                    )}>
                      {getIcon(n.type)}
                    </div>
                    
                    <div className="flex-1 space-y-0.5 min-w-0">
                       <p className="text-[13px] font-semibold leading-none truncate pr-4">
                         {n.title}
                       </p>
                       <p className={cn(
                         "text-[12px] leading-snug line-clamp-2",
                         n.isRead ? "text-muted-foreground/60" : "text-muted-foreground"
                       )}>
                         {n.message}
                       </p>
                       <div className="flex items-center gap-1.5 pt-0.5 text-[10px] font-medium text-muted-foreground/50 uppercase tracking-tighter">
                          <Clock className="h-2.5 w-2.5" /> 
                          {formatRelativeDate(n.date)}
                       </div>
                    </div>
                 </div>
               ))
             )}
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
