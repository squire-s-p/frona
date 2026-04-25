import { BluetoothIcon, Trash2Icon } from "lucide-react";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";

export default function AlertDialogPage() {
  return (
    <div className="space-y-10 pr-10 pb-20">
      <div className="space-y-4">
        <h1 className="scroll-m-20 text-4xl font-extrabold tracking-tight lg:text-5xl text-foreground">
          Alert Dialog
        </h1>
        <p className="text-lg text-muted-foreground">
          A modal dialog that interrupts the user with important content and expects a response.
        </p>
      </div>

      <div className="space-y-4">
        <h2 className="scroll-m-20 border-b pb-2 text-3xl font-semibold tracking-tight transition-colors first:mt-0 text-foreground">
          Small
        </h2>
        <div className="rounded-xl border border-border/40 bg-card p-6 shadow-sm flex items-center justify-center min-h-[200px]">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline">Show Dialog</Button>
            </AlertDialogTrigger>
            <AlertDialogContent className="sm:max-w-sm">
              <AlertDialogHeader>
                <AlertDialogTitle>Allow accessory to connect?</AlertDialogTitle>
                <AlertDialogDescription>
                  Do you want to allow the USB accessory to connect to this device?
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Don&apos;t allow</AlertDialogCancel>
                <AlertDialogAction>Allow</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="scroll-m-20 border-b pb-2 text-3xl font-semibold tracking-tight transition-colors first:mt-0 text-foreground">
          Destructive
        </h2>
        <div className="rounded-xl border border-border/40 bg-card p-6 shadow-sm flex items-center justify-center min-h-[200px]">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive">Delete Chat</Button>
            </AlertDialogTrigger>
            <AlertDialogContent className="sm:max-w-sm">
              <AlertDialogHeader>
                <div className="flex items-center gap-4 mb-2">
                  <div className="p-3 bg-destructive/10 text-destructive rounded-full">
                    <Trash2Icon className="h-5 w-5" />
                  </div>
                  <AlertDialogTitle>Delete chat?</AlertDialogTitle>
                </div>
                <AlertDialogDescription>
                  This will permanently delete this chat conversation. View{" "}
                  <a href="#" className="underline text-foreground">Settings</a> to delete any memories saved during this chat.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel variant="outline">Cancel</AlertDialogCancel>
                <AlertDialogAction variant="destructive">Delete</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
    </div>
  );
}
