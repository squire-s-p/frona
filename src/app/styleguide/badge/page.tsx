"use client"

import { BadgeCheck, BookmarkIcon, ArrowUpRightIcon } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Spinner } from "@/components/ui/spinner"

export default function BadgePage() {
  return (
    <div className="space-y-10 pr-10 pb-20">
      <div className="space-y-4">
        <h1 className="scroll-m-20 text-4xl font-bold tracking-tight lg:text-5xl text-foreground">
          Badge
        </h1>
        <p className="text-lg text-muted-foreground">
          Displays a badge or a component that looks like a badge.
        </p>
        <div className="rounded-md bg-muted/50 p-4 border border-border/40 font-mono text-sm">
          npx shadcn@latest add badge
        </div>
      </div>

      <div className="space-y-8">
        <section className="space-y-4">
          <h2 className="text-2xl font-bold tracking-tight text-foreground">Variants</h2>
          <div className="rounded-xl border border-border/40 bg-card p-6 shadow-sm flex items-center justify-center">
            <div className="flex flex-wrap gap-2">
              <Badge>Default</Badge>
              <Badge variant="secondary">Secondary</Badge>
              <Badge variant="destructive">Destructive</Badge>
              <Badge variant="outline">Outline</Badge>
              <Badge variant="ghost">Ghost</Badge>
            </div>
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-bold tracking-tight text-foreground">With Icon</h2>
          <div className="rounded-xl border border-border/40 bg-card p-6 shadow-sm flex items-center justify-center">
            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary">
                <BadgeCheck data-icon="inline-start" />
                Verified
              </Badge>
              <Badge variant="outline">
                Bookmark
                <BookmarkIcon data-icon="inline-end" />
              </Badge>
            </div>
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-bold tracking-tight text-foreground">With Spinner</h2>
          <div className="rounded-xl border border-border/40 bg-card p-6 shadow-sm flex items-center justify-center">
            <div className="flex flex-wrap gap-2">
              <Badge variant="destructive">
                <Spinner data-icon="inline-start" />
                Deleting
              </Badge>
              <Badge variant="secondary">
                Generating
                <Spinner data-icon="inline-end" />
              </Badge>
            </div>
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-bold tracking-tight text-foreground">Link</h2>
          <div className="rounded-xl border border-border/40 bg-card p-6 shadow-sm flex items-center justify-center">
            <Badge asChild>
              <a href="#link">
                Open Link <ArrowUpRightIcon data-icon="inline-end" />
              </a>
            </Badge>
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-bold tracking-tight text-foreground">Custom Colors</h2>
          <div className="rounded-xl border border-border/40 bg-card p-6 shadow-sm flex items-center justify-center">
            <div className="flex flex-wrap gap-2">
              <Badge className="bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300 border-transparent shadow-none">
                Blue
              </Badge>
              <Badge className="bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300 border-transparent shadow-none">
                Green
              </Badge>
              <Badge className="bg-sky-50 text-sky-700 dark:bg-sky-950 dark:text-sky-300 border-transparent shadow-none">
                Sky
              </Badge>
              <Badge className="bg-purple-50 text-purple-700 dark:bg-purple-950 dark:text-purple-300 border-transparent shadow-none">
                Purple
              </Badge>
              <Badge className="bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300 border-transparent shadow-none">
                Red
              </Badge>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}
