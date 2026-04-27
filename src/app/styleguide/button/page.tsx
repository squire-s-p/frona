"use client"

import * as React from "react"
import Link from "next/link"
import { 
  ArrowUpRightIcon, 
  CircleFadingArrowUpIcon, 
  ArrowUpIcon,
  ArchiveIcon,
  ArrowLeftIcon,
  CalendarPlusIcon,
  ClockIcon,
  ListFilterIcon,
  MailCheckIcon,
  MoreHorizontalIcon,
  TagIcon,
  Trash2Icon,
  GitBranch,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { ButtonGroup } from "@/components/ui/button-group"
import { Spinner } from "@/components/ui/spinner"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export default function ButtonPage() {
  const [label, setLabel] = React.useState("personal")

  return (
    <div className="space-y-10 pr-10 pb-20">
      <div className="space-y-4">
        <h1 className="scroll-m-20 text-4xl font-bold tracking-tight lg:text-5xl text-foreground">
          Button
        </h1>
        <p className="text-lg text-muted-foreground">
          Displays a button or a component that looks like a button.
        </p>
        <div className="rounded-md bg-muted/50 p-4 border border-border/40 font-mono text-sm">
          npx shadcn@latest add button
        </div>
      </div>

      <div className="space-y-8">
        <section className="space-y-4">
          <h2 className="text-2xl font-bold tracking-tight text-foreground">Variants</h2>
          <div className="rounded-xl border border-border/40 bg-card p-6 shadow-sm flex flex-wrap gap-4 items-center justify-center">
            <Button>Default</Button>
            <Button variant="outline">Outline</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="destructive">Destructive</Button>
            <Button variant="ghost">Ghost</Button>
            <Button variant="link">Link</Button>
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-bold tracking-tight text-foreground">Sizes</h2>
          <div className="rounded-xl border border-border/40 bg-card p-6 shadow-sm flex flex-col gap-6 items-center justify-center">
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2">
                <Button size="xs" variant="outline">Extra Small</Button>
                <Button size="icon-xs" aria-label="Submit" variant="outline"><ArrowUpRightIcon /></Button>
              </div>
              <div className="flex items-center gap-2">
                <Button size="sm" variant="outline">Small</Button>
                <Button size="icon-sm" aria-label="Submit" variant="outline"><ArrowUpRightIcon /></Button>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline">Default</Button>
                <Button size="icon" aria-label="Submit" variant="outline"><ArrowUpRightIcon /></Button>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="lg">Large</Button>
                <Button size="icon-lg" aria-label="Submit" variant="outline"><ArrowUpRightIcon /></Button>
              </div>
            </div>
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-bold tracking-tight text-foreground">Icons & Media</h2>
          <div className="rounded-xl border border-border/40 bg-card p-6 shadow-sm flex flex-wrap gap-4 items-center justify-center">
            <Button variant="outline" size="icon">
              <CircleFadingArrowUpIcon />
            </Button>
            <Button variant="outline" size="sm">
              <GitBranch /> New Branch
            </Button>
            <Button variant="outline" size="icon" className="rounded-full">
              <ArrowUpIcon />
            </Button>
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-bold tracking-tight text-foreground">Spinner / Loading</h2>
          <div className="rounded-xl border border-border/40 bg-card p-6 shadow-sm flex flex-wrap gap-4 items-center justify-center">
            <Button variant="outline" disabled>
              <Spinner data-icon="inline-start" />
              Generating
            </Button>
            <Button variant="secondary" disabled>
              Downloading
              <Spinner data-icon="inline-start" />
            </Button>
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-bold tracking-tight text-foreground">Button Group</h2>
          <div className="rounded-xl border border-border/40 bg-card p-6 shadow-sm flex flex-col gap-6 items-center justify-center">
            <ButtonGroup>
              <ButtonGroup className="hidden sm:flex">
                <Button variant="outline" size="icon" aria-label="Go Back">
                  <ArrowLeftIcon />
                </Button>
              </ButtonGroup>
              <ButtonGroup>
                <Button variant="outline">Archive</Button>
                <Button variant="outline">Report</Button>
              </ButtonGroup>
              <ButtonGroup>
                <Button variant="outline">Snooze</Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="icon" aria-label="More Options">
                      <MoreHorizontalIcon />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-40">
                    <DropdownMenuGroup>
                      <DropdownMenuItem>
                        <MailCheckIcon />
                        Mark as Read
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <ArchiveIcon />
                        Archive
                      </DropdownMenuItem>
                    </DropdownMenuGroup>
                    <DropdownMenuSeparator />
                    <DropdownMenuGroup>
                      <DropdownMenuItem>
                        <ClockIcon />
                        Snooze
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <CalendarPlusIcon />
                        Add to Calendar
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <ListFilterIcon />
                        Add to List
                      </DropdownMenuItem>
                      <DropdownMenuSub>
                        <DropdownMenuSubTrigger>
                          <TagIcon />
                          Label As...
                        </DropdownMenuSubTrigger>
                        <DropdownMenuSubContent>
                          <DropdownMenuRadioGroup
                            value={label}
                            onValueChange={setLabel}
                          >
                            <DropdownMenuRadioItem value="personal">
                              Personal
                            </DropdownMenuRadioItem>
                            <DropdownMenuRadioItem value="work">
                              Work
                            </DropdownMenuRadioItem>
                            <DropdownMenuRadioItem value="other">
                              Other
                            </DropdownMenuRadioItem>
                          </DropdownMenuRadioGroup>
                        </DropdownMenuSubContent>
                      </DropdownMenuSub>
                    </DropdownMenuGroup>
                    <DropdownMenuSeparator />
                    <DropdownMenuGroup>
                      <DropdownMenuItem variant="destructive">
                        <Trash2Icon />
                        Trash
                      </DropdownMenuItem>
                    </DropdownMenuGroup>
                  </DropdownMenuContent>
                </DropdownMenu>
              </ButtonGroup>
            </ButtonGroup>
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-bold tracking-tight text-foreground">As Child (Next.js Link)</h2>
          <div className="rounded-xl border border-border/40 bg-card p-6 shadow-sm flex items-center justify-center">
            <Button asChild>
              <Link href="/login">Login</Link>
            </Button>
          </div>
        </section>
      </div>
    </div>
  )
}
