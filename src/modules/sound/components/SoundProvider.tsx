"use client"

import React, { createContext, useContext, useEffect, useRef, useState } from "react"
import { SoundEngine } from "../lib/engine"
import { MODES } from "../lib/presets"
import { getSoundFiles } from "../lib/sound-actions"

type SoundState = {
    enabled: boolean
    volume: number
    selectedModeId: "focus" | "study" | "relax"
}

type SoundProviderContextType = {
    state: SoundState
    setEnabled: (enabled: boolean) => void
    setVolume: (volume: number) => void
    setSelectedMode: (modeId: "focus" | "study" | "relax") => void
    toggleEnabled: () => void
    getAnalyser: () => AnalyserNode | null
}

const SoundProviderContext = createContext<SoundProviderContextType | null>(null)

export const useSound = () => {
    const context = useContext(SoundProviderContext)
    if (!context) throw new Error("useSound must be used within a SoundProvider")
    return context
}

type SoundProviderProps = {
    children: React.ReactNode
}

export const SoundProvider: React.FC<SoundProviderProps> = ({ children }) => {
    const [state, setState] = useState<SoundState>(() => {
        if (typeof window === "undefined") return { enabled: false, volume: 0.5, selectedModeId: "focus" }
        const saved = localStorage.getItem("sound_settings_v2")
        return saved ? JSON.parse(saved) : { enabled: false, volume: 0.5, selectedModeId: "focus" }
    })

    const engineRef = useRef<SoundEngine | null>(null)
    const [engineReady, setEngineReady] = useState(false)
    const isInitializing = useRef(false)

    const [playlist, setPlaylist] = useState<string[]>([])
    const [currentIndex, setCurrentIndex] = useState(0)

    // Save to localStorage
    useEffect(() => {
        localStorage.setItem("sound_settings_v2", JSON.stringify(state))
    }, [state])

    // Fetch playlist when mode changes
    useEffect(() => {
        const fetchPlaylist = async () => {
            const files = await getSoundFiles(state.selectedModeId)
            setPlaylist(files)
            setCurrentIndex(0)
        }
        fetchPlaylist()
    }, [state.selectedModeId])

    // Initialize engine
    const initEngine = async () => {
        if (engineReady || isInitializing.current) return
        isInitializing.current = true

        if (!engineRef.current) engineRef.current = new SoundEngine()
        await engineRef.current.init()

        setEngineReady(true)
        isInitializing.current = false

        if (state.enabled) {
            playCurrentTrack()
        }
    }

    const playNextTrack = () => {
        if (playlist.length === 0) return
        setCurrentIndex(prev => (prev + 1) % playlist.length)
    }

    const playCurrentTrack = () => {
        if (!engineRef.current || !engineReady || !state.enabled || playlist.length === 0) {
            if (!state.enabled) engineRef.current?.stop()
            return
        }

        const trackUrl = playlist[currentIndex]
        engineRef.current.playSound(trackUrl, state.volume, false, 2.5, () => {
            playNextTrack()
        })
    }

    // Handle track/playlist changes
    useEffect(() => {
        if (!engineReady) return
        playCurrentTrack()
    }, [state.enabled, currentIndex, playlist, engineReady])

    // Volume change is faster
    useEffect(() => {
        if (engineReady && state.enabled) {
            engineRef.current?.setVolume(state.volume)
        }
    }, [state.volume, engineReady])

    // Cleanup
    useEffect(() => {
        return () => {
            engineRef.current?.dispose()
        }
    }, [])

    const toggleEnabled = () => {
        if (!engineReady) {
            initEngine()
        }
        setState(prev => ({ ...prev, enabled: !prev.enabled }))
    }

    const setEnabled = (enabled: boolean) => {
        if (enabled && !engineReady) initEngine()
        setState(prev => ({ ...prev, enabled }))
    }

    const setVolume = (volume: number) => setState(prev => ({ ...prev, volume }))
    const setSelectedMode = (selectedModeId: "focus" | "study" | "relax") => {
        setState(prev => ({ ...prev, selectedModeId }))
    }

    const getAnalyser = React.useCallback(() => {
        return engineRef.current?.getAnalyser() || null
    }, [engineReady])

    return (
        <SoundProviderContext.Provider value={{
            state,
            setEnabled,
            setVolume,
            setSelectedMode,
            toggleEnabled,
            getAnalyser
        }}>
            <div onClickCapture={() => !engineReady && initEngine()}>
                {children}
            </div>
        </SoundProviderContext.Provider>
    )
}
