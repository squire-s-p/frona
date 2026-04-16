"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";

interface Header {
    level: number;
    text: string;
    id: string;
}

export function NoteOutline({ content }: { content: string }) {
    const headers = React.useMemo(() => {
        const headerRegex = /^(#{1,6})\s+(.*)$/gm;
        const foundHeaders: Header[] = [];
        let match;

        while ((match = headerRegex.exec(content)) !== null) {
            const level = match[1].length;
            const text = match[2].trim();
            const id = text.toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-');
            foundHeaders.push({ level, text, id });
        }

        return foundHeaders;
    }, [content]);

    if (headers.length === 0) {
        return (
            <div className="text-sm text-zinc-500 italic py-4">
                Заголовки не знайдені
            </div>
        );
    }

    const scrollToHeader = (id: string) => {
        // Find the element in the preview and scroll to it
        const element = document.getElementById(id);
        if (element) {
            element.scrollIntoView({ behavior: "smooth" });
        }
    };

    return (
        <div className="space-y-4">
            <h4 className="text-[10px] font-bold text-zinc-400 uppercase tracking-[0.2em] mb-4">
                Структура документа
            </h4>
            <div className="flex flex-col relative">
                {headers.map((header, index) => (
                    <button
                        key={`${header.id}-${index}`}
                        type="button"
                        onClick={() => scrollToHeader(header.id)}
                        className={cn(
                            buttonVariants({ variant: "ghost" }),
                            "group h-auto text-left text-[13px] py-1.5 px-3 rounded-lg transition-all relative overflow-hidden",
                            "truncate w-full block",
                            header.level === 1 && "font-bold text-zinc-900 dark:text-zinc-100",
                            header.level === 2 && "pl-8 text-zinc-600 dark:text-zinc-400 font-medium",
                            header.level === 3 && "pl-12 text-zinc-500 dark:text-zinc-500",
                            header.level >= 4 && "pl-16 text-zinc-400 dark:text-zinc-600 text-xs",
                            "hover:bg-blue-500/5 dark:hover:bg-blue-500/10 hover:text-blue-600 dark:hover:text-blue-400"
                        )}
                    >
                        {header.level > 1 && (
                            <div className={cn(
                                "absolute left-4 top-1/2 -translate-y-1/2 w-px h-2/3 bg-zinc-200 dark:bg-zinc-800 transition-colors group-hover:bg-blue-500/30",
                                header.level === 3 && "left-8",
                                header.level >= 4 && "left-12"
                            )} />
                        )}
                        {header.text}
                    </button>
                ))}
            </div>
        </div>
    );
}
