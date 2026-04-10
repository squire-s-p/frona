export class SoundEngine {
    private ctx: AudioContext | null = null
    private masterGain: GainNode | null = null
    private analyser: AnalyserNode | null = null
    private currentSource: AudioBufferSourceNode | null = null
    private currentGain: GainNode | null = null
    private buffers: Map<string, AudioBuffer> = new Map()
    private isRunning = false
    private currentUrl: string | null = null

    constructor() { }

    public async init() {
        if (this.ctx) return
        this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)()

        if (this.ctx.state === "suspended") {
            await this.ctx.resume()
        }

        this.masterGain = this.ctx.createGain()
        this.masterGain.gain.setValueAtTime(0, this.ctx.currentTime)

        this.analyser = this.ctx.createAnalyser()
        this.analyser.fftSize = 256 // Better resolution for visualization
        this.analyser.smoothingTimeConstant = 0.8 // Smoother transitions

        this.masterGain.connect(this.analyser)
        this.analyser.connect(this.ctx.destination)
    }

    public getAnalyser() {
        return this.analyser
    }

    private async loadBuffer(url: string): Promise<AudioBuffer> {
        if (this.buffers.has(url)) return this.buffers.get(url)!

        const response = await fetch(url)
        const arrayBuffer = await response.arrayBuffer()
        const audioBuffer = await this.ctx!.decodeAudioData(arrayBuffer)
        this.buffers.set(url, audioBuffer)
        return audioBuffer
    }

    public async playSound(url: string, volume: number, loop = false, fadeTime = 2.5, onEnded?: () => void) {
        if (!this.ctx || !this.masterGain) await this.init()
        if (!this.ctx || !this.masterGain) return

        const now = this.ctx.currentTime

        // If switching tracks while already running
        if (this.currentUrl === url && this.isRunning) {
            this.masterGain.gain.setTargetAtTime(volume, now, 0.2)
            return
        }

        this.currentUrl = url
        this.isRunning = true

        const buffer = await this.loadBuffer(url)

        // Create new source
        const newSource = this.ctx.createBufferSource()
        newSource.buffer = buffer
        newSource.loop = loop

        if (onEnded) {
            newSource.onended = () => {
                if (this.currentUrl === url && this.isRunning) {
                    onEnded()
                }
            }
        }

        const newGain = this.ctx.createGain()
        newGain.gain.setValueAtTime(0, now)

        newSource.connect(newGain)
        newGain.connect(this.masterGain)
        newSource.start(now)

        // Fade in new track gain
        newGain.gain.linearRampToValueAtTime(1, now + fadeTime)

        // Fade out old track gain if exists
        if (this.currentGain) {
            const oldGain = this.currentGain
            const oldSource = this.currentSource

            oldGain.gain.setValueAtTime(oldGain.gain.value, now)
            oldGain.gain.linearRampToValueAtTime(0, now + fadeTime)

            setTimeout(() => {
                try {
                    oldSource?.stop()
                    oldSource?.disconnect()
                    oldGain.disconnect()
                } catch (e) { }
            }, fadeTime * 1000)
        }

        this.currentSource = newSource
        this.currentGain = newGain

        // Fade in master volume if it was 0 or just started
        this.masterGain.gain.setValueAtTime(this.masterGain.gain.value, now)
        this.masterGain.gain.linearRampToValueAtTime(volume, now + fadeTime)
    }

    public stop(fadeTime = 2.5) {
        if (!this.ctx || !this.masterGain) return
        this.isRunning = false
        this.currentUrl = null
        const now = this.ctx.currentTime

        this.masterGain.gain.setValueAtTime(this.masterGain.gain.value, now)
        this.masterGain.gain.linearRampToValueAtTime(0, now + fadeTime)

        // Stop current source after fade
        const source = this.currentSource
        setTimeout(() => {
            if (!this.isRunning) {
                try {
                    source?.stop()
                } catch (e) { }
            }
        }, fadeTime * 1000)
    }

    public setVolume(volume: number) {
        if (!this.ctx || !this.masterGain) return
        this.masterGain.gain.linearRampToValueAtTime(volume, this.ctx.currentTime + 0.5)
    }

    public dispose() {
        this.stop(0.1)
        setTimeout(() => {
            this.ctx?.close()
        }, 200)
    }
}
