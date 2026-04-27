"use client";

import * as React from "react";
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Check, Sun, Moon, Laptop } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";

export function AppearanceForm() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);
  const [accent, setAccent] = React.useState("zinc");
  const [compactMode, setCompactMode] = React.useState(false);
  const [timeFormat24, setTimeFormat24] = React.useState(true);

  // Avoid hydration mismatch
  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <div className="space-y-6">
      <Card className="rounded-2xl border-border/50 bg-card/50 backdrop-blur-sm shadow-none overflow-hidden">
        <CardHeader className="border-b bg-muted/10">
          <CardTitle className="text-xl">Дизайн і Тема</CardTitle>
          <CardDescription>
            Налаштуйте візуальний стиль під свій настрій та умови освітлення
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6 space-y-8">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {[
              { id: "light", label: "Світла", icon: Sun, color: "bg-white", shadow: "shadow-none" },
              { id: "dark", label: "Темна", icon: Moon, color: "bg-slate-950", shadow: "shadow-none" },
              { id: "system", label: "Системна", icon: Laptop, color: "bg-gradient-to-br from-white to-slate-900", shadow: "shadow-none" },
            ].map((th) => (
              <button
                key={th.id}
                type="button"
                onClick={() => setTheme(th.id)}
                className={cn(
                  buttonVariants({ variant: "outline" }),
                  "group h-auto w-full flex-col items-center gap-3 rounded-2xl p-3 border-2 transition-all hover:bg-muted/40",
                  theme === th.id ? "border-primary bg-primary/5" : "border-transparent"
                )}
              >
                <div className={cn(
                  "h-32 w-full rounded-xl flex flex-col p-3 transition-transform group-hover:scale-[1.02] border relative overflow-hidden",
                  th.color,
                  th.shadow,
                  th.id === "dark" ? "border-slate-800" : "border-slate-200"
                )}>
                  {theme === th.id && (
                    <div className="absolute top-2 right-2 h-5 w-5 rounded-full bg-primary flex items-center justify-center shadow-none animate-in zoom-in-50 duration-300">
                      <Check className="h-3 w-3 text-primary-foreground stroke-[3]" />
                    </div>
                  )}
                  <div className="flex gap-1.5 mb-2">
                    <div className="h-1.5 w-1.5 rounded-full bg-red-400/50" />
                    <div className="h-1.5 w-1.5 rounded-full bg-yellow-400/50" />
                    <div className="h-1.5 w-1.5 rounded-full bg-green-400/50" />
                  </div>
                  <div className="space-y-2 mt-auto">
                    <div className="h-2 w-3/4 rounded bg-muted/20" />
                    <div className="h-2 w-full rounded bg-muted/10" />
                    <div className={cn("h-2 w-1/2 rounded", th.id === "dark" ? "bg-primary/20" : "bg-primary/40")} />
                  </div>
                </div>
                <div className="flex items-center gap-2">
                   <th.icon className={cn("h-3.5 w-3.5", theme === th.id ? "text-primary" : "text-muted-foreground")} />
                   <span className={cn("text-sm font-semibold", theme === th.id ? "text-foreground" : "text-muted-foreground")}>
                     {th.label}
                   </span>
                </div>
              </button>
            ))}
          </div>
          
          <Separator border-dashed className="opacity-50" />

          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Кольоровий акцент</h3>
            <div className="flex flex-wrap gap-4">
              {[
                { id: "zinc", name: "Zinc", color: "bg-zinc-900 dark:bg-zinc-100" },
                { id: "blue", name: "Blue", color: "bg-blue-600 dark:bg-blue-500" },
                { id: "emerald", name: "Emerald", color: "bg-emerald-600 dark:bg-emerald-500" },
                { id: "rose", name: "Rose", color: "bg-rose-600 dark:bg-rose-500" },
                { id: "violet", name: "Violet", color: "bg-violet-600 dark:bg-violet-500" },
              ].map((acc) => (
                <button
                  key={acc.id}
                  type="button"
                  onClick={() => setAccent(acc.id)}
                  className={cn(
                    buttonVariants({ variant: "ghost", size: "sm" }),
                    "group h-auto flex-col items-center gap-2 px-0 py-0"
                  )}
                >
                  <div className={cn(
                    "w-10 h-10 rounded-full border-2 flex items-center justify-center transition-transform hover:scale-110",
                    accent === acc.id ? "border-primary" : "border-transparent",
                    acc.color
                  )}>
                    {accent === acc.id && <Check className="h-4 w-4 text-primary-foreground stroke-[3]" />}
                  </div>
                  <span className={cn(
                    "text-xs font-medium group-hover:text-foreground",
                    accent === acc.id ? "text-foreground" : "text-muted-foreground"
                  )}>{acc.name}</span>
                </button>
              ))}
            </div>
          </div>

          <Separator border-dashed className="opacity-50" />

          <div className="space-y-6">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Параметри відображення</h3>
            
            <div className="flex items-center justify-between group">
              <div className="space-y-1">
                <Label className="text-base cursor-pointer" onClick={() => setCompactMode(!compactMode)}>Компактний режим</Label>
                <p className="text-sm text-muted-foreground">Зменшує вертикальні відступи для відображення більшої кількості даних на екрані</p>
              </div>
              <Switch checked={compactMode} onCheckedChange={setCompactMode} className="transition-all group-hover:scale-105" />
            </div>

            <Separator border-dashed className="opacity-30" />

            <div className="flex items-center justify-between group">
              <div className="space-y-1">
                <Label className="text-base cursor-pointer" onClick={() => setTimeFormat24(!timeFormat24)}>24-годинний формат часу</Label>
                <p className="text-sm text-muted-foreground">Використовувати 24-годинний формат (14:30) замість 12-годинного (2:30 PM)</p>
              </div>
              <Switch checked={timeFormat24} onCheckedChange={setTimeFormat24} className="transition-all group-hover:scale-105" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
