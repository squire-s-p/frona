import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
        badgeVariant: "default" as const,
        className: "bg-primary/10 text-primary border-primary/20 hover:bg-primary/15" 
    },
    completed: { 
        label: "Завершений", 
        badgeVariant: "secondary" as const,
        className: "bg-muted text-muted-foreground border-border hover:bg-muted/80" 
    },
    archived: { 
        label: "Архів", 
        badgeVariant: "secondary" as const,
        className: "bg-muted text-muted-foreground border-border hover:bg-muted/80" 
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
            <Card className="relative overflow-hidden rounded-2xl border-border/50 bg-card/40 p-5 transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl hover:shadow-primary/5 hover:border-primary/30 backdrop-blur-sm">
                {/* Status Badge */}
                <div className="absolute right-4 top-4">
                    <Badge 
                        variant={config.badgeVariant} 
                        className={cn("text-[10px] uppercase tracking-widest font-bold px-2 py-0.5 border shadow-sm transition-colors", config.className)}
                    >
                        {config.label}
                    </Badge>
                </div>

                <div className="flex flex-col gap-5">
                    <div className="space-y-1.5">
                        <div className="truncate pr-20 text-lg font-bold tracking-tight transition-colors group-hover:text-primary">
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
                            <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-widest text-muted-foreground font-bold">
                                <Calendar className="h-3 w-3 text-primary/50" /> Створено
                            </div>
                            <div className="text-sm font-bold text-foreground/80">
                                {format(new Date(props.createdAt), "d MMM yyyy", { locale: uk })}
                            </div>
                        </div>

                        <div className="space-y-1 text-right">
                            <div className="flex items-center justify-end gap-1.5 text-[10px] uppercase tracking-widest text-muted-foreground font-bold">
                                <Wallet className="h-3 w-3 text-primary/50" /> Бюджет
                            </div>
                            <div className="text-sm font-bold text-foreground">
                                {cost ? `₴ ${cost}` : "—"}
                            </div>
                        </div>
                    </div>

                    <div className="mt-1 flex items-center justify-between border-t border-border/30 pt-4 opacity-60 transition-opacity group-hover:opacity-100">
                        <div className="flex items-center gap-2 truncate text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                            <Globe className="h-3.3 w-3.5 shrink-0 text-primary/40" />
                            <span className="truncate max-w-[120px]">{props.site || "Сайт не вказано"}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-xs font-bold text-primary group-hover:gap-2 transition-all">
                            Деталі <ExternalLink className="h-3.5 w-3.5" />
                        </div>
                    </div>
                </div>

                {/* Subtle gradient overlay on hover */}
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
            </Card>
        </Link>
    );
}
