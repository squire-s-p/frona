import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthSession } from "@/lib/auth-session";

function startOfDay(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

export async function GET(
  req: Request,
  { params }: { params: Promise<{ projectId: string }> }
) {
  const { projectId } = await params;
  const session = await getAuthSession();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const url = new URL(req.url);
  const range = url.searchParams.get("range") || "30"; // "7" | "30" | "90"
  const days = Math.max(1, Math.min(365, Number(range) || 30));

  const now = new Date();
  const from = new Date(now);
  from.setDate(from.getDate() - (days - 1));
  const fromDay = startOfDay(from);

  const entries = await prisma.timeEntry.findMany({
    where: {
      projectId: projectId,
      userId: session.user.id,
      startAt: { gte: fromDay },
    },
    select: {
      startAt: true,
      endAt: true,
    },
    orderBy: { startAt: "asc" },
  });

  // map day -> minutes
  const byDay = new Map<string, number>();

  for (const e of entries) {
    if (!e.endAt) continue;
    const day = startOfDay(e.startAt).toISOString().slice(0, 10);
    const minutes = Math.max(0, Math.round((e.endAt.getTime() - e.startAt.getTime()) / 60000));
    byDay.set(day, (byDay.get(day) || 0) + minutes);
  }

  // fill missing days
  const data = [];
  for (let i = 0; i < days; i++) {
    const d = new Date(fromDay);
    d.setDate(d.getDate() + i);
    const key = d.toISOString().slice(0, 10);
    const minutes = byDay.get(key) || 0;
    data.push({
      date: key,
      minutes,
      hours: Math.round((minutes / 60) * 100) / 100,
    });
  }

  const totalMinutes = data.reduce((sum, x) => sum + x.minutes, 0);

  return NextResponse.json({
    rangeDays: days,
    totalMinutes,
    totalHours: Math.round((totalMinutes / 60) * 100) / 100,
    data,
  });
}
