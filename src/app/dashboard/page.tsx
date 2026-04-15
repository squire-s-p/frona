import { getFullDashboardData } from "@/app/dashboard/actions";
import { getAuthSession } from "@/lib/auth-session";
import { prisma } from "@/lib/prisma";
import { DashboardPageClient } from "@/components/dashboard/overview/dashboard-page-client";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Огляд",
};

export default async function DashboardPage() {
  const session = await getAuthSession();

  let userLayout = null;
  if (session?.user?.id) {
    const dbUser = await prisma.user.findUnique({
      where: { id: session.user.id },
    });
    userLayout = (dbUser as any)?.dashboardLayout;
  }

  const data = await getFullDashboardData();

  return (
    <DashboardPageClient initialLayout={userLayout} data={data} />
  );
}
