"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

type TimePickerClockProps = {
    value: string; // HH:mm
    onChangeAction: (value: string) => void;
    onConfirmAction: () => void;
};

export function TimePickerClock({
    value,
    onChangeAction,
    onConfirmAction,
}: TimePickerClockProps) {
    const [hour, minute] = value.split(":").map(Number);
    const [mode, setMode] = React.useState<"hours" | "minutes">("hours");

    const [pickingHour, setPickingHour] = React.useState(hour);
    const [pickingMinute, setPickingMinute] = React.useState(minute);

    const clockRef = React.useRef<HTMLDivElement>(null);

    const handleModeChange = (newMode: "hours" | "minutes") => {
        setMode(newMode);
    };

    const calculateValueFromAngle = (
        clientX: number,
        clientY: number,
        isHours: boolean
    ) => {
        if (!clockRef.current) return null;

        const rect = clockRef.current.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;

        const dx = clientX - centerX;
        const dy = clientY - centerY;
        const distance = Math.sqrt(dx * dx + dy * dy);

        // Initial angle calculation
        let angle = Math.atan2(dy, dx) * (180 / Math.PI) + 90;
        if (angle < 0) angle += 360;

        if (isHours) {
            // 24h format: inner circle 1-12, outer circle 13-00
            // Radius of the clock is rect.width / 2.
            // Inner circle is around 0.5-0.7 of radius, outer is 0.8-0.9.
            const isInner = distance < rect.width * 0.35;

            let val = Math.round(angle / 30) % 12;
            if (val === 0) val = 12;

            if (!isInner) {
                // Outer circle
                if (val === 12) return 0; // 00
                return val + 12;
            } else {
                // Inner circle
                return val;
            }
        } else {
            // Minutes
            return Math.round(angle / 6) % 60;
        }
    };

    const handlePointerDown = (e: React.PointerEvent) => {
        e.preventDefault();
        const val = calculateValueFromAngle(e.clientX, e.clientY, mode === "hours");
        if (val !== null) {
            if (mode === "hours") {
                setPickingHour(val);
            } else {
                setPickingMinute(val);
            }
        }

        const handlePointerMove = (moveEvent: PointerEvent) => {
            const moveVal = calculateValueFromAngle(
                moveEvent.clientX,
                moveEvent.clientY,
                mode === "hours"
            );
            if (moveVal !== null) {
                if (mode === "hours") {
                    setPickingHour(moveVal);
                } else {
                    setPickingMinute(moveVal);
                }
            }
        };

        const handlePointerUp = () => {
            window.removeEventListener("pointermove", handlePointerMove);
            window.removeEventListener("pointerup", handlePointerUp);

            // Auto-switch to minutes after picking hour
            if (mode === "hours") {
                setTimeout(() => setMode("minutes"), 200);
            }
        };

        window.addEventListener("pointermove", handlePointerMove);
        window.addEventListener("pointerup", handlePointerUp);
    };

    const formatValue = (h: number, m: number) => {
        return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
    };

    // Update parent when picking changes
    const onChangeRef = React.useRef(onChangeAction);
    React.useEffect(() => {
        onChangeRef.current = onChangeAction;
    }, [onChangeAction]);

    React.useEffect(() => {
        onChangeRef.current(formatValue(pickingHour, pickingMinute));
    }, [pickingHour, pickingMinute]);

    const renderNumbers = () => {
        if (mode === "hours") {
            const numbers = [];
            // Outer 13-00
            for (let i = 1; i <= 12; i++) {
                const val = i === 12 ? 0 : i + 12;
                const angle = (i * 30 - 90) * (Math.PI / 180);
                const radius = 80; // px
                numbers.push(
                    <div
                        key={`outer-${val}`}
                        className={cn(
                            "absolute -translate-x-1/2 -translate-y-1/2 text-[11px] font-medium w-6 h-6 flex items-center justify-center rounded-full transition-colors",
                            pickingHour === val ? "text-white" : "text-muted-foreground"
                        )}
                        style={{
                            left: `calc(50% + ${Math.cos(angle) * radius}px)`,
                            top: `calc(50% + ${Math.sin(angle) * radius}px)`,
                        }}
                    >
                        {val === 0 ? "00" : val}
                    </div>
                );
            }
            // Inner 1-12
            for (let i = 1; i <= 12; i++) {
                const val = i;
                const angle = (i * 30 - 90) * (Math.PI / 180);
                const radius = 50; // px
                numbers.push(
                    <div
                        key={`inner-${val}`}
                        className={cn(
                            "absolute -translate-x-1/2 -translate-y-1/2 text-[11px] font-medium w-6 h-6 flex items-center justify-center rounded-full transition-colors",
                            pickingHour === val ? "text-white" : "text-muted-foreground"
                        )}
                        style={{
                            left: `calc(50% + ${Math.cos(angle) * radius}px)`,
                            top: `calc(50% + ${Math.sin(angle) * radius}px)`,
                        }}
                    >
                        {val}
                    </div>
                );
            }
            return numbers;
        } else {
            const numbers = [];
            for (let i = 0; i < 60; i += 5) {
                const angle = (i * 6 - 90) * (Math.PI / 180);
                const radius = 80; // px
                numbers.push(
                    <div
                        key={`min-${i}`}
                        className={cn(
                            "absolute -translate-x-1/2 -translate-y-1/2 text-[11px] font-medium w-6 h-6 flex items-center justify-center rounded-full transition-colors",
                            pickingMinute === i ? "text-white" : "text-muted-foreground"
                        )}
                        style={{
                            left: `calc(50% + ${Math.cos(angle) * radius}px)`,
                            top: `calc(50% + ${Math.sin(angle) * radius}px)`,
                        }}
                    >
                        {String(i).padStart(2, "0")}
                    </div>
                );
            }
            return numbers;
        }
    };

    const getHandStyle = () => {
        let angle = 0;
        const length = mode === "hours" ? (pickingHour >= 13 || pickingHour === 0 ? 80 : 50) : 80;

        if (mode === "hours") {
            const h = pickingHour % 12;
            angle = h * 30;
        } else {
            angle = pickingMinute * 6;
        }

        return {
            transform: `rotate(${angle}deg)`,
            height: `${length}px`,
        };
    };

    return (
        <div className="flex flex-col items-center p-5 bg-background border rounded-xl shadow-2xl w-[260px]">
            {/* Header with large digits */}
            <div className="flex items-center justify-center gap-2 mb-6">
                <button
                    onClick={() => handleModeChange("hours")}
                    className={cn(
                        "text-4xl font-bold tabular-nums transition-all",
                        mode === "hours" ? "text-foreground" : "text-muted-foreground/20 hover:text-muted-foreground/40"
                    )}
                >
                    {String(pickingHour).padStart(2, "0")}
                </button>
                <span className="text-3xl font-medium text-muted-foreground/30 pb-1">:</span>
                <button
                    onClick={() => handleModeChange("minutes")}
                    className={cn(
                        "text-4xl font-bold tabular-nums transition-all",
                        mode === "minutes" ? "text-foreground" : "text-muted-foreground/20 hover:text-muted-foreground/40"
                    )}
                >
                    {String(pickingMinute).padStart(2, "0")}
                </button>
            </div>

            {/* Clock Plate */}
            <div
                ref={clockRef}
                className="relative w-[200px] h-[200px] rounded-full bg-muted/30 mb-6 flex items-center justify-center cursor-pointer select-none touch-none"
                onPointerDown={handlePointerDown}
            >
                {/* Hand */}
                <div
                    className="absolute bottom-1/2 left-1/2 w-[2px] bg-primary origin-bottom transition-all duration-300 ease-out z-10"
                    style={getHandStyle()}
                >
                    {/* The circular tip */}
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center">
                        <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                    </div>
                </div>

                {/* Center dot */}
                <div className="absolute w-1.5 h-1.5 rounded-full bg-primary z-20" />

                {/* Numbers */}
                {renderNumbers()}
            </div>

            {/* Footer footer */}
            <div className="w-full">
                <Button
                    onClick={onConfirmAction}
                    className="w-full font-bold h-10 rounded-lg"
                >
                    Застосувати
                </Button>
            </div>
        </div>
    );
}
