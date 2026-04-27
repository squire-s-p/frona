"use client"

import * as React from "react"
import {
  ArchiveIcon,
  ArrowLeftIcon,
  CalendarPlusIcon,
  ClockIcon,
  ListFilterIcon,
  MailCheckIcon,
  MoreHorizontalIcon,
  TagIcon,
  Trash2Icon,
  PlusIcon,
  MinusIcon,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { ButtonGroup } from "@/components/ui/button-group"
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

export default function ButtonGroupPage() {
  const [label, setLabel] = React.useState("personal")

  return (
    <div className="space-y-10 pr-10 pb-20">
      <div className="space-y-4">
        <h1 className="scroll-m-20 text-4xl font-bold tracking-tight lg:text-5xl text-foreground">
          Button Group
        </h1>
        <p className="text-lg text-muted-foreground">
          Group a series of buttons together on a single line or stack them in a vertical column.
        </p>
      </div>

      <div className="space-y-8">
        <section className="space-y-4">
          <h2 className="text-2xl font-bold tracking-tight text-foreground">Basic Example</h2>
          <div className="rounded-xl border border-border/40 bg-card p-6 shadow-sm flex items-center justify-center">
            <ButtonGroup>
              <Button variant="outline">Archive</Button>
              <Button variant="outline">Report</Button>
            </ButtonGroup>
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-bold tracking-tight text-foreground">Complex Demo</h2>
          <div className="rounded-xl border border-border/40 bg-card p-6 shadow-sm flex items-center justify-center">
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
          <h2 className="text-2xl font-bold tracking-tight text-foreground">Vertical</h2>
          <div className="rounded-xl border border-border/40 bg-card p-6 shadow-sm flex items-center justify-center">
            <ButtonGroup orientation="vertical">
              <Button variant="outline" size="icon" aria-label="Zoom In">
                <PlusIcon />
              </Button>
              <Button variant="outline" size="icon" aria-label="Zoom Out">
                <MinusIcon />
              </Button>
            </ButtonGroup>
          </div>
        </section>
      </div>
    </div>
  )
}
