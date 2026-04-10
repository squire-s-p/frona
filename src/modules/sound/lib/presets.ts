export type SoundMode = {
    id: "focus" | "study" | "relax"
    label: string
}

export type SoundPreset = {
    baseFreq: number
    harmonyFreq: number
    filterFreq: number
    noiseLevel: number
    lfoAmount: number
}

export const MODES: SoundMode[] = [
    { id: "focus", label: "Робота" },
    { id: "study", label: "Навчання" },
    { id: "relax", label: "Розслаблення" }
]
