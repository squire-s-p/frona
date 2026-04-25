"use client";

import { PlusIcon } from "lucide-react";
import {
  Avatar,
  AvatarBadge,
  AvatarFallback,
  AvatarImage,
  AvatarGroup,
  AvatarGroupCount,
} from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

function AvatarDemo() {
  return (
    <Avatar>
      <AvatarImage
        src="https://github.com/shadcn.png"
        alt="@shadcn"
        className="grayscale"
      />
      <AvatarFallback>CN</AvatarFallback>
    </Avatar>
  );
}

function AvatarWithBadge() {
  return (
    <Avatar>
      <AvatarImage src="https://github.com/shadcn.png" alt="@shadcn" />
      <AvatarFallback>CN</AvatarFallback>
      <AvatarBadge className="bg-green-600 dark:bg-green-800" />
    </Avatar>
  );
}

function AvatarBadgeIconExample() {
  return (
    <Avatar className="grayscale">
      <AvatarImage src="https://github.com/pranathip.png" alt="@pranathip" />
      <AvatarFallback>PP</AvatarFallback>
      <AvatarBadge>
        <PlusIcon className="size-3" />
      </AvatarBadge>
    </Avatar>
  );
}

function AvatarGroupExample() {
  return (
    <AvatarGroup className="grayscale">
      <Avatar>
        <AvatarImage src="https://github.com/shadcn.png" alt="@shadcn" />
        <AvatarFallback>CN</AvatarFallback>
      </Avatar>
      <Avatar>
        <AvatarImage src="https://github.com/maxleiter.png" alt="@maxleiter" />
        <AvatarFallback>LR</AvatarFallback>
      </Avatar>
      <Avatar>
        <AvatarImage
          src="https://github.com/evilrabbit.png"
          alt="@evilrabbit"
        />
        <AvatarFallback>ER</AvatarFallback>
      </Avatar>
    </AvatarGroup>
  );
}

function AvatarGroupCountExample() {
  return (
    <AvatarGroup className="grayscale">
      <Avatar>
        <AvatarImage src="https://github.com/shadcn.png" alt="@shadcn" />
        <AvatarFallback>CN</AvatarFallback>
      </Avatar>
      <Avatar>
        <AvatarImage src="https://github.com/maxleiter.png" alt="@maxleiter" />
        <AvatarFallback>LR</AvatarFallback>
      </Avatar>
      <Avatar>
        <AvatarImage
          src="https://github.com/evilrabbit.png"
          alt="@evilrabbit"
        />
        <AvatarFallback>ER</AvatarFallback>
      </Avatar>
      <AvatarGroupCount>+3</AvatarGroupCount>
    </AvatarGroup>
  );
}

function AvatarGroupCountIconExample() {
  return (
    <AvatarGroup className="grayscale">
      <Avatar>
        <AvatarImage src="https://github.com/shadcn.png" alt="@shadcn" />
        <AvatarFallback>CN</AvatarFallback>
      </Avatar>
      <Avatar>
        <AvatarImage src="https://github.com/maxleiter.png" alt="@maxleiter" />
        <AvatarFallback>LR</AvatarFallback>
      </Avatar>
      <Avatar>
        <AvatarImage
          src="https://github.com/evilrabbit.png"
          alt="@evilrabbit"
        />
        <AvatarFallback>ER</AvatarFallback>
      </Avatar>
      <AvatarGroupCount>
        <PlusIcon className="size-4" />
      </AvatarGroupCount>
    </AvatarGroup>
  );
}

function AvatarSizeExample() {
  return (
    <div className="flex flex-wrap items-center gap-4 grayscale">
      <Avatar size="sm">
        <AvatarImage src="https://github.com/shadcn.png" alt="@shadcn" />
        <AvatarFallback>CN</AvatarFallback>
      </Avatar>
      <Avatar>
        <AvatarImage src="https://github.com/shadcn.png" alt="@shadcn" />
        <AvatarFallback>CN</AvatarFallback>
      </Avatar>
      <Avatar size="lg">
        <AvatarImage src="https://github.com/shadcn.png" alt="@shadcn" />
        <AvatarFallback>CN</AvatarFallback>
      </Avatar>
    </div>
  );
}

function AvatarDropdown() {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="rounded-full">
          <Avatar>
            <AvatarImage src="https://github.com/shadcn.png" alt="shadcn" />
            <AvatarFallback>CN</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-32">
        <DropdownMenuGroup>
          <DropdownMenuItem>Profile</DropdownMenuItem>
          <DropdownMenuItem>Billing</DropdownMenuItem>
          <DropdownMenuItem>Settings</DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem variant="destructive">Log out</DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export default function AvatarPage() {
  return (
    <div className="space-y-10 pr-10 pb-20">
      <div className="space-y-4">
        <h1 className="scroll-m-20 text-4xl font-extrabold tracking-tight lg:text-5xl text-foreground">
          Avatar
        </h1>
        <p className="text-lg text-muted-foreground">
          An image element with a fallback for representing the user.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
        <section className="space-y-4">
          <h2 className="text-2xl font-bold">Default</h2>
          <AvatarDemo />
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-bold">With Badge</h2>
          <div className="flex gap-4">
            <AvatarWithBadge />
            <AvatarBadgeIconExample />
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-bold">Group</h2>
          <AvatarGroupExample />
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-bold">Group with Count</h2>
          <div className="flex flex-col gap-4">
            <AvatarGroupCountExample />
            <AvatarGroupCountIconExample />
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-bold">Sizes</h2>
          <AvatarSizeExample />
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-bold">In Dropdown</h2>
          <AvatarDropdown />
        </section>
      </div>
    </div>
  );
}
