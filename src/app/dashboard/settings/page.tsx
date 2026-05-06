import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { User, Palette, ShieldCheck, Plug, TriangleAlert } from "lucide-react";

import { getAuthSession } from "@/lib/auth-session";
import { prisma } from "@/lib/prisma";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ProfileForm } from "@/components/settings/profile-form";
import { AppearanceForm } from "@/components/settings/appearance-form";
import { SecurityForm } from "@/components/settings/security-form";
import { IntegrationsForm } from "@/components/settings/integrations-form";
import { DangerZoneForm } from "@/components/settings/danger-zone-form";
import { getBankAccounts } from "@/modules/bank/bank.actions";
import {
  DashboardPage,
  DashboardPageHeader,
} from "@/components/layout/dashboard-page";

export const metadata: Metadata = {
  title: "Налаштування",
};

export default async function SettingsPage() {
  const session = await getAuthSession();

  if (!session?.user) {
    redirect("/login");
  }

  let dbUser: { id: string; name?: string | null; email?: string | null; image?: string | null; targetHourlyRate?: number } | null = null;
  try {
    dbUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        targetHourlyRate: true,
      },
    });
  } catch {
    try {
      dbUser = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { id: true, name: true, email: true, image: true },
      });
    } catch {
      dbUser = session.user;
    }
  }

  const user = dbUser || session.user;

  let isMonoConnected = false;
  try {
    const monoAccounts = await getBankAccounts();
    isMonoConnected = monoAccounts.length > 0;
  } catch {}

  let isGoogleConnected = false;
  try {
    const googleAccount = await prisma.account.findFirst({
      where: { userId: user.id, provider: "google" },
    });
    isGoogleConnected = !!googleAccount?.scope?.includes("calendar");
  } catch {}

  let deviceSessions: { id: string; userId: string; userAgent: string | null; ipAddress: string | null; browser: string | null; os: string | null; device: string | null; lastActive: Date; createdAt: Date }[] = [];
  try {
    deviceSessions = await prisma.deviceSession.findMany({
      where: { userId: user.id },
      orderBy: { lastActive: "desc" },
    });
  } catch {}

  let hasPassword = false;
  try {
    const userPassword = await prisma.userPassword.findUnique({
      where: { userId: user.id },
    });
    hasPassword = !!userPassword;
  } catch {}

  const currentSessionId = session?.deviceSessionId;

  return (
    <DashboardPage>
      <DashboardPageHeader
        title="Налаштування"
        description="Акаунт, безпека, інтерфейс та інтеграції"
      />

      <Tabs defaultValue="account" className="w-full">
        <TabsList variant="line" className="h-10 gap-6">
          <TabsTrigger value="account" className="px-0">
            <User className="h-4 w-4" />
            Акаунт
          </TabsTrigger>
          <TabsTrigger value="security" className="px-0">
            <ShieldCheck className="h-4 w-4" />
            Безпека
          </TabsTrigger>
          <TabsTrigger value="appearance" className="px-0">
            <Palette className="h-4 w-4" />
            Інтерфейс
          </TabsTrigger>
          <TabsTrigger value="integrations" className="px-0">
            <Plug className="h-4 w-4" />
            Інтеграції
          </TabsTrigger>
          <TabsTrigger value="danger-zone" className="px-0">
            <TriangleAlert className="h-4 w-4" />
            Danger Zone
          </TabsTrigger>
        </TabsList>

        <TabsContent value="account" className="m-0">
          <ProfileForm user={user} />
        </TabsContent>

        <TabsContent value="security" className="m-0">
          <SecurityForm
            deviceSessions={deviceSessions}
            currentSessionId={currentSessionId}
            hasPassword={hasPassword}
          />
        </TabsContent>

        <TabsContent value="appearance" className="m-0">
          <AppearanceForm />
        </TabsContent>

        <TabsContent value="integrations" className="m-0">
          <IntegrationsForm
            isMonoConnected={isMonoConnected}
            isGoogleConnected={isGoogleConnected}
          />
        </TabsContent>

        <TabsContent value="danger-zone" className="m-0">
          <DangerZoneForm />
        </TabsContent>
      </Tabs>
    </DashboardPage>
  );
}
