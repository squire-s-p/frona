"use server";

import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { requireUser } from "@/lib/require-user";
import { getUtcDayRange, getUtcMonthRange } from "@/lib/time/day-range";

export type ProjectSummaryItem = {
    projectId: string;
    projectName: string;
    clientName: string | null;
    totalDuration: number;
    previousDuration?: number;
    growth?: number;
};

export type ReportFilterState = {
    projectIds?: string[];
    clientIds?: string[];
    userIds?: string[];
    tagIds?: string[];
};

export async function getProjectsSummary(
    dateRange: { from: string; to: string },
    filters?: ReportFilterState
): Promise<ProjectSummaryItem[]> {
    const user = await requireUser();

    const from = getUtcDayRange(dateRange.from, user.timezone).start;
    const to = getUtcDayRange(dateRange.to, user.timezone).end;

    const durationMs = to.getTime() - from.getTime();
    const prevTo = new Date(from.getTime() - 1);
    const prevFrom = new Date(prevTo.getTime() - durationMs);

    const buildWhere = (f: Date, t: Date): Prisma.TimeEntryWhereInput => {
        const w: Prisma.TimeEntryWhereInput = {
            userId: user.id,
            startAt: { gte: f, lte: t },
            type: "work",
        };
        if (filters?.projectIds?.length) w.projectId = { in: filters.projectIds };
        if (filters?.tagIds?.length) w.task = { taskTags: { some: { tagId: { in: filters.tagIds } } } };
        return w;
    };

    const where = buildWhere(from, to);

    if (filters?.clientIds?.length) {
        const clientProjects = await prisma.project.findMany({
            where: { clientId: { in: filters.clientIds } },
            select: { id: true }
        });
        const clientProjectIds = clientProjects.map((p) => p.id);
        if (where.projectId && typeof where.projectId === "object" && "in" in (where.projectId as object)) {
            const existing = (where.projectId as { in: string[] }).in;
            where.projectId = { in: existing.filter(id => clientProjectIds.includes(id)) };
        } else {
            where.projectId = { in: clientProjectIds };
        }
    }

    const grouped = await prisma.timeEntry.groupBy({
        by: ["projectId"],
        where,
        _sum: { durationSec: true },
    });

    const wherePrev = buildWhere(prevFrom, prevTo);
    if (where.projectId) wherePrev.projectId = where.projectId;

    const groupedPrev = await prisma.timeEntry.groupBy({
        by: ["projectId"],
        where: wherePrev,
        _sum: { durationSec: true },
    });

    const prevMap = new Map<string | null, number>(groupedPrev.map((g) => [g.projectId, g._sum.durationSec ?? 0]));

    const activeProjectIds = grouped
        .map((g) => g.projectId)
        .filter((id): id is string => id !== null);

    const projects = await prisma.project.findMany({
        where: { id: { in: activeProjectIds } },
        include: { client: true },
    });

    const projectMap = new Map(projects.map((p) => [p.id, p]));

    const result: ProjectSummaryItem[] = grouped
        .filter((g) => g.projectId !== null)
        .map((g) => {
            const pid = g.projectId as string;
            const project = projectMap.get(pid);
            const current = g._sum.durationSec ?? 0;
            const previous = prevMap.get(pid) ?? 0;

            let growth: number | undefined = undefined;
            if (previous > 0) {
                growth = ((current - previous) / previous) * 100;
            }

            return {
                projectId: pid,
                projectName: project?.name ?? "Unknown Project",
                clientName: project?.client?.name ?? "Немає клієнта",
                totalDuration: current,
                previousDuration: previous,
                growth
            };
        });

    result.sort((a, b) => b.totalDuration - a.totalDuration);
    return result;
}

export async function getReportMetaData() {
    const user = await requireUser();

    const [projects, clients, tags] = await Promise.all([
        prisma.project.findMany({
            where: { userId: user.id },
            select: { id: true, name: true, clientId: true },
            orderBy: { name: "asc" }
        }),
        prisma.client.findMany({
            where: { userId: user.id },
            select: { id: true, name: true },
            orderBy: { name: "asc" }
        }),
        prisma.tag.findMany({
            where: { userId: user.id },
            select: { id: true, name: true },
            orderBy: { name: "asc" }
        }),
    ]);

    const team = [{ id: user.id, name: user.name || "Я" }];

    return { projects, clients, tags, team };
}

export async function getDashboardSummary() {
    const user = await requireUser();

    const { start: monthStart, end: monthEnd } = getUtcMonthRange(user.timezone);

    const [totalWork, projectCount, activeTimer] = await Promise.all([
        prisma.timeEntry.aggregate({
            where: {
                userId: user.id,
                type: "work",
                startAt: { gte: monthStart, lte: monthEnd }
            },
            _sum: { durationSec: true }
        }),
        prisma.project.count({
            where: {
                userId: user.id,
                timeEntries: {
                    some: { startAt: { gte: monthStart, lte: monthEnd } }
                }
            }
        }),
        prisma.activeTimer.findUnique({
            where: { userId: user.id },
            include: { project: true }
        }),
    ]);

    return {
        totalDuration: totalWork._sum.durationSec ?? 0,
        projectCount,
        hasActiveTimer: !!activeTimer,
        activeProjectName: activeTimer?.project?.name
    };
}

export async function getProjectTaskDetails(
    projectId: string,
    dateRange: { from: string; to: string }
) {
    const user = await requireUser();

    const from = getUtcDayRange(dateRange.from, user.timezone).start;
    const to = getUtcDayRange(dateRange.to, user.timezone).end;

    const tasks = await prisma.timeEntry.groupBy({
        by: ["note"],
        where: {
            userId: user.id,
            projectId,
            type: "work",
            startAt: { gte: from, lte: to }
        },
        _sum: { durationSec: true },
    });

    tasks.sort((a, b) => (b._sum?.durationSec ?? 0) - (a._sum?.durationSec ?? 0));

    return tasks.map((t) => ({
        note: t.note || "Без опису",
        duration: t._sum?.durationSec ?? 0
    }));
}
