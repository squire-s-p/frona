export type SoundMode = {
    id: "focus" | "study" | "relax"
    label: string
}

export const MODES: SoundMode[] = [
    { id: "focus", label: "Робота" },
    { id: "study", label: "Навчання" },
    { id: "relax", label: "Розслаблення" }
]
