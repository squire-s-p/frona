"use client"

import { Toaster as Sonner } from "sonner"
import { useTheme } from "next-themes"

export function Toaster() {
  const { theme = "system" } = useTheme()

  return (
    <Sonner
      theme={theme as "light" | "dark" | "system"}
      position="top-center"
      className="sonner-toaster"
      toastOptions={{
        className:
          "rounded-xl border bg-background text-foreground shadow-lg",
        descriptionClassName: "text-muted-foreground",
        duration: 8000,
      }}
    />
  )
}
