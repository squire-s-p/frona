"use client";

import * as React from "react";
import { useSound } from "@/modules/sound/components/SoundProvider";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Volume2, VolumeX, Music, Coffee, Wind } from "lucide-react";
import { cn } from "@/lib/utils";

export function SoundsForm() {
  const { state, setEnabled, setVolume, setSelectedMode } = useSound();

  return (
    <div className="space-y-6">
      <Card className="rounded-2xl border-border/50 bg-card/50 backdrop-blur-sm shadow-sm overflow-hidden">
        <CardHeader className="border-b bg-muted/10">
          <CardTitle className="text-xl">Аудіо-атмосфера</CardTitle>
          <CardDescription>
            Керуйте звуковим супроводом для кращої концентрації під час роботи
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6 space-y-8">
          <div className="flex items-center justify-between group">
            <div className="space-y-1">
              <Label className="text-base flex items-center gap-2 cursor-pointer">
                {state.enabled ? <Volume2 className="h-4 w-4 text-primary" /> : <VolumeX className="h-4 w-4 text-muted-foreground" />}
                Фонові звуки активні
              </Label>
              <p className="text-sm text-muted-foreground font-light">Відтворювати обрану атмфосферу автоматично</p>
            </div>
            <Switch 
              checked={state.enabled}
              onCheckedChange={setEnabled}
              className="data-[state=checked]:bg-primary transition-all group-hover:scale-105" 
            />
          </div>

          <div className="space-y-4 pt-2">
            <div className="flex justify-between items-center">
              <Label className="text-sm font-medium">Загальна гучність</Label>
              <span className="text-xs font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                {Math.round(state.volume * 100)}%
              </span>
            </div>
            <Slider
              value={[state.volume * 100]}
              max={100}
              step={1}
              onValueChange={(val) => setVolume(val[0] / 100)}
              className="py-4"
            />
          </div>

          <div className="space-y-4">
            <Label className="text-sm font-medium">Вибір атмосфери</Label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[
                { id: "focus", label: "Фокус", icon: Music, desc: "Глибока робота" },
                { id: "relax", label: "Релакс", icon: Coffee, desc: "Спокійний ритм" },
                { id: "study", label: "Навчання", icon: Wind, desc: "Природні шуми" },
              ].map((mode) => (
                <button
                  key={mode.id}
                  onClick={() => setSelectedMode(mode.id as any)}
                  className={cn(
                    "relative flex flex-col items-center gap-3 rounded-xl p-4 border transition-all text-center group",
                    state.selectedModeId === mode.id 
                      ? "border-primary bg-primary/5 shadow-inner" 
                      : "border-border bg-background/50 hover:bg-muted/50"
                  )}
                >
                  <div className={cn(
                    "h-10 w-10 rounded-full flex items-center justify-center transition-transform group-hover:scale-110",
                    state.selectedModeId === mode.id ? "bg-primary text-primary-foreground shadow-lg" : "bg-muted text-muted-foreground"
                  )}>
                    <mode.icon className="h-5 w-5" />
                  </div>
                  <div>
                    <div className={cn("text-xs font-bold uppercase tracking-wider", state.selectedModeId === mode.id ? "text-primary" : "text-muted-foreground")}>
                      {mode.label}
                    </div>
                    <div className="text-[10px] text-muted-foreground mt-0.5">{mode.desc}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
