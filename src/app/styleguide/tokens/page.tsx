"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

const neutralPalette = [
  { name: "50", oklch: "oklch(98.5% 0 0)", class: "bg-neutral-50" },
  { name: "100", oklch: "oklch(97% 0 0)", class: "bg-neutral-100" },
  { name: "200", oklch: "oklch(92.2% 0 0)", class: "bg-neutral-200" },
  { name: "300", oklch: "oklch(86.9% 0.005 56.366)", class: "bg-neutral-300" },
  { name: "400", oklch: "oklch(70.8% 0 0)", class: "bg-neutral-400" },
  { name: "500", oklch: "oklch(55.6% 0 0)", class: "bg-neutral-500" },
  { name: "600", oklch: "oklch(43.9% 0 0)", class: "bg-neutral-600" },
  { name: "700", oklch: "oklch(37.1% 0 0)", class: "bg-neutral-700" },
  { name: "800", oklch: "oklch(26.9% 0 0)", class: "bg-neutral-800" },
  { name: "900", oklch: "oklch(20.5% 0 0)", class: "bg-neutral-900" },
  { name: "950", oklch: "oklch(14.5% 0 0)", class: "bg-neutral-950" },
];

const brandColors = [
  { name: "Primary", variable: "--primary", oklch: "oklch(0.21 0.034 264.665)", class: "bg-primary text-primary-foreground" },
  { name: "Secondary", variable: "--secondary", oklch: "oklch(0.967 0.003 264.542)", class: "bg-secondary text-secondary-foreground border" },
  { name: "Accent", variable: "--accent", oklch: "oklch(0.967 0.003 264.542)", class: "bg-accent text-accent-foreground border" },
  { name: "Destructive", variable: "--destructive", oklch: "oklch(0.577 0.245 27.325)", class: "bg-destructive text-white" },
];

const radii = [
  { name: "Radius (Base)", variable: "--radius", value: "0.625rem (10px)" },
  { name: "Small", variable: "--radius-sm", value: "6px" },
  { name: "Medium", variable: "--radius-md", value: "8px" },
  { name: "Large", variable: "--radius-lg", value: "10px" },
  { name: "XL", variable: "--radius-xl", value: "14px" },
  { name: "2XL", variable: "--radius-2xl", value: "18px" },
  { name: "3XL", variable: "--radius-3xl", value: "22px" },
];

export default function DesignTokensPage() {
  return (
    <div className="space-y-10 pr-10 pb-20">
      <div className="space-y-4">
        <h1 className="scroll-m-20 text-4xl font-bold tracking-tight lg:text-5xl text-foreground">
          Design Tokens
        </h1>
        <p className="text-lg text-muted-foreground">
          Кольорова палітра, заокруглення та інші системні константи дизайну.
        </p>
      </div>

      <Separator />

      {/* Neutral Palette */}
      <section className="space-y-6">
        <div className="space-y-1">
          <h2 className="text-2xl font-bold tracking-tight">Нейтральна палітра</h2>
          <p className="text-muted-foreground">
            Використовується для фонів, кордонів та тексту. Стиль: <strong>Neutral</strong>.
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {neutralPalette.map((color) => (
            <Card key={color.name} className="overflow-hidden border-border/40 shadow-sm">
              <div className={`h-20 w-full ${color.class}`} />
              <CardHeader className="p-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-bold">Neutral {color.name}</CardTitle>
                  <span className="text-[10px] font-mono text-muted-foreground">OKLCH</span>
                </div>
                <CardDescription className="text-[11px] font-mono mt-1">
                  {color.oklch}
                </CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>
      </section>

      <Separator />

      {/* Brand & Functional Colors */}
      <section className="space-y-6">
        <div className="space-y-1">
          <h2 className="text-2xl font-bold tracking-tight">Функціональні кольори</h2>
          <p className="text-muted-foreground">
            Основні кольори бренду та системні стани.
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {brandColors.map((color) => (
            <Card key={color.name} className="overflow-hidden border-border/40 shadow-sm flex items-center">
              <div className={`h-full w-24 shrink-0 flex items-center justify-center text-xs font-bold ${color.class}`}>
                Sample
              </div>
              <CardHeader className="p-4">
                <CardTitle className="text-sm font-bold">{color.name}</CardTitle>
                <CardDescription className="text-[11px] font-mono">
                  {color.variable}
                  <br />
                  {color.oklch}
                </CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>
      </section>

      <Separator />

      {/* Border Radius */}
      <section className="space-y-6">
        <div className="space-y-1">
          <h2 className="text-2xl font-bold tracking-tight">Заокруглення (Radius)</h2>
          <p className="text-muted-foreground">
            Масштабована система радіусів для контейнерів та елементів.
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {radii.map((radius) => (
            <Card key={radius.name} className="border-border/40 shadow-sm">
              <CardHeader className="p-4">
                <div 
                  className="h-12 w-12 bg-muted border border-border mb-3" 
                  style={{ borderRadius: radius.variable === "--radius" ? "0.625rem" : `var(${radius.variable})` }}
                />
                <CardTitle className="text-xs font-bold">{radius.name}</CardTitle>
                <CardDescription className="text-[11px] font-mono">
                  {radius.value}
                </CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
}
