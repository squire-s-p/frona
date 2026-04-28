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
    try {
      const dbUser = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { dashboardLayout: true }
      });
      userLayout = dbUser?.dashboardLayout;
    } catch (e) {
      console.error("Failed to load user layout:", e);
    }
  }

  const data = await getFullDashboardData();

  return (
    <DashboardPageClient initialLayout={userLayout} data={data} />
  );
}
