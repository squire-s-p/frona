"use client";

import * as React from "react";
import { X, Plus, Tag as TagIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface TagEditorProps {
    tags: string[];
    tagsMetadata?: Array<{ name: string; color: string | null }>;
    onChange: (tags: string[]) => void;
}

export function TagEditor({ tags, tagsMetadata = [], onChange }: TagEditorProps) {
    const [isAdding, setIsAdding] = React.useState(false);
    const [inputValue, setInputValue] = React.useState("");

    const handleAdd = () => {
        const trimmed = inputValue.trim().replace(/^#/, "");
        if (trimmed && !tags.includes(trimmed)) {
            onChange([...tags, trimmed]);
            setInputValue("");
            setIsAdding(false);
        }
    };

    const handleRemove = (tagToRemove: string) => {
        onChange(tags.filter(t => t !== tagToRemove));
    };

    return (
        <div className="flex flex-wrap gap-1.5 items-center">
            {tags.map(tag => {
                const metadata = tagsMetadata.find(m => m.name === tag);
                return (
                    <Badge
                        key={tag}
                        variant="secondary"
                        className="pl-2 pr-1 py-0.5 flex items-center gap-1.5 bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border-none group transition-colors hover:bg-zinc-200 dark:hover:bg-zinc-700"
                    >
                        {metadata?.color ? (
                            <div className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: metadata.color }} />
                        ) : (
                            <span className="text-[10px] opacity-50">#</span>
                        )}
                        {tag}
                        <Button
                            variant="ghost"
                            size="icon"
                            type="button"
                            onClick={() => handleRemove(tag)}
                            className="h-5 w-5 p-0.5 rounded-full hover:bg-zinc-300 dark:hover:bg-zinc-600 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                            <X className="h-3 w-3" />
                        </Button>
                    </Badge>
                );
            })}

            {isAdding ? (
                <div className="flex items-center gap-1 animate-in fade-in slide-in-from-left-2 duration-200">
                    <Input
                        autoFocus
                        size={1}
                        className="h-6 w-24 text-xs px-2"
                        placeholder="тег..."
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === "Enter") handleAdd();
                            if (e.key === "Escape") setIsAdding(false);
                        }}
                        onBlur={handleAdd}
                    />
                </div>
            ) : (
                <Button
                    variant="outline"
                    size="icon"
                    type="button"
                    onClick={() => setIsAdding(true)}
                    className="h-6 w-6 flex items-center justify-center rounded-md border border-dashed border-zinc-200 dark:border-zinc-800 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:border-zinc-400 transition-all p-0"
                >
                    <Plus className="h-3.5 w-3.5" />
                </Button>
            )}
        </div>
    );
}
