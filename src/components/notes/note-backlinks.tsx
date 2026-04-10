"use client";

import * as React from "react";
import Link from "next/link";
import { Link as LinkIcon, Link2Off, Loader2, ArrowRight } from "lucide-react";
import { getUnlinkedMentions } from "@/app/dashboard/notes/actions";

interface NoteBacklinksProps {
    noteId: string;
    title: string;
    incomingLinks: any[];
    outgoingLinks?: any[];
}

export function NoteBacklinks({ noteId, title, incomingLinks, outgoingLinks = [] }: NoteBacklinksProps) {
    const [unlinkedMentions, setUnlinkedMentions] = React.useState<any[]>([]);
    const [isLoading, setIsLoading] = React.useState(true);

    React.useEffect(() => {
        const fetchUnlinked = async () => {
            try {
                const data = await getUnlinkedMentions(noteId, title);
                setUnlinkedMentions(data);
            } catch (error) {
                console.error("Failed to fetch unlinked mentions:", error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchUnlinked();
    }, [noteId, title]);

    return (
        <div className="space-y-6">
            {/* Outgoing Links */}
            {outgoingLinks.length > 0 && (
                <div className="space-y-2">
                    <h4 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2 flex items-center gap-2">
                        <ArrowRight className="h-3 w-3" />
                        Вихідні посилання
                    </h4>
                    <div className="flex flex-col gap-1">
                        {outgoingLinks.map((link: any) => (
                            <Link
                                key={link.id}
                                href={`/dashboard/notes/${link.target.id}`}
                                className="text-sm py-1.5 px-2 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors border border-transparent hover:border-zinc-200 dark:hover:border-zinc-800 flex flex-col gap-0.5"
                            >
                                <span className="font-medium text-zinc-900 dark:text-zinc-100 truncate">
                                    {link.target.title}
                                </span>
                            </Link>
                        ))}
                    </div>
                </div>
            )}

            {/* Linked Mentions (Incoming Links) */}
            <div className="space-y-2">
                <h4 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2 flex items-center gap-2">
                    <LinkIcon className="h-3 w-3" />
                    Зворотні посилання
                </h4>
                {incomingLinks.length > 0 ? (
                    <div className="flex flex-col gap-1">
                        {incomingLinks.map((link) => (
                            <Link
                                key={link.id}
                                href={`/dashboard/notes/${link.source.id}`}
                                className="text-sm py-1.5 px-2 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors border border-transparent hover:border-zinc-200 dark:hover:border-zinc-800 flex flex-col gap-0.5"
                            >
                                <span className="font-medium text-zinc-900 dark:text-zinc-100 truncate">
                                    {link.source.title}
                                </span>
                            </Link>
                        ))}
                    </div>
                ) : (
                    <p className="text-xs text-zinc-500 italic px-2">Посилань немає</p>
                )}
            </div>

            {/* Unlinked Mentions */}
            <div className="space-y-2">
                <h4 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2 flex items-center gap-2">
                    <Link2Off className="h-3 w-3" />
                    Непов'язані згадки
                </h4>
                {isLoading ? (
                    <div className="flex items-center gap-2 px-2 text-xs text-zinc-400">
                        <Loader2 className="h-3 w-3 animate-spin" />
                        Пошук...
                    </div>
                ) : unlinkedMentions.length > 0 ? (
                    <div className="flex flex-col gap-1">
                        {unlinkedMentions.map((mention) => (
                            <Link
                                key={mention.id}
                                href={`/dashboard/notes/${mention.id}`}
                                className="text-sm py-1.5 px-2 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors border border-dashed border-zinc-200 dark:border-zinc-800 opacity-70 hover:opacity-100"
                            >
                                <span className="font-medium truncate block">
                                    {mention.title}
                                </span>
                                <span className="text-[10px] text-zinc-400">Натисніть, щоб відкрити</span>
                            </Link>
                        ))}
                    </div>
                ) : (
                    <p className="text-xs text-zinc-500 italic px-2">Згадок не знайдено</p>
                )}
            </div>
        </div>
    );
}

