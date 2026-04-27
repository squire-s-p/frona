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
            <Card className="relative overflow-hidden rounded-2xl border-border/50 bg-card/50 p-4 transition-all duration-300 hover:border-primary/20 backdrop-blur-sm shadow-none">
                <div className="flex flex-col gap-4">
                    <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3 min-w-0">
                            <div className="w-10 h-10 rounded-xl bg-primary/5 border border-primary/10 flex items-center justify-center shrink-0 group-hover:bg-primary/10 transition-colors">
                                <User className="h-4.5 w-4.5 text-primary/70 group-hover:text-primary" />
                            </div>
                            <div className="truncate text-lg font-bold tracking-tight transition-colors group-hover:text-primary">
                                {props.name}
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div className="rounded-xl bg-muted/20 p-3 border border-border/40 transition-colors group-hover:border-primary/10 group-hover:bg-primary/[0.02]">
                            <div className="flex items-center gap-1.5 text-[10px] uppercase font-bold text-muted-foreground/50 tracking-wider mb-1">
                                <Activity className="h-3 w-3" /> Активні
                            </div>
                            <div className="text-lg font-mono font-bold text-emerald-600">
                                {props.activeProjects}
                            </div>
                        </div>
                        <div className="rounded-xl bg-muted/20 p-3 border border-border/40 transition-colors group-hover:border-primary/10 group-hover:bg-primary/[0.02]">
                            <div className="flex items-center justify-end gap-1.5 text-[10px] uppercase font-bold text-muted-foreground/50 tracking-wider mb-1">
                                <Briefcase className="h-3 w-3" /> Всього
                            </div>
                            <div className="text-lg font-mono font-bold text-foreground text-right">
                                {props.totalProjects}
                            </div>
                        </div>
                    </div>

                    <div className="mt-1 flex items-center justify-between border-t border-border/40 pt-4 opacity-70 transition-opacity group-hover:opacity-100">
                        <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-muted-foreground/60 font-bold">
                            <Calendar className="h-3 w-3" /> 
                            {format(new Date(props.createdAt), "d MMM yyyy", { locale: uk })}
                        </div>
                        <div className="flex items-center gap-1 text-xs font-bold text-primary">
                            Профіль <ExternalLink className="h-3 w-3" />
                        </div>
                    </div>
                </div>

                {/* Decorative background element */}
                <div className="absolute -right-4 -bottom-4 h-24 w-24 rounded-full bg-primary/5 blur-2xl transition-all duration-500 group-hover:bg-primary/10" />
            </Card>
        </Link>
    );
}
