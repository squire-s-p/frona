"use client";

import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { User, Calendar, Briefcase, ExternalLink, Activity } from "lucide-react";
import { format } from "date-fns";
import { uk } from "date-fns/locale";

export default function ClientCard(props: {
    id: string;
    name: string;
    activeProjects: number;
    totalProjects: number;
    createdAt: Date;
}) {
    return (
        <Link href={`/dashboard/clients/${props.id}`} className="group block">
            <Card className="relative rounded-2xl border border-border/60 dark:bg-neutral-900 bg-neutral-100 p-5 shadow-none transition-all hover:border-primary/40">
                <div className="flex flex-col gap-5">
                    <div className="flex items-center gap-3 min-w-0">
                        <div className="w-9 h-9 rounded-xl bg-primary/5 border border-primary/10 flex items-center justify-center shrink-0 group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-300">
                            <User className="h-4.5 w-4.5" />
                        </div>
                        <div className="truncate text-lg font-bold tracking-tight dark:text-white text-neutral-900 transition-colors group-hover:text-primary">
                            {props.name}
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 border-t border-border/40 pt-4">
                        <div className="space-y-1">
                            <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground font-bold">
                                <Activity className="h-3 w-3 text-emerald-500/50" /> Активні
                            </div>
                            <div className="text-sm font-bold text-emerald-600">
                                {props.activeProjects} проєктів
                            </div>
                        </div>

                        <div className="space-y-1 text-right">
                            <div className="flex items-center justify-end gap-1.5 text-[10px] text-muted-foreground font-bold">
                                <Briefcase className="h-3 w-3 text-primary/50" /> Всього
                            </div>
                            <div className="text-sm font-bold text-foreground">
                                {props.totalProjects} проєктів
                            </div>
                        </div>
                    </div>

                    <div className="mt-1 flex items-center justify-between border-t border-border/30 pt-4 opacity-100">
                        <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground font-bold">
                            <Calendar className="h-3 w-3 text-primary/40" /> 
                            {format(new Date(props.createdAt), "d MMM yyyy", { locale: uk })}
                        </div>
                        <div className="flex items-center gap-1.5 text-xs font-bold text-primary">
                            Профіль <ExternalLink className="h-3.5 w-3.5" />
                        </div>
                    </div>
                </div>
            </Card>
        </Link>
    );
}
