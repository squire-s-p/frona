"use client";

import * as React from "react";
import { AppWindowIcon, CodeIcon } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";

export default function TabsPage() {
  return (
    <div className="space-y-10 pr-10 pb-20">
      <div className="space-y-4">
        <h1 className="scroll-m-20 text-4xl font-extrabold tracking-tight lg:text-5xl text-foreground">
          Tabs
        </h1>
        <p className="text-lg text-muted-foreground">
          A set of layered sections of content—known as tab panels—that are displayed one at a time.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4 md:col-span-2">
          <h2 className="scroll-m-20 border-b pb-2 text-2xl font-semibold tracking-tight transition-colors first:mt-0 text-foreground">
            Basic
          </h2>
          <div className="rounded-xl border border-border/40 bg-card p-6 shadow-sm flex items-center justify-center min-h-[300px]">
            <Tabs defaultValue="overview" className="w-[400px]">
              <TabsList className="w-full">
                <TabsTrigger value="overview" className="flex-1">Overview</TabsTrigger>
                <TabsTrigger value="analytics" className="flex-1">Analytics</TabsTrigger>
                <TabsTrigger value="reports" className="flex-1">Reports</TabsTrigger>
              </TabsList>
              <TabsContent value="overview">
                <Card>
                  <CardHeader>
                    <CardTitle>Overview</CardTitle>
                    <CardDescription>
                      View your key metrics and recent project activity. Track progress
                      across all your active projects.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="text-sm text-muted-foreground">
                    You have 12 active projects and 3 pending tasks.
                  </CardContent>
                </Card>
              </TabsContent>
              <TabsContent value="analytics">
                <Card>
                  <CardHeader>
                    <CardTitle>Analytics</CardTitle>
                    <CardDescription>
                      Track performance and user engagement metrics. Monitor trends and
                      identify growth opportunities.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="text-sm text-muted-foreground">
                    Page views are up 25% compared to last month.
                  </CardContent>
                </Card>
              </TabsContent>
              <TabsContent value="reports">
                <Card>
                  <CardHeader>
                    <CardTitle>Reports</CardTitle>
                    <CardDescription>
                      Generate and download your detailed reports. Export data in
                      multiple formats for analysis.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="text-sm text-muted-foreground">
                    You have 5 reports ready and available to export.
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>

        <div className="space-y-4">
          <h2 className="scroll-m-20 border-b pb-2 text-2xl font-semibold tracking-tight transition-colors first:mt-0 text-foreground">
            Line Variant
          </h2>
          <div className="rounded-xl border border-border/40 bg-card p-6 shadow-sm flex items-center justify-center min-h-[150px]">
            <Tabs defaultValue="overview">
              <TabsList variant="line">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="analytics">Analytics</TabsTrigger>
                <TabsTrigger value="reports">Reports</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </div>

        <div className="space-y-4">
          <h2 className="scroll-m-20 border-b pb-2 text-2xl font-semibold tracking-tight transition-colors first:mt-0 text-foreground">
            Vertical Orientation
          </h2>
          <div className="rounded-xl border border-border/40 bg-card p-6 shadow-sm flex items-center justify-center min-h-[150px]">
            <Tabs defaultValue="account" orientation="vertical">
              <TabsList>
                <TabsTrigger value="account">Account</TabsTrigger>
                <TabsTrigger value="password">Password</TabsTrigger>
                <TabsTrigger value="notifications">Notifications</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </div>

        <div className="space-y-4">
          <h2 className="scroll-m-20 border-b pb-2 text-2xl font-semibold tracking-tight transition-colors first:mt-0 text-foreground">
            With Icons
          </h2>
          <div className="rounded-xl border border-border/40 bg-card p-6 shadow-sm flex items-center justify-center min-h-[150px]">
            <Tabs defaultValue="preview">
              <TabsList>
                <TabsTrigger value="preview">
                  <AppWindowIcon className="mr-2 h-4 w-4" />
                  Preview
                </TabsTrigger>
                <TabsTrigger value="code">
                  <CodeIcon className="mr-2 h-4 w-4" />
                  Code
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </div>

        <div className="space-y-4">
          <h2 className="scroll-m-20 border-b pb-2 text-2xl font-semibold tracking-tight transition-colors first:mt-0 text-foreground">
            Disabled State
          </h2>
          <div className="rounded-xl border border-border/40 bg-card p-6 shadow-sm flex items-center justify-center min-h-[150px]">
            <Tabs defaultValue="home">
              <TabsList>
                <TabsTrigger value="home">Home</TabsTrigger>
                <TabsTrigger value="settings" disabled>
                  Disabled
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  );
}
