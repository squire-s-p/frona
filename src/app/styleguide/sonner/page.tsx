"use client";

import { toast } from "sonner";
import { Button } from "@/components/ui/button";

export default function SonnerPage() {
  return (
    <div className="space-y-10 pr-10 pb-20">
      <div className="space-y-4">
        <h1 className="scroll-m-20 text-4xl font-bold tracking-tight lg:text-5xl text-foreground">
          Sonner
        </h1>
        <p className="text-lg text-muted-foreground">
          An opinionated toast component for React.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <h2 className="scroll-m-20 border-b pb-2 text-2xl font-semibold tracking-tight transition-colors first:mt-0 text-foreground">
            Basic
          </h2>
          <div className="rounded-xl border border-border/40 bg-card p-6 shadow-sm flex items-center justify-center min-h-[150px]">
            <Button
              variant="outline"
              onClick={() =>
                toast("Event has been created", {
                  description: "Sunday, December 03, 2023 at 9:00 AM",
                  action: {
                    label: "Undo",
                    onClick: () => console.log("Undo"),
                  },
                })
              }
            >
              Show Toast
            </Button>
          </div>
        </div>

        <div className="space-y-4">
          <h2 className="scroll-m-20 border-b pb-2 text-2xl font-semibold tracking-tight transition-colors first:mt-0 text-foreground">
            Description
          </h2>
          <div className="rounded-xl border border-border/40 bg-card p-6 shadow-sm flex items-center justify-center min-h-[150px]">
            <Button
              onClick={() =>
                toast("Event has been created", {
                  description: "Monday, January 3rd at 6:00pm",
                })
              }
              variant="outline"
            >
              Show Toast
            </Button>
          </div>
        </div>

        <div className="space-y-4 md:col-span-2">
          <h2 className="scroll-m-20 border-b pb-2 text-2xl font-semibold tracking-tight transition-colors first:mt-0 text-foreground">
            Types
          </h2>
          <div className="rounded-xl border border-border/40 bg-card p-6 shadow-sm flex items-center justify-center min-h-[150px]">
            <div className="flex flex-wrap justify-center gap-2">
              <Button variant="outline" onClick={() => toast("Event has been created")}>
                Default
              </Button>
              <Button
                variant="outline"
                onClick={() => toast.success("Event has been created")}
              >
                Success
              </Button>
              <Button
                variant="outline"
                onClick={() =>
                  toast.info("Be at the area 10 minutes before the event time")
                }
              >
                Info
              </Button>
              <Button
                variant="outline"
                onClick={() =>
                  toast.warning("Event start time cannot be earlier than 8am")
                }
              >
                Warning
              </Button>
              <Button
                variant="outline"
                onClick={() => toast.error("Event has not been created")}
              >
                Error
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  toast.promise<{ name: string }>(
                    () =>
                      new Promise((resolve) =>
                        setTimeout(() => resolve({ name: "Event" }), 2000)
                      ),
                    {
                      loading: "Loading...",
                      success: (data) => `${data.name} has been created`,
                      error: "Error",
                    }
                  );
                }}
              >
                Promise
              </Button>
            </div>
          </div>
        </div>

        <div className="space-y-4 md:col-span-2">
          <h2 className="scroll-m-20 border-b pb-2 text-2xl font-semibold tracking-tight transition-colors first:mt-0 text-foreground">
            Position
          </h2>
          <div className="rounded-xl border border-border/40 bg-card p-6 shadow-sm flex items-center justify-center min-h-[200px]">
            <div className="flex flex-wrap justify-center gap-2">
              <Button
                variant="outline"
                onClick={() =>
                  toast("Event has been created", { position: "top-left" })
                }
              >
                Top Left
              </Button>
              <Button
                variant="outline"
                onClick={() =>
                  toast("Event has been created", { position: "top-center" })
                }
              >
                Top Center
              </Button>
              <Button
                variant="outline"
                onClick={() =>
                  toast("Event has been created", { position: "top-right" })
                }
              >
                Top Right
              </Button>
              <Button
                variant="outline"
                onClick={() =>
                  toast("Event has been created", { position: "bottom-left" })
                }
              >
                Bottom Left
              </Button>
              <Button
                variant="outline"
                onClick={() =>
                  toast("Event has been created", { position: "bottom-center" })
                }
              >
                Bottom Center
              </Button>
              <Button
                variant="outline"
                onClick={() =>
                  toast("Event has been created", { position: "bottom-right" })
                }
              >
                Bottom Right
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
