import { NextResponse } from "next/server";
import { getAuthSession } from "@/lib/auth-session";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getAuthSession();
  const userId = session?.user?.id;

  if (!userId) {
    return NextResponse.json(null);
  }

  const active = await prisma.timeEntry.findFirst({
    where: { userId, endAt: null },
    orderBy: { startAt: "desc" },
    select: { id: true, projectId: true, taskId: true, startAt: true },
  });

  if (!active) return NextResponse.json(null);

  return NextResponse.json({
    id: active.id,
    projectId: active.projectId,
    taskId: active.taskId ?? null,
    startAt: active.startAt.toISOString(),
  });
}
