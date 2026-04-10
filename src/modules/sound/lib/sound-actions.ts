"use server"

import fs from "fs"
import path from "path"

export async function getSoundFiles(mode: "focus" | "study" | "relax") {
    const directoryPath = path.join(process.cwd(), "public", "sounds", mode)

    try {
        if (!fs.existsSync(directoryPath)) {
            console.warn(`Directory not found: ${directoryPath}`)
            return []
        }

        const files = fs.readdirSync(directoryPath)
        return files
            .filter(file => file.endsWith(".mp3"))
            .map(file => `/sounds/${mode}/${file}`)
    } catch (error) {
        console.error(`Error reading sound files for mode ${mode}:`, error)
        return []
    }
}
