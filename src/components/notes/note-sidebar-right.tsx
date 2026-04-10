"use client";

import * as React from "react";
import { ChevronRight, ChevronLeft, ListTree, Link as LinkIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { NoteOutline } from "./note-outline";
import { NoteBacklinks } from "./note-backlinks";

interface NoteSidebarRightProps {
    noteId: string;
    title: string;
    content: string;
    incomingLinks: any[];
    outgoingLinks?: any[];
}

export function NoteSidebarRight({ noteId, title, content, incomingLinks, outgoingLinks = [] }: NoteSidebarRightProps) {
    const [isCollapsed, setIsCollapsed] = React.useState(false);

    return (
        <div
            className={cn(
                "relative flex flex-col border-l border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950/50 transition-all duration-300",
                isCollapsed ? "w-0" : "w-64"
            )}
        >
            <Button
                variant="ghost"
                size="icon"
                className="absolute -left-4 top-1/2 -translate-y-1/2 h-8 w-4 rounded-l-md rounded-r-none border border-r-0 border-zinc-200 dark:border-zinc-800 bg-background z-10 p-0"
                onClick={() => setIsCollapsed(!isCollapsed)}
            >
                {isCollapsed ? <ChevronLeft className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
            </Button>

            {!isCollapsed && (
                <div className="flex flex-col h-full w-64 overflow-hidden">
                    <Tabs defaultValue="outline" className="flex flex-col h-full">
                        <div className="px-4 pt-4 pb-2">
                            <TabsList className="w-full bg-zinc-100/50 dark:bg-zinc-900/50 p-1 h-9 rounded-xl border border-zinc-200/50 dark:border-zinc-800/50">
                                <TabsTrigger
                                    value="outline"
                                    className="flex-1 text-[11px] font-bold uppercase tracking-wider rounded-lg data-[state=active]:bg-white dark:data-[state=active]:bg-zinc-800 data-[state=active]:text-blue-600 dark:data-[state=active]:text-blue-400 Transition-all duration-200"
                                >
                                    <ListTree className="h-3.5 w-3.5 mr-2" />
                                    Зміст
                                </TabsTrigger>
                                <TabsTrigger
                                    value="links"
                                    className="flex-1 text-[11px] font-bold uppercase tracking-wider rounded-lg data-[state=active]:bg-white dark:data-[state=active]:bg-zinc-800 data-[state=active]:text-blue-600 dark:data-[state=active]:text-blue-400 transition-all duration-200"
                                >
                                    <LinkIcon className="h-3.5 w-3.5 mr-2" />
                                    Зв'язки
                                </TabsTrigger>
                            </TabsList>
                        </div>

                        <TabsContent value="outline" className="flex-1 mt-0 overflow-hidden">
                            <ScrollArea className="h-full">
                                <div className="px-4 py-2">
                                    <NoteOutline content={content} />
                                </div>
                            </ScrollArea>
                        </TabsContent>

                        <TabsContent value="links" className="flex-1 mt-0 overflow-hidden">
                            <ScrollArea className="h-full">
                                <div className="px-4 py-2">
                                    <NoteBacklinks noteId={noteId} title={title} incomingLinks={incomingLinks} outgoingLinks={outgoingLinks} />
                                </div>
                            </ScrollArea>
                        </TabsContent>
                    </Tabs>
                </div>
            )}
        </div>
    );
}
