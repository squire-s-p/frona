import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthSession } from "@/lib/auth-session";

export async function GET() {
    const session = await getAuthSession();
    const userId = session?.user?.id;

    if (!userId) {
        return NextResponse.json({ error: "Not logged in" }, { status: 401 });
    }

    // Delete the Google provider entry for this user
    await prisma.account.deleteMany({
        where: {
            userId,
            provider: "google",
        },
    });

    // Redirect to logout to fully reset NextAuth session
    return NextResponse.redirect(new URL("/api/auth/signout", process.env.NEXTAUTH_URL ?? "http://localhost:3000"));
}
