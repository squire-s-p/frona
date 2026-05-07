import { getAuthSession } from "@/lib/auth-session";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";

export type RequireUserResult = {
  id: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
  timezone: string;
  dailyTargetHours: number;
};

export async function requireUser(): Promise<RequireUserResult> {
  const session = await getAuthSession();
  if (!session?.user?.id) redirect("/login");

  try {
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { id: true, name: true, email: true, image: true, timezone: true, dailyTargetHours: true },
    });

    if (!user) redirect("/login");
    return user;
  } catch {
    redirect("/login");
  }
}
