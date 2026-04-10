
"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { startOfDay, endOfDay, parseISO, startOfMonth, endOfMonth } from "date-fns";
import { getAuthSession } from "@/lib/auth-session";

export type ProjectSummaryItem = {
    projectId: string;
    projectName: string;
    clientName: string | null;
    totalDuration: number;
    previousDuration?: number; // for comparison
    growth?: number; // percentage
};

export type ReportFilterState = {
    projectIds?: string[];
    clientIds?: string[];
    userIds?: string[]; // Team filter
    tagIds?: string[];
};

export async function getProjectsSummary(
    dateRange: { from: string; to: string },
    filters?: ReportFilterState
): Promise<ProjectSummaryItem[]> {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
        throw new Error("Unauthorized");
    }

    const userId = session.user.id;
    const from = startOfDay(parseISO(dateRange.from));
    const to = endOfDay(parseISO(dateRange.to));

    // Calculate previous period
    const durationMs = to.getTime() - from.getTime();
    const prevTo = new Date(from.getTime() - 1);
    const prevFrom = new Date(prevTo.getTime() - durationMs);

    const buildWhere = (f: Date, t: Date) => {
        const w: any = {
            userId: userId,
            startAt: { gte: f, lte: t },
            type: "work",
        };
        if (filters?.userIds?.length) w.userId = { in: filters.userIds };
        if (filters?.projectIds?.length) w.projectId = { in: filters.projectIds };
        if (filters?.tagIds?.length) w.tags = { some: { id: { in: filters.tagIds } } };
        return w;
    };

    const where = buildWhere(from, to);

    // Filter project IDs by client if needed
    if (filters?.clientIds?.length) {
        const clientProjects = await prisma.project.findMany({
            where: { clientId: { in: filters.clientIds } },
            select: { id: true }
        });
        const clientProjectIds = clientProjects.map(p => p.id);
        if (where.projectId) {
            where.projectId = { in: (where.projectId.in as string[]).filter(id => clientProjectIds.includes(id)) };
        } else {
            where.projectId = { in: clientProjectIds };
        }
    }

    // Fetch current data
    const grouped = await prisma.timeEntry.groupBy({
        by: ["projectId"],
        where,
        _sum: { durationSec: true },
    });

    // Fetch previous data for comparison
    const wherePrev = buildWhere(prevFrom, prevTo);
    if (where.projectId) wherePrev.projectId = where.projectId;

    const groupedPrev = await prisma.timeEntry.groupBy({
        by: ["projectId"],
        where: wherePrev,
        _sum: { durationSec: true },
    });

    const prevMap = new Map(groupedPrev.map(g => [g.projectId, g._sum.durationSec ?? 0]));

    const activeProjectIds = grouped
        .map((g) => g.projectId)
        .filter((id): id is string => id !== null);

    const projects = await prisma.project.findMany({
        where: { id: { in: activeProjectIds } },
        include: { client: true },
    });

    const projectMap = new Map(projects.map((p) => [p.id, p]));

    const result: ProjectSummaryItem[] = grouped
        .filter(g => g.projectId !== null)
        .map(g => {
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
                growth: growth
            };
        });

    result.sort((a, b) => b.totalDuration - a.totalDuration);
    return result;
}

export async function getReportMetaData() {
    const session = await getAuthSession();
    if (!session?.user?.id) throw new Error("Unauthorized");

    const userId = session.user.id;

    const projects = await prisma.project.findMany({
        where: { userId },
        select: { id: true, name: true, clientId: true },
        orderBy: { name: "asc" }
    });

    const clients = await prisma.client.findMany({
        where: { userId },
        select: { id: true, name: true },
        orderBy: { name: "asc" }
    });

    const tags = await prisma.tag.findMany({
        where: { userId },
        select: { id: true, name: true },
        orderBy: { name: "asc" }
    });

    // In a multi-user workspace, we'd fetch team members here.
    // For now, just the current user as "Team".
    const team = [
        { id: userId, name: session.user.name || "Я" }
    ];

    return { projects, clients, tags, team };
}

export async function getDashboardSummary() {
    const session = await getAuthSession();
    if (!session?.user?.id) throw new Error("Unauthorized");

    const userId = session.user.id;
    const now = new Date();
    const from = startOfMonth(now);
    const to = endOfMonth(now);

    const totalWork = await prisma.timeEntry.aggregate({
        where: {
            userId,
            type: "work",
            startAt: { gte: from, lte: to }
        },
        _sum: { durationSec: true }
    });

    const projectCount = await prisma.project.count({
        where: {
            userId,
            timeEntries: {
                some: { startAt: { gte: from, lte: to } }
            }
        }
    });

    const activeTimer = await prisma.timeEntry.findFirst({
        where: { userId, endAt: null },
        include: { project: true }
    });

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
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) throw new Error("Unauthorized");

    const userId = session.user.id;
    const from = startOfDay(parseISO(dateRange.from));
    const to = endOfDay(parseISO(dateRange.to));

    // Fetch grouped tasks for this project
    const tasks = await prisma.timeEntry.groupBy({
        by: ["note"],
        where: {
            userId,
            projectId,
            type: "work",
            startAt: { gte: from, lte: to }
        },
        _sum: { durationSec: true },
    });

    tasks.sort((a, b) => (b._sum?.durationSec ?? 0) - (a._sum?.durationSec ?? 0));

    return tasks.map(t => ({
        note: t.note || "Без опису",
        duration: t._sum?.durationSec ?? 0
    }));
}
