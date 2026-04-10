"use client";

import * as React from "react";
import dynamic from "next/dynamic";
import { useTheme } from "next-themes";
import { updateWhiteboard, renameWhiteboard } from "@/app/dashboard/whiteboard/actions";
import { Loader2, Save, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import { toast } from "sonner";
import "@excalidraw/excalidraw/index.css";

// Динамічний імпорт нашого власного компонента-полотна
const WhiteboardCanvas = dynamic(
    () => import("./whiteboard-canvas"),
    {
        ssr: false,
        loading: () => (
            <div className="flex flex-col items-center justify-center h-full gap-4">
                <Loader2 className="h-8 w-8 animate-spin text-zinc-500" />
                <p className="text-sm text-zinc-500">Завантаження редактора...</p>
            </div>
        ),
    }
);

interface WhiteboardEditorProps {
    board: {
        id: string;
        title: string;
        data: any;
    };
}

export default function WhiteboardEditor({ board }: WhiteboardEditorProps) {
    const { resolvedTheme } = useTheme();
    const [excalidrawAPI, setExcalidrawAPI] = React.useState<any>(null);
    const [isSaving, setIsSaving] = React.useState(false);
    const [title, setTitle] = React.useState(board.title);
    const [isRenaming, setIsRenaming] = React.useState(false);

    // Функція для збереження
    const handleSave = React.useCallback(async () => {
        if (!excalidrawAPI) return;

        const elements = excalidrawAPI.getSceneElements();
        const appState = excalidrawAPI.getAppState();
        const files = excalidrawAPI.getFiles();

        setIsSaving(true);
        try {
            // Генерація прев'ю (Thumbnail)
            let preview: string | undefined = undefined;
            try {
                // Імпортуємо утиліти динамічно, щоб уникнути проблем
                const mod = await import("@excalidraw/excalidraw");
                const canvas = await mod.exportToCanvas({
                    elements: elements.filter((el: any) => !el.isDeleted),
                    appState: { ...appState, viewBackgroundColor: resolvedTheme === "dark" ? "#121212" : "#ffffff" },
                    files,
                    maxWidthOrHeight: 400, // Робимо невелику мініатюру
                });
                preview = canvas.toDataURL("image/webp", 0.8);
            } catch (e) {
                console.error("Failed to generate preview:", e);
            }

            await updateWhiteboard(board.id, { elements, appState, files }, preview);
            toast.success("Збережено", { duration: 1000 });
        } catch (error) {
            console.error(error);
            toast.error("Помилка збереження");
        } finally {
            setIsSaving(false);
        }
    }, [excalidrawAPI, board.id, resolvedTheme]);

    // Автозбереження кожні 30 секунд при змінах
    React.useEffect(() => {
        const timer = setInterval(() => {
            handleSave();
        }, 30000);
        return () => clearInterval(timer);
    }, [handleSave]);

    return (
        <div className="flex flex-col h-full relative overflow-hidden">
            {/* Custom Styles to match Dashboard */}
            <style jsx global>{`
                .excalidraw {
                    --color-primary: var(--primary) !important;
                    --color-primary-darker: var(--primary) !important;
                    --color-primary-darkest: var(--primary) !important;
                    --font-family-base: var(--font-sans) !important;
                }
                .excalidraw.dark {
                    --excalidraw-background-color: transparent !important;
                    --excalidraw-canvas-bg: var(--background) !important;
                }
                .excalidraw.light {
                    --excalidraw-background-color: transparent !important;
                    --excalidraw-canvas-bg: var(--background) !important;
                }
                .excalidraw .layer-ui__wrapper {
                    --button-border-radius: 8px !important;
                }
            `}</style>

            {/* Header */}
            <div className="h-14 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between px-4 bg-background z-10 shrink-0">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" asChild>
                        <Link href="/dashboard/whiteboard">
                            <ArrowLeft className="h-4 w-4" />
                        </Link>
                    </Button>
                    <div className="flex items-center gap-2 group">
                        {isRenaming ? (
                            <Input
                                className="h-7 bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded outline-none font-semibold text-sm w-[200px]"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                onBlur={async () => {
                                    setIsRenaming(false);
                                    if (title !== board.title) {
                                        await renameWhiteboard(board.id, title);
                                    }
                                }}
                                onKeyDown={async (e) => {
                                    if (e.key === "Enter") {
                                        e.currentTarget.blur();
                                    }
                                }}
                                autoFocus
                            />
                        ) : (
                            <h1
                                className="font-semibold truncate max-w-[200px] md:max-w-md cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-800 px-2 py-0.5 rounded transition-colors"
                                onClick={() => setIsRenaming(true)}
                            >
                                {title}
                            </h1>
                        )}
                        {isSaving && <Loader2 className="h-3 w-3 animate-spin text-zinc-400" />}
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={handleSave}
                        disabled={isSaving}
                    >
                        <Save className="h-4 w-4 mr-2" />
                        Зберегти
                    </Button>
                </div>
            </div>

            {/* Editor Container */}
            <div className="flex-1 relative bg-zinc-50 dark:bg-zinc-950 overflow-hidden" style={{ height: "calc(100vh - 160px)" }}>
                <WhiteboardCanvas
                    id={board.id}
                    title={board.title}
                    initialData={board.data}
                    setAPI={setExcalidrawAPI}
                />
            </div>
        </div>
    );
}
