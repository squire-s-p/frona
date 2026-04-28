import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Налаштування',
};

import { getAuthSession } from "@/lib/auth-session";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { User, Palette, ShieldCheck } from "lucide-react";
import { ProfileForm } from "@/components/settings/profile-form";
import { AppearanceForm } from "@/components/settings/appearance-form";
import { SecurityForm } from "@/components/settings/security-form";
import { IntegrationsForm } from "@/components/settings/integrations-form";
import { DangerZoneForm } from "@/components/settings/danger-zone-form";
import { getBankAccounts } from "@/modules/bank/bank.actions";

export default async function SettingsPage() {
  const session = await getAuthSession();

  if (!session?.user) {
    redirect("/login");
  }

  let dbUser: any = null;
  try {
    dbUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        targetHourlyRate: true,
      }
    });
  } catch (e) {
    try {
        dbUser = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: { id: true, name: true, email: true, image: true }
        });
    } catch (e2) {
        dbUser = session.user;
    }
  }
  
  const user = dbUser || session.user;
  
  let isMonoConnected = false;
  try {
    const monoAccounts = await getBankAccounts();
    isMonoConnected = monoAccounts.length > 0;
  } catch (e) {}

  let isGoogleConnected = false;
  try {
    const googleAccount = await prisma.account.findFirst({
        where: { userId: user.id, provider: "google" },
    });
    isGoogleConnected = !!googleAccount?.scope?.includes("calendar");
  } catch (e) {}

  let deviceSessions: any[] = [];
  try {
    deviceSessions = await prisma.deviceSession.findMany({
        where: { userId: user.id },
        orderBy: { lastActive: "desc" }
    });
  } catch (e) {}

  let hasPassword = false;
  try {
    const userPassword = await prisma.userPassword.findUnique({
        where: { userId: user.id },
    });
    hasPassword = !!userPassword;
  } catch (e) {}

  const currentSessionId = (session as any).deviceSessionId;

  return (
    <div className="absolute inset-0 overflow-y-auto scrollbar-hide bg-background">
      <div className="p-4 md:p-6 pb-20 flex flex-col gap-6 min-h-0 w-full anim-fade-in">

        <Tabs defaultValue="account" className="flex flex-col gap-6 w-full">
          <TabsList className="inline-flex self-start h-12 max-w-full items-center justify-start overflow-x-auto rounded-xl bg-muted/50 p-1 text-muted-foreground border shadow-none scrollbar-hide">
            <TabsTrigger value="account" className="rounded-lg px-6 py-2 gap-2 whitespace-nowrap data-[state=active]:bg-background data-[state=active]:shadow-none transition-all text-xs font-bold md:text-sm">
              <User className="h-4 w-4 shrink-0" />
              Акаунт
            </TabsTrigger>
            <TabsTrigger value="security" className="rounded-lg px-6 py-2 gap-2 whitespace-nowrap data-[state=active]:bg-background data-[state=active]:shadow-none transition-all text-xs font-bold md:text-sm">
              <ShieldCheck className="h-4 w-4 shrink-0" />
              Безпека
            </TabsTrigger>
            <TabsTrigger value="appearance" className="rounded-lg px-6 py-2 gap-2 whitespace-nowrap data-[state=active]:bg-background data-[state=active]:shadow-none transition-all text-xs font-bold md:text-sm">
              <Palette className="h-4 w-4 shrink-0" />
              Інтерфейс
            </TabsTrigger>
            <TabsTrigger value="integrations" className="rounded-lg px-6 py-2 gap-2 whitespace-nowrap data-[state=active]:bg-background data-[state=active]:shadow-none transition-all text-xs font-bold md:text-sm">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0"><path d="M15 6v12a3 3 0 1 0 3-3H6a3 3 0 1 0 3 3V6a3 3 0 1 0-3 3h12a3 3 0 1 0-3-3"/></svg>
              Інтеграції
            </TabsTrigger>
            <TabsTrigger value="danger-zone" className="rounded-lg px-6 py-2 gap-2 whitespace-nowrap data-[state=active]:bg-red-500/10 data-[state=active]:text-red-500 data-[state=active]:shadow-none transition-all text-xs font-bold md:text-sm">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" x2="10" y1="11" y2="17"/><line x1="14" x2="14" y1="11" y2="17"/></svg>
              Danger Zone
            </TabsTrigger>
          </TabsList>

          <TabsContent value="account" className="m-0 outline-none">
            <ProfileForm user={user} />
          </TabsContent>

          <TabsContent value="security" className="m-0 outline-none">
            <SecurityForm deviceSessions={deviceSessions} currentSessionId={currentSessionId} hasPassword={hasPassword} />
          </TabsContent>

          <TabsContent value="appearance" className="m-0 outline-none">
            <AppearanceForm />
          </TabsContent>

          <TabsContent value="integrations" className="m-0 outline-none">
            <IntegrationsForm isMonoConnected={isMonoConnected} isGoogleConnected={isGoogleConnected} />
          </TabsContent>

          <TabsContent value="danger-zone" className="m-0 outline-none">
            <DangerZoneForm />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
