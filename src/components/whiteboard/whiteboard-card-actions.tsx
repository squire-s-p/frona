"use client";

import * as React from "react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { MoreVertical, Pin, Trash2, Edit2 } from "lucide-react";
import { togglePinWhiteboard, deleteWhiteboard, renameWhiteboard } from "@/app/dashboard/whiteboard/actions";
import { toast } from "sonner";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

// Note: Input is actually in label.tsx sometimes if I mis-saw, but let's check input.tsx
// I saw input.tsx in the list.

interface WhiteboardCardActionsProps {
    id: string;
    title: string;
    isPinned: boolean;
}

export function WhiteboardCardActions({ id, title, isPinned }: WhiteboardCardActionsProps) {
    const [isRenaming, setIsRenaming] = React.useState(false);
    const [newTitle, setNewTitle] = React.useState(title);
    const [isPending, setIsPending] = React.useState(false);

    const onTogglePin = async (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        try {
            await togglePinWhiteboard(id, !isPinned);
            toast.success(isPinned ? "Відкріплено" : "Закріплено");
        } catch (error) {
            toast.error("Помилка");
        }
    };

    const onDelete = async (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (confirm("Ви впевнені, що хочете видалити цю дошку?")) {
            try {
                await deleteWhiteboard(id);
                toast.success("Видалено");
            } catch (error) {
                toast.error("Помилка");
            }
        }
    };

    const handleRename = async () => {
        if (!newTitle.trim() || newTitle === title) return;
        setIsPending(true);
        try {
            await renameWhiteboard(id, newTitle);
            toast.success("Перейменовано");
            setIsRenaming(false);
        } catch (error) {
            toast.error("Помилка");
        } finally {
            setIsPending(false);
        }
    };

    return (
        <>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <MoreVertical className="h-4 w-4" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={onTogglePin}>
                        <Pin className="h-4 w-4 mr-2" />
                        {isPinned ? "Відкріпити" : "Закріпити"}
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setIsRenaming(true);
                    }}>
                        <Edit2 className="h-4 w-4 mr-2" />
                        Перейменувати
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                        onClick={onDelete}
                        className="text-red-600 focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-950/20"
                    >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Видалити
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>

            <Dialog open={isRenaming} onOpenChange={setIsRenaming}>
                <DialogContent onClick={(e) => e.stopPropagation()}>
                    <DialogHeader>
                        <DialogTitle>Перейменувати дошку</DialogTitle>
                        <DialogDescription>
                            Введіть нову назву для вашої дошки.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-4">
                        <Input
                            value={newTitle}
                            onChange={(e) => setNewTitle(e.target.value)}
                            placeholder="Назва дошки"
                            disabled={isPending}
                            autoFocus
                        />
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsRenaming(false)}>Скасувати</Button>
                        <Button onClick={handleRename} disabled={isPending}>
                            {isPending ? "Збереження..." : "Зберегти"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
