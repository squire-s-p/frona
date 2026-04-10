import { SoundPreset } from "./presets"

export type SoundContext = {
    mode: "idle" | "deepWork" | "timerRunning"
    hour: number
}

export function adaptPreset(basePreset: SoundPreset, context: SoundContext): SoundPreset {
    const adapted = { ...basePreset }

    // 1. Timer Running: Focus state
    if (context.mode === "timerRunning") {
        adapted.filterFreq *= 1.2
        adapted.noiseLevel *= 0.7
    }

    // 2. Deep Work: Maximum stability
    if (context.mode === "deepWork") {
        adapted.lfoAmount *= 0.5
        adapted.filterFreq *= 0.9 // Warmer, more enclosed sound
    }

    // 3. Night mode: 22:00 - 06:00
    if (context.hour >= 22 || context.hour < 6) {
        adapted.baseFreq *= 0.8
        adapted.harmonyFreq *= 0.8
        adapted.filterFreq *= 0.7
    }

    // 4. Idle: More atmospheric
    if (context.mode === "idle") {
        adapted.noiseLevel *= 1.5
        adapted.lfoAmount *= 1.2
    }

    return adapted
}
