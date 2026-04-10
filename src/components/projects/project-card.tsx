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

const statusColors = {
    active: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
    completed: "bg-blue-500/10 text-blue-600 border-blue-500/20",
    archived: "bg-slate-500/10 text-slate-600 border-slate-500/20",
};

const statusLabels = {
    active: "Активний",
    completed: "Завершений",
    archived: "Архів",
};

export default function ProjectCard(props: {
    id: string;
    name: string;
    source?: string | null;
    site?: string | null;
    cost?: string | null;
    createdAt: Date;
    updatedAt?: Date;
    status?: "active" | "completed" | "archived";
    clientName?: string | null;
}) {
    const cost = formatUAH(props.cost ?? null);
    const status = props.status || "active";

    return (
        <Link href={`/dashboard/projects/${props.id}`} className="group block">
            <Card className="relative overflow-hidden rounded-2xl border-border/50 bg-card/50 p-5 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-primary/5 hover:border-primary/20 backdrop-blur-sm">
                {/* Status Badge */}
                <div className="absolute right-4 top-4">
                    <Badge variant="outline" className={cn("text-[10px] uppercase tracking-wider font-bold px-2 py-0 border", statusColors[status])}>
                        {statusLabels[status]}
                    </Badge>
                </div>

                <div className="flex flex-col gap-4">
                    <div className="space-y-1">
                        <div className="truncate pr-20 text-lg font-bold tracking-tight transition-colors group-hover:text-primary">
                            {props.name}
                        </div>
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium">
                            <span className="flex items-center gap-1">
                                <User className="h-3 w-3" />
                                {props.clientName || "Без клієнта"}
                            </span>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 border-t border-border/50 pt-4">
                        <div className="space-y-1">
                            <div className="flex items-center gap-1 text-[10px] uppercase tracking-wider text-muted-foreground font-bold">
                                <Calendar className="h-3 w-3" /> Створено
                            </div>
                            <div className="text-sm font-semibold">
                                {format(new Date(props.createdAt), "d MMM yyyy", { locale: uk })}
                            </div>
                        </div>

                        <div className="space-y-1 text-right">
                            <div className="flex items-center justify-end gap-1 text-[10px] uppercase tracking-wider text-muted-foreground font-bold">
                                <Wallet className="h-3 w-3" /> Бюджет
                            </div>
                            <div className="text-sm font-bold text-foreground">
                                {cost ? `₴ ${cost}` : "—"}
                            </div>
                        </div>
                    </div>

                    <div className="mt-1 flex items-center justify-between border-t border-border/40 pt-4 opacity-70 transition-opacity group-hover:opacity-100">
                        <div className="flex items-center gap-2 truncate text-xs font-medium text-muted-foreground whitespace-nowrap overflow-hidden">
                            <Globe className="h-3 w-3 shrink-0" />
                            <span className="truncate pr-4">{props.site || "Сайт не вказано"}</span>
                        </div>
                        <div className="flex items-center gap-1 text-xs font-bold text-primary">
                            Деталі <ExternalLink className="h-3 w-3" />
                        </div>
                    </div>
                </div>

                {/* Decorative element */}
                <div className="absolute -right-4 -bottom-4 h-24 w-24 rounded-full bg-primary/5 blur-2xl transition-all duration-500 group-hover:bg-primary/10" />
            </Card>
        </Link>
    );
}
