"use client"

import * as React from "react"
import { useSound } from "./SoundProvider"
import { MODES } from "../lib/presets"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Volume2, VolumeX, Settings2, Music, Briefcase, BookOpen, Coffee } from "lucide-react"
import { cn } from "@/lib/utils"

function WaveformVisualizer({ analyser, active }: { analyser: AnalyserNode | null, active: boolean }) {
    const canvasRef = React.useRef<HTMLCanvasElement>(null)
    const historyRef = React.useRef<number[]>(new Array(40).fill(2))
    const requestRef = React.useRef<number>(0)

    const draw = () => {
        const canvas = canvasRef.current
        if (!canvas) return
        const ctx = canvas.getContext("2d")
        if (!ctx) return

        const width = canvas.width
        const height = canvas.height
        const barWidth = 2
        const gap = 1
        const totalBarWidth = barWidth + gap
        const barCount = Math.floor(width / totalBarWidth)

        // Update history
        let val = 2
        if (active && analyser) {
            const dataArray = new Uint8Array(analyser.frequencyBinCount)
            analyser.getByteFrequencyData(dataArray)
            let energy = 0
            for (let i = 0; i < 32; i++) energy += dataArray[i]
            val = (energy / 32 / 255) * (height - 4)
        }

        // Add noise/life if active
        if (active) {
            const noise = (Math.random() - 0.5) * 3
            const wave = Math.sin(Date.now() / 150) * 2
            val = Math.max(2, val + noise + wave + 4)
        } else {
            val = 2
        }

        historyRef.current.push(val)
        if (historyRef.current.length > barCount) {
            historyRef.current.shift()
        }

        // Draw
        ctx.clearRect(0, 0, width, height)

        ctx.fillStyle = getComputedStyle(canvas).getPropertyValue("--primary").trim() || "currentColor"
        if (!active) ctx.fillStyle = "rgba(150, 150, 150, 0.5)"

        historyRef.current.forEach((h, i) => {
            const x = i * totalBarWidth

            // Apply symmetric envelope (pinch at ends)
            const normalizedPos = i / barCount
            const envelope = Math.sin(normalizedPos * Math.PI)
            const finalH = h * envelope

            const y = (height - finalH) / 2

            // Fade in from left
            const opacity = 0.2 + (i / barCount) * 0.8
            ctx.globalAlpha = opacity

            ctx.beginPath()
            ctx.roundRect(x, y, barWidth, finalH, 1)
            ctx.fill()
        })

        requestRef.current = requestAnimationFrame(draw)
    }

    React.useEffect(() => {
        requestRef.current = requestAnimationFrame(draw)
        return () => cancelAnimationFrame(requestRef.current)
    }, [active, analyser])

    return (
        <canvas
            ref={canvasRef}
            width={100}
            height={16}
            className="w-24 h-4"
            style={{ color: 'inherit' }}
        />
    )
}

export function SoundPopover() {
    const { state, setEnabled, setVolume, setSelectedMode, getAnalyser } = useSound()

    const getModeIcon = (id: string) => {
        switch (id) {
            case "focus": return <Briefcase className="h-4 w-4" />
            case "study": return <BookOpen className="h-4 w-4" />
            case "relax": return <Coffee className="h-4 w-4" />
            default: return <Music className="h-4 w-4" />
        }
    }

    return (
        <Popover>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    className={cn(
                        "rounded-xl transition-all duration-500 overflow-hidden flex items-center justify-center p-0",
                        state.enabled
                            ? "w-28 border-primary/50 text-primary shadow-[0_0_15px_rgba(var(--primary),0.2)] bg-primary/5"
                            : "w-10 text-muted-foreground"
                    )}
                    title="Звуки фокусування"
                >
                    <div className="flex items-center justify-center w-full h-full">
                        {!state.enabled ? (
                            <VolumeX className="h-4 w-4 shrink-0 animate-in fade-in zoom-in duration-300" />
                        ) : (
                            <div className="flex items-center justify-center animate-in fade-in slide-in-from-bottom-2 duration-500">
                                <WaveformVisualizer analyser={getAnalyser()} active={state.enabled && state.volume > 0} />
                            </div>
                        )}
                    </div>
                </Button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-80 p-4 rounded-2xl shadow-xl border-border bg-popover/95 backdrop-blur-sm">
                <div className="space-y-6">
                    <div className="flex items-center justify-between">
                        <div className="space-y-1">
                            <h4 className="font-medium leading-none flex items-center gap-2">
                                Focus Engine
                                {state.enabled && <div className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />}
                            </h4>
                            <p className="text-xs text-muted-foreground">Плейлисти для продуктивності</p>
                        </div>
                        <Switch
                            checked={state.enabled}
                            onCheckedChange={setEnabled}
                        />
                    </div>

                    <div className="space-y-3">
                        <div className="flex items-center justify-between text-sm">
                            <Label className="text-muted-foreground flex items-center gap-2">
                                <Settings2 className="h-3.5 w-3.5" />
                                Гучність
                            </Label>
                            <span className="text-xs font-mono">{Math.round(state.volume * 100)}%</span>
                        </div>
                        <Slider
                            value={[state.volume * 100]}
                            max={100}
                            step={1}
                            onValueChange={([val]) => setVolume(val / 100)}
                            className="py-1"
                        />
                    </div>

                    <div className="space-y-3">
                        <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                            Режим
                        </Label>
                        <Select value={state.selectedModeId} onValueChange={(val: any) => setSelectedMode(val)}>
                            <SelectTrigger className="w-full rounded-xl border-border/50 bg-background/50">
                                <SelectValue placeholder="Оберіть режим" />
                            </SelectTrigger>
                            <SelectContent className="rounded-xl">
                                {MODES.map((mode) => (
                                    <SelectItem key={mode.id} value={mode.id}>
                                        <div className="flex items-center gap-2">
                                            {getModeIcon(mode.id)}
                                            {mode.label}
                                        </div>
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>
            </PopoverContent>
        </Popover>
    )
}
