"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Calendar } from "lucide-react";
import { getDailyNote } from "@/app/dashboard/notes/actions";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export function DailyNoteButton() {
    const router = useRouter();
    const [isLoading, setIsLoading] = React.useState(false);

    const handleClick = async () => {
        setIsLoading(true);
        try {
            const note = await getDailyNote();
            router.push(`/dashboard/notes/${note.id}`);
        } catch {
            toast.error("Помилка відкриття щоденної нотатки");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Button
            variant="ghost"
            className="w-full justify-start h-9 px-2 gap-2 text-sm font-medium"
            onClick={handleClick}
            disabled={isLoading}
        >
            <Calendar className="h-4 w-4 text-purple-500" />
            Щоденна нотатка
        </Button>
    );
}
