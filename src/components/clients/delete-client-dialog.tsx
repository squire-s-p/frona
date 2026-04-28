"use client";

import * as React from "react";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { deleteClient } from "@/app/dashboard/clients/actions";

interface DeleteClientDialogProps {
  clientId: string;
  clientName: string;
  onDeleted?: () => void;
  trigger?: React.ReactNode;
}

export function DeleteClientDialog({
  clientId,
  clientName,
  onDeleted,
  trigger,
}: DeleteClientDialogProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = React.useState(false);
  const [isDeleting, setIsDeleting] = React.useState(false);

  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      await deleteClient(clientId);
      toast.success(`Клієнт "${clientName}" видалений`);
      setIsOpen(false);
      onDeleted?.();
      router.refresh();
    } catch (error) {
      toast.error("Не вдалося видалити клієнта");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
      <AlertDialogTrigger asChild>
        {trigger || (
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        )}
      </AlertDialogTrigger>
      <AlertDialogContent 
        data-size="sm" 
        className="gap-4 rounded-lg border bg-background p-6 shadow-lg data-[size=sm]:max-w-xs"
        onClickOverlay={() => setIsOpen(false)}
        onEscapeKeyDown={() => setIsOpen(false)}
      >
        <div className="grid grid-rows-[auto_1fr] place-items-center gap-1.5 text-center">
          <div className="mb-2 inline-flex size-16 items-center justify-center rounded-md bg-destructive/10 text-destructive dark:bg-destructive/20 dark:text-destructive">
            <Trash2 className="size-8" />
          </div>
          <AlertDialogTitle className="text-lg font-semibold">
            Видалити клієнта?
          </AlertDialogTitle>
        </div>

        <AlertDialogFooter className="flex flex-row gap-3 justify-center">
          <AlertDialogCancel 
            className="flex-1 mt-0 h-9 rounded-md border bg-background shadow-none hover:bg-accent hover:text-accent-foreground dark:border-input dark:bg-input/30 dark:hover:bg-input/50"
          >
            Скасувати
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault();
              handleDelete();
            }}
            disabled={isDeleting}
            className="flex-1 h-9 rounded-md bg-destructive text-white hover:bg-destructive/90 dark:bg-destructive/60"
          >
            {isDeleting ? "..." : "Видалити"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
