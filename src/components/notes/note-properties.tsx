"use client";

import * as React from "react";
import { Plus, X, Type, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface NotePropertiesProps {
    properties: Record<string, string>;
    onChange: (properties: Record<string, string>) => void;
}

export function NoteProperties({ properties, onChange }: NotePropertiesProps) {
    const [isAdding, setIsAdding] = React.useState(false);
    const [newKey, setNewKey] = React.useState("");

    const updateProperty = (key: string, value: string) => {
        onChange({ ...properties, [key]: value });
    };

    const removeProperty = (key: string) => {
        const newProps = { ...properties };
        delete newProps[key];
        onChange(newProps);
    };

    const handleAdd = () => {
        if (!newKey) return;
        onChange({ ...properties, [newKey]: "" });
        setNewKey("");
        setIsAdding(false);
    };

    return (
        <div className="space-y-4 pt-6 border-t border-zinc-100 dark:border-zinc-900 mt-6">
            <div className="flex items-center justify-between">
                <h4 className="text-[11px] font-bold uppercase tracking-[0.2em] text-zinc-400">Властивості</h4>
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 text-zinc-400 hover:text-foreground transition-colors"
                    onClick={() => setIsAdding(!isAdding)}
                >
                    <Plus className="h-3.5 w-3.5" />
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-3">
                {Object.entries(properties).map(([key, value]) => (
                    <div key={key} className="group flex items-center gap-4 py-1.5 border-b border-transparent hover:border-zinc-100 dark:hover:border-zinc-900 transition-all">
                        <div className="flex items-center gap-2.5 min-w-[120px] text-[11px] text-zinc-400 font-bold uppercase tracking-wider">
                            <Type className="h-3.5 w-3.5 opacity-50" />
                            <span className="truncate">{key}</span>
                        </div>
                        <Input
                            className="flex-1 bg-transparent border-none outline-none text-xs text-zinc-800 dark:text-zinc-200 placeholder:text-zinc-300 font-medium h-auto p-0 focus-visible:ring-0"
                            value={value}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateProperty(key, e.target.value)}
                            placeholder="Натисніть для редагування..."
                        />
                        <Button
                            variant="ghost"
                            size="icon"
                            type="button"
                            onClick={() => removeProperty(key)}
                            className="opacity-0 group-hover:opacity-100 h-7 w-7 text-zinc-300 hover:text-red-500 transition-all font-bold"
                        >
                            <X className="h-3.5 w-3.5" />
                        </Button>
                    </div>
                ))}
            </div>

            {isAdding && (
                <div className="flex items-center gap-3 mt-4 animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="flex-1 bg-zinc-50 dark:bg-zinc-900/50 rounded-lg p-1 flex items-center gap-2 border border-zinc-200 dark:border-zinc-800 focus-within:border-blue-500/50 transition-all">
                        <Input
                            className="h-8 border-none bg-transparent focus-visible:ring-0 text-xs placeholder:text-zinc-400"
                            placeholder="Новий ключ (напр. Пріоритет)..."
                            value={newKey}
                            onChange={(e) => setNewKey(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && handleAdd()}
                            autoFocus
                        />
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-blue-500 hover:bg-blue-500/10" onClick={handleAdd}>
                            <Check className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-zinc-400" onClick={() => setIsAdding(false)}>
                            <X className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
}
