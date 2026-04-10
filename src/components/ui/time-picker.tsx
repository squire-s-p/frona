"use client";

import * as React from "react";
import { Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { TimePickerClock } from "./time-picker-clock";

type TimePickerProps = {
    value: string; // HH:mm format
    onChangeAction: (value: string) => void;
    disabled?: boolean;
    placeholder?: string;
};

export function TimePicker({ value, onChangeAction, disabled, placeholder = "Вибрати час" }: TimePickerProps) {
    const [open, setOpen] = React.useState(false);

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    className={cn(
                        "w-full h-10 justify-start text-left font-medium text-base px-3",
                        !value && "text-muted-foreground"
                    )}
                    disabled={disabled}
                >
                    <Clock className="mr-2 h-5 w-5 opacity-70" />
                    {value || placeholder}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0 border-none shadow-2xl rounded-xl overflow-hidden" align="start">
                <TimePickerClock
                    value={value || "09:00"}
                    onChangeAction={onChangeAction}
                    onConfirmAction={() => setOpen(false)}
                />
            </PopoverContent>
        </Popover>
    );
}
