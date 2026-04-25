import { ArrowUpRightIcon, CircleFadingArrowUpIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ButtonPage() {
  return (
    <div className="space-y-10 pr-10 pb-20">
      <div className="space-y-4">
        <h1 className="scroll-m-20 text-4xl font-extrabold tracking-tight lg:text-5xl text-foreground">
          Button
        </h1>
        <p className="text-lg text-muted-foreground">
          Displays a button or a component that looks like a button.
        </p>
      </div>

      <div className="space-y-4">
        <h2 className="scroll-m-20 border-b pb-2 text-3xl font-semibold tracking-tight transition-colors first:mt-0 text-foreground">
          Variants
        </h2>
        <div className="rounded-xl border border-border/40 bg-card p-6 shadow-sm flex items-center justify-center">
          <div className="flex flex-wrap gap-4">
            <Button>Default</Button>
            <Button variant="outline">Outline</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="destructive">Destructive</Button>
            <Button variant="ghost">Ghost</Button>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="scroll-m-20 border-b pb-2 text-3xl font-semibold tracking-tight transition-colors first:mt-0 text-foreground">
          Sizes & Icons
        </h2>
        <div className="rounded-xl border border-border/40 bg-card p-6 shadow-sm flex items-center justify-center">
          <div className="flex flex-col items-start gap-8 sm:flex-row">
            <div className="flex items-start gap-2">
              <Button size="sm" variant="outline">
                Small
              </Button>
              <Button size="icon" aria-label="Submit" variant="outline" className="h-9 w-9">
                <ArrowUpRightIcon className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex items-start gap-2">
              <Button variant="outline">Default</Button>
              <Button size="icon" aria-label="Submit" variant="outline">
                <ArrowUpRightIcon />
              </Button>
            </div>
            <div className="flex items-start gap-2">
              <Button variant="outline" size="lg">
                Large
              </Button>
              <Button size="icon" aria-label="Submit" variant="outline" className="h-11 w-11">
                <ArrowUpRightIcon className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="scroll-m-20 border-b pb-2 text-3xl font-semibold tracking-tight transition-colors first:mt-0 text-foreground">
          Icon Button
        </h2>
        <div className="rounded-xl border border-border/40 bg-card p-6 shadow-sm flex items-center justify-center">
          <Button variant="outline" size="icon">
            <CircleFadingArrowUpIcon />
          </Button>
        </div>
      </div>
    </div>
  );
}
