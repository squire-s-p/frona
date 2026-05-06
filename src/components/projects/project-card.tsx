import Link from "next/link";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Calendar, Globe, Wallet, ExternalLink, User } from "lucide-react";
import { format } from "date-fns";
import { uk } from "date-fns/locale";

function formatUAH(value: string | null) {
    if (!value) return null;
    const num = Number(value);
    if (Number.isNaN(num)) return value;
    return new Intl.NumberFormat("uk-UA").format(num);
}

const statusConfig = {
    active: { 
        label: "Активний", 
        dotClass: "bg-emerald-500",
        textClass: "text-emerald-500 bg-emerald-500/10",
    },
    completed: { 
        label: "Завершений", 
        dotClass: "bg-blue-500",
        textClass: "text-blue-500 bg-blue-500/10",
    },
    archived: { 
        label: "Архів", 
        dotClass: "bg-muted-foreground/50",
        textClass: "text-muted-foreground bg-muted/20",
    },
};

export default function ProjectCard(props: {
    id: string;
    name: string;
    source?: string | null;
    site?: string | null;
    cost?: string | null;
    createdAt: string | Date;
    updatedAt?: string | Date;
    status?: "active" | "completed" | "archived";
    clientName?: string | null;
}) {
    const cost = formatUAH(props.cost ?? null);
    const status = props.status || "active";
    const config = statusConfig[status];

    return (
        <Link href={`/dashboard/projects/${props.id}`} className="group block">
            <Card className="relative rounded-2xl border border-border/60 dark:bg-neutral-900 bg-neutral-100 p-5 shadow-none transition-all hover:border-primary/40">
                {/* Status Indicator */}
                <div className="absolute right-4 top-4">
                    <div className={cn(
                        "inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-[10px] font-bold tracking-tight",
                        config.textClass
                    )}>
                        <span className={cn("h-1.5 w-1.5 rounded-full", config.dotClass)} />
                        {config.label}
                    </div>
                </div>

                <div className="flex flex-col gap-5">
                    <div className="space-y-1.5">
                        <div className="truncate pr-20 text-lg font-bold tracking-tight dark:text-white text-neutral-900">
                            {props.name}
                        </div>
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-semibold">
                            <div className="w-5 h-5 rounded-full bg-muted flex items-center justify-center">
                                <User className="h-3 w-3" />
                            </div>
                            <span>{props.clientName || "Без клієнта"}</span>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 border-t border-border/40 pt-4">
                        <div className="space-y-1">
                            <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground font-bold">
                                <Calendar className="h-3 w-3 text-primary/50" /> Створено
                            </div>
                            <div className="text-sm font-bold text-foreground/80">
                                {format(new Date(props.createdAt), "d MMM yyyy", { locale: uk })}
                            </div>
                        </div>

                        <div className="space-y-1 text-right">
                            <div className="flex items-center justify-end gap-1.5 text-[10px] text-muted-foreground font-bold">
                                <Wallet className="h-3 w-3 text-primary/50" /> Бюджет
                            </div>
                            <div className="text-sm font-bold text-foreground">
                                {cost ? `₴ ${cost}` : "—"}
                            </div>
                        </div>
                    </div>

                    <div className="mt-1 flex items-center justify-between border-t border-border/30 pt-4 opacity-100">
                        <div className="flex items-center gap-2 truncate text-[11px] font-bold text-muted-foreground">
                            <Globe className="h-3.3 w-3.5 shrink-0 text-primary/40" />
                            <span className="truncate max-w-[120px]">{props.site || "Сайт не вказано"}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-xs font-bold text-primary">
                            Деталі <ExternalLink className="h-3.5 w-3.5" />
                        </div>
                    </div>
                </div>
            </Card>
        </Link>
    );
}
