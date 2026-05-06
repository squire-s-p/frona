"use client";

import React from "react";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
    Briefcase,
    Target
} from "lucide-react";

import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from "@/components/ui/tabs";

interface ProjectProfitability {
    id: string;
    name: string;
    client: string;
    income: number;
    expenses: number;
    profit: number;
    margin: number;
    totalHours: number;
    hourlyRate: number;
    paidInvoices: number;
    roi: number;
    status: string;
}

interface ClientProfitability {
    name: string;
    income: number;
    expenses: number;
    profit: number;
    totalHours: number;
    projectsCount: number;
    paidInvoices: number;
    margin: number;
    hourlyRate: number;
}

interface ProjectsAnalyticsTabProps {
    projects: ProjectProfitability[];
    clients: ClientProfitability[];
}

export function ProjectsAnalyticsTab({ projects, clients }: ProjectsAnalyticsTabProps) {
    if ((!projects || projects.length === 0) && (!clients || clients.length === 0)) {
        return (
            <div className="h-[400px] flex flex-col items-center justify-center text-zinc-500 space-y-4">
                <Briefcase className="h-12 w-12 opacity-20" />
                <p>Немає даних по аналітиці за цей період.</p>
            </div>
        );
    }

    const totalProfit = projects.reduce((sum, p) => sum + p.profit, 0);
    const avgMargin = projects.length > 0 ? projects.reduce((sum, p) => sum + p.margin, 0) / projects.length : 0;

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-zinc-500">Загальний прибуток</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{new Intl.NumberFormat('uk-UA').format(totalProfit)} ₴</div>
                        <p className="text-xs text-zinc-500 mt-1">Обороти по всіх активних проектах</p>
                    </CardContent>
                </Card>
                <Card className="border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-zinc-500">Середня маржинальність</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{avgMargin.toFixed(1)}%</div>
                        <Progress value={Math.max(0, Math.min(100, avgMargin))} className="h-1.5 mt-2 bg-zinc-100 dark:bg-zinc-800" />
                    </CardContent>
                </Card>
                <Card className="border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-zinc-500">Кращий проект</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-lg font-bold truncate">{projects[0]?.name}</div>
                        <div className="flex items-center gap-2 mt-1">
                            <Badge variant="outline" className="text-[10px] py-0 border-zinc-200">
                                {projects[0]?.client}
                            </Badge>
                            <span className="text-xs text-green-600 font-bold">+{new Intl.NumberFormat('uk-UA').format(projects[0]?.profit)} ₴</span>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Tabs defaultValue="projects" className="space-y-4">
                <div className="flex items-center justify-between">
                    <TabsList className="bg-zinc-100 dark:bg-zinc-800 p-1 rounded-lg">
                        <TabsTrigger value="projects" className="text-xs data-[state=active]:bg-white dark:data-[state=active]:bg-zinc-900">Проекти</TabsTrigger>
                        <TabsTrigger value="clients" className="text-xs data-[state=active]:bg-white dark:data-[state=active]:bg-zinc-900">Клієнти</TabsTrigger>
                    </TabsList>
                    <Briefcase className="h-5 w-5 text-zinc-400" />
                </div>

                <TabsContent value="projects">
                    <Card className="border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50">
                        <CardHeader>
                            <CardTitle>Прибутковість проектів</CardTitle>
                            <CardDescription>Детальний аналіз фінансових показників у розрізі кожного проекту</CardDescription>
                        </CardHeader>
                        <CardContent className="p-0">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="pl-6">Проект / Клієнт</TableHead>
                                        <TableHead className="text-right">Дохід</TableHead>
                                        <TableHead className="text-right">Витрати</TableHead>
                                        <TableHead className="text-right">Чистий прибуток</TableHead>
                                        <TableHead className="text-right">Маржа</TableHead>
                                        <TableHead className="text-right">ROI</TableHead>
                                        <TableHead className="text-right">Еф. ставка</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {projects.map((project) => (
                                        <TableRow key={project.id} className="group hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors">
                                            <TableCell className="pl-6 py-4">
                                                <div className="font-medium text-zinc-900 dark:text-zinc-100">{project.name}</div>
                                                <div className="text-xs text-zinc-500">{project.client}</div>
                                            </TableCell>
                                            <TableCell className="text-right text-green-600 font-medium whitespace-nowrap">
                                                +{new Intl.NumberFormat('uk-UA').format(project.income)} ₴
                                            </TableCell>
                                            <TableCell className="text-right text-red-500 whitespace-nowrap">
                                                -{new Intl.NumberFormat('uk-UA').format(project.expenses)} ₴
                                            </TableCell>
                                            <TableCell className="text-right font-bold whitespace-nowrap">
                                                {new Intl.NumberFormat('uk-UA').format(project.profit)} ₴
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex flex-col items-end gap-1">
                                                    <span className="text-sm font-medium">{project.margin.toFixed(0)}%</span>
                                                    <Progress value={Math.max(0, project.margin)} className="h-1 w-16" />
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-right font-bold text-green-600 whitespace-nowrap">
                                                {project.roi > 0 ? `+${project.roi.toFixed(0)}%` : `${project.roi.toFixed(0)}%`}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex flex-col items-end">
                                                    <div className="text-sm font-bold flex items-center gap-1">
                                                        <Target className="h-3 w-3 text-zinc-400" />
                                                        {Math.round(project.hourlyRate)} ₴/год
                                                    </div>
                                                    <div className="text-[10px] text-zinc-400">{project.totalHours.toFixed(1)} год</div>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="clients">
                    <Card className="border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50">
                        <CardHeader>
                            <CardTitle>Прибутковість клієнтів</CardTitle>
                            <CardDescription>Агрегована статистика по всіх проектах кожного клієнта</CardDescription>
                        </CardHeader>
                        <CardContent className="p-0">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="pl-6">Клієнт</TableHead>
                                        <TableHead className="text-right">Проекти</TableHead>
                                        <TableHead className="text-right">Весь дохід</TableHead>
                                        <TableHead className="text-right">Чистий прибуток</TableHead>
                                        <TableHead className="text-right">Маржа</TableHead>
                                        <TableHead className="text-right">Еф. ставка</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {clients.map((client) => (
                                        <TableRow key={client.name} className="group hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors">
                                            <TableCell className="pl-6 py-4">
                                                <div className="font-bold text-zinc-900 dark:text-zinc-100">{client.name}</div>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <Badge variant="secondary">{client.projectsCount}</Badge>
                                            </TableCell>
                                            <TableCell className="text-right text-green-600 font-medium">
                                                +{new Intl.NumberFormat('uk-UA').format(client.income)} ₴
                                            </TableCell>
                                            <TableCell className="text-right font-bold">
                                                {new Intl.NumberFormat('uk-UA').format(client.profit)} ₴
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex flex-col items-end gap-1">
                                                    <span className="text-sm font-medium">{client.margin.toFixed(0)}%</span>
                                                    <Progress value={Math.max(0, client.margin)} className="h-1 w-16" />
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex flex-col items-end">
                                                    <div className="text-sm font-bold flex items-center gap-1">
                                                        <Target className="h-3 w-3 text-zinc-400" />
                                                        {Math.round(client.hourlyRate)} ₴/год
                                                    </div>
                                                    <div className="text-[10px] text-zinc-400">{client.totalHours.toFixed(1)} год</div>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
