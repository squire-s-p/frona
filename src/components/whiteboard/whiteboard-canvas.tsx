"use client";

import * as React from "react";
import {
    Excalidraw,
    WelcomeScreen,
} from "@excalidraw/excalidraw";
import { useTheme } from "next-themes";

interface WhiteboardCanvasProps {
    id: string;
    title: string;
    initialData: any;
    setAPI: (api: any) => void;
}

export default function WhiteboardCanvas({ initialData, setAPI }: WhiteboardCanvasProps) {
    const { resolvedTheme } = useTheme();

    return (
        <Excalidraw
            excalidrawAPI={setAPI}
            initialData={{
                elements: initialData?.elements || [],
                appState: {
                    ...initialData?.appState,
                    theme: resolvedTheme === "dark" ? "dark" : "light"
                },
                files: initialData?.files || {},
            }}
            theme={resolvedTheme === "dark" ? "dark" : "light"}
            langCode="uk-UA"
            UIOptions={{
                canvasActions: {
                    loadScene: false,
                    export: {
                        saveFileToDisk: true,
                    },
                    toggleTheme: false,
                }
            }}
        >
            <WelcomeScreen>
                <WelcomeScreen.Center>
                    <WelcomeScreen.Center.Logo>
                        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-zinc-900 text-white dark:bg-zinc-100 dark:text-black text-2xl font-bold mb-4 shadow-xl">
                            DB
                        </div>
                    </WelcomeScreen.Center.Logo>
                    <WelcomeScreen.Center.Heading>
                        Вітаємо у Вашому просторі!
                    </WelcomeScreen.Center.Heading>
                    <WelcomeScreen.Center.Menu>
                        <WelcomeScreen.Center.MenuItemHelp />
                        <WelcomeScreen.Center.MenuItemLoadScene />
                    </WelcomeScreen.Center.Menu>
                </WelcomeScreen.Center>
            </WelcomeScreen>
        </Excalidraw>
    );
}
