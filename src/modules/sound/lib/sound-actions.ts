export async function getSoundFiles(mode: "focus" | "study" | "relax"): Promise<string[]> {
    const soundMap = {
        focus: [
            "Focus 1.mp3",
            "Focus 2.mp3",
            "Focus 3.mp3",
            "Focus 4.mp3"
        ],
        relax: [
            "Relaxing 1.mp3"
        ],
        study: [
            "Study 1.mp3"
        ]
    };

    return (soundMap[mode] || []).map(file => `/sounds/${mode}/${file}`);
}
