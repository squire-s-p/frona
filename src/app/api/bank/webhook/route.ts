import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  const requestId = request.headers.get("x-request-id");
  if (!requestId) {
    return NextResponse.json({ error: "Missing X-Request-Id header" }, { status: 400 });
  }

  const payload = await request.json().catch(() => null);

  try {
    const connection = await prisma.bankConnection.findFirst({
      where: { tokenRequestId: requestId },
      select: { id: true, status: true },
    });

    if (!connection) {
      return NextResponse.json({ error: "Connection not found" }, { status: 404 });
    }

    await prisma.bankWebhookEvent.create({
      data: {
        bankConnectionId: connection.id,
        eventType: "TRANSACTION",
        payload: payload ?? {},
      },
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[monobank-webhook] Error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  const { getAuthSession } = await import("@/lib/auth-session");
  const session = await getAuthSession();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const requestId = request.headers.get("x-request-id");
  if (!requestId) {
    return NextResponse.json({ error: "Missing X-Request-Id header" }, { status: 400 });
  }

  try {
    const connection = await prisma.bankConnection.findFirst({
      where: { tokenRequestId: requestId, userId: session.user.id },
      select: { id: true, status: true },
    });

    if (!connection) {
      return NextResponse.json({ error: "Connection not found" }, { status: 404 });
    }

    return NextResponse.json({ id: connection.id, status: connection.status });
  } catch (err) {
    console.error("[monobank-webhook] Callback GET error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

export const dynamic = "force-dynamic";
