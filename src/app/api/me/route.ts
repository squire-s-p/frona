import { NextResponse } from "next/server";
import { getAuthSession } from "@/lib/auth-session";

export async function GET() {
  const session = await getAuthSession();
  if (!session?.user) return NextResponse.json({ ok: false }, { status: 401 });

  return NextResponse.json({ ok: true, user: session.user });
}
