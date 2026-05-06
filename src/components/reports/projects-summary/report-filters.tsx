"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";

import { ReportFilterState } from "@/app/dashboard/reports/actions";

type MetaItem = { id: string; name: string };

type Props = {
    metaData: {
        projects: MetaItem[];
        clients: MetaItem[];
        tags: MetaItem[];
        team: MetaItem[];
    };
    filters: ReportFilterState;
    onChangeAction: (filters: ReportFilterState) => void;
};

export default function ReportFilters({ metaData, filters, onChangeAction }: Props) {
    const [_teamOpen, _setTeamOpen] = React.useState(false);
    const [clientOpen, setClientOpen] = React.useState(false);
    const [_tagOpen, _setTagOpen] = React.useState(false);
    const [projectOpen, setProjectOpen] = React.useState(false);

    const toggleFilter = (key: keyof ReportFilterState, id: string) => {
        const current = filters[key] || [];
        const next = current.includes(id)
            ? current.filter(i => i !== id)
            : [...current, id];

        onChangeAction({ ...filters, [key]: next.length ? next : undefined });
    };

    const getLabel = (key: keyof ReportFilterState, items: MetaItem[], prefix: string) => {
        const selected = filters[key] || [];
        if (selected.length === 0) return `${prefix}: Усі`;
        if (selected.length === 1) {
            const item = items.find(i => i.id === selected[0]);
            return `${prefix}: ${item?.name || selected[0]}`;
        }
        return `${prefix}: Обрано (${selected.length})`;
    };

    return (
        <div className="flex flex-wrap gap-2">
            {/* Client Filter */}
            <Popover open={clientOpen} onOpenChange={setClientOpen}>
                <PopoverTrigger asChild>
                    <Button variant="outline" role="combobox" aria-expanded={clientOpen} className="justify-between h-9">
                        {getLabel("clientIds", metaData.clients, "Клієнт")}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[200px] p-0" align="start">
                    <Command>
                        <CommandInput placeholder="Пошук клієнта..." />
                        <CommandList>
                            <CommandEmpty>Нічого не знайдено.</CommandEmpty>
                            <CommandGroup title="Клієнти">
                                <CommandItem
                                    value="all"
                                    onSelect={() => {
                                        onChangeAction({ ...filters, clientIds: undefined });
                                        setClientOpen(false);
                                    }}
                                >
                                    <Check className={cn("mr-2 h-4 w-4", !filters.clientIds ? "opacity-100" : "opacity-0")} />
                                    Усі
                                </CommandItem>
                                {metaData.clients.map(item => (
                                    <CommandItem
                                        key={item.id}
                                        value={item.id}
                                        onSelect={() => toggleFilter("clientIds", item.id)}
                                    >
                                        <Check className={cn("mr-2 h-4 w-4", filters.clientIds?.includes(item.id) ? "opacity-100" : "opacity-0")} />
                                        {item.name}
                                    </CommandItem>
                                ))}
                            </CommandGroup>
                        </CommandList>
                    </Command>
                </PopoverContent>
            </Popover>

            {/* Project Filter */}
            <Popover open={projectOpen} onOpenChange={setProjectOpen}>
                <PopoverTrigger asChild>
                    <Button variant="outline" role="combobox" aria-expanded={projectOpen} className="justify-between h-9">
                        {getLabel("projectIds", metaData.projects, "Проєкти")}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[200px] p-0" align="start">
                    <Command>
                        <CommandInput placeholder="Пошук проєкту..." />
                        <CommandList>
                            <CommandEmpty>Нічого не знайдено.</CommandEmpty>
                            <CommandGroup title="Проєкти">
                                <CommandItem
                                    value="all"
                                    onSelect={() => {
                                        onChangeAction({ ...filters, projectIds: undefined });
                                        setProjectOpen(false);
                                    }}
                                >
                                    <Check className={cn("mr-2 h-4 w-4", !filters.projectIds ? "opacity-100" : "opacity-0")} />
                                    Усі
                                </CommandItem>
                                {metaData.projects.map(item => (
                                    <CommandItem
                                        key={item.id}
                                        value={item.id}
                                        onSelect={() => toggleFilter("projectIds", item.id)}
                                    >
                                        <Check className={cn("mr-2 h-4 w-4", filters.projectIds?.includes(item.id) ? "opacity-100" : "opacity-0")} />
                                        {item.name}
                                    </CommandItem>
                                ))}
                            </CommandGroup>
                        </CommandList>
                    </Command>
                </PopoverContent>
            </Popover>
        </div>
    );
}
