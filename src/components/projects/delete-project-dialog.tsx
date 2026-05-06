"use client";

import * as React from "react";
import { Trash2 } from "lucide-react";
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
import { deleteProject } from "@/app/dashboard/projects/actions";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

interface DeleteProjectDialogProps {
  projectId: string;
  projectName: string;
  trigger?: React.ReactNode;
  onDeleted?: () => void;
}

export default function DeleteProjectDialog({
  projectId,
  projectName,
  trigger,
  onDeleted,
}: DeleteProjectDialogProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [isDeleting, setIsDeleting] = React.useState(false);
  const router = useRouter();

  async function handleDelete() {
    try {
      setIsDeleting(true);
      await deleteProject(projectId);
      toast.success(`Проєкт "${projectName}" видалено`);
      setIsOpen(false);
      onDeleted?.();
      router.refresh();
    } catch (error) {
      toast.error("Не вдалося видалити проєкт");
      console.error(error);
    } finally {
      setIsDeleting(false);
    }
  }

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
            Видалити проєкт?
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
