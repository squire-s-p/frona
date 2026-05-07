import { NextResponse } from "next/server";
import { getAuthSession } from "@/lib/auth-session";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getAuthSession();
  const userId = session?.user?.id;

  if (!userId) {
    return NextResponse.json(null);
  }

  const active = await prisma.activeTimer.findUnique({
    where: { userId },
    select: { userId: true, mode: true, projectId: true, taskId: true, startedAt: true },
  });

  if (!active) return NextResponse.json(null);

  return NextResponse.json({
    mode: active.mode,
    projectId: active.projectId,
    taskId: active.taskId ?? null,
    startAt: active.startedAt.toISOString(),
  });
}
