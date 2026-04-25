import { BadgeCheck, BookmarkIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function BadgePage() {
  return (
    <div className="space-y-10 pr-10">
      <div className="space-y-4">
        <h1 className="scroll-m-20 text-4xl font-extrabold tracking-tight lg:text-5xl text-foreground">
          Badge
        </h1>
        <p className="text-lg text-muted-foreground">
          Displays a badge or a component that looks like a badge.
        </p>
      </div>

      <div className="space-y-4">
        <h2 className="scroll-m-20 border-b pb-2 text-3xl font-semibold tracking-tight transition-colors first:mt-0 text-foreground">
          Variants
        </h2>
        <div className="rounded-xl border border-border/40 bg-card p-6 shadow-sm flex items-center justify-center">
          <div className="flex flex-wrap gap-2">
            <Badge>Default</Badge>
            <Badge variant="secondary">Secondary</Badge>
            <Badge variant="destructive">Destructive</Badge>
            <Badge variant="outline">Outline</Badge>
            <Badge variant="ghost">Ghost</Badge>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="scroll-m-20 border-b pb-2 text-3xl font-semibold tracking-tight transition-colors first:mt-0 text-foreground">
          With Icons
        </h2>
        <div className="rounded-xl border border-border/40 bg-card p-6 shadow-sm flex items-center justify-center">
          <div className="flex flex-wrap gap-2">
            <Badge variant="secondary" className="gap-1 px-2.5">
              <BadgeCheck className="h-3 w-3" />
              Verified
            </Badge>
            <Badge variant="outline" className="gap-1 px-2.5">
              Bookmark
              <BookmarkIcon className="h-3 w-3" />
            </Badge>
          </div>
        </div>
      </div>
    </div>
  );
}
