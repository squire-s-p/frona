import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthSession } from "@/lib/auth-session";

export async function POST(req: Request) {
  try {
    const session = await getAuthSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();

    const name = String(body?.name ?? "").trim();
    if (!name) {
      return NextResponse.json({ error: "Назва проєкту обовʼязкова" }, { status: 422 });
    }

    const priceRaw = body?.price;
    const price =
      priceRaw === null || priceRaw === undefined || String(priceRaw).trim() === ""
        ? null
        : String(priceRaw).replace(",", ".");

    const project = await prisma.project.create({
      data: {
        userId: session.user.id,
        name,
        source: body?.source ? String(body.source) : null,
        site: body?.website ? String(body.website) : null,
        cost: price ? price : null,
        accesses: body?.access ? String(body.access) : null,
        clientContact: body?.clientContact ? String(body.clientContact) : null,
        notes: body?.notes ? String(body.notes) : null,
      },
      select: { id: true },
    });

    return NextResponse.json({ ok: true, id: project.id });
  } catch (e: unknown) {
    console.error("POST /api/projects error:", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Не вдалося створити проєкт" },
      { status: 500 }
    );
  }
}
