import Link from "next/link";
import { redirect } from "next/navigation";
import { format } from "date-fns";
import { uk } from "date-fns/locale";
import { Layout, Plus, Calendar } from "lucide-react";
import type { Metadata } from "next";

import { createWhiteboard, getWhiteboards } from "@/app/dashboard/whiteboard/actions";
import { WhiteboardCardActions } from "@/components/whiteboard/whiteboard-card-actions";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import {
  DashboardPage,
  DashboardPageHeader,
  DashboardSurface,
} from "@/components/layout/dashboard-page";

export const metadata: Metadata = {
  title: "Біла дошка",
};

export default async function WhiteboardListPage() {
  const boards = await getWhiteboards();

  async function handleCreate(formData: FormData) {
    "use server";
    const title = (formData.get("title") as string) || "Нова дошка";
    const board = await createWhiteboard(title);
    redirect(`/dashboard/whiteboard/${board.id}`);
  }

  return (
    <DashboardPage className="h-full">
      <DashboardPageHeader
        title="Дошки"
        description="Візуалізуйте свої ідеї та плани"
        actions={
          <form action={handleCreate}>
            <Button type="submit" className="gap-2">
              <Plus className="h-4 w-4" />
              Нова дошка
            </Button>
          </form>
        }
      />

      {boards.length === 0 ? (
        <DashboardSurface>
          <Empty className="border-border/60">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <Layout className="size-5 text-muted-foreground" />
              </EmptyMedia>
              <EmptyTitle>У вас ще немає дощок</EmptyTitle>
              <EmptyDescription>
                Створіть першу дошку для схем, планів або швидких нотаток.
              </EmptyDescription>
            </EmptyHeader>
            <EmptyContent>
              <form action={handleCreate}>
                <Button variant="outline" type="submit">
                  Створити першу дошку
                </Button>
              </form>
            </EmptyContent>
          </Empty>
        </DashboardSurface>
      ) : (
        <DashboardSurface className="p-0">
          <div className="p-4 md:p-6">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {boards.map((board: any) => (
                <Card
                  key={board.id}
                  className="group overflow-hidden py-0 gap-0 shadow-none"
                >
                  <div className="relative">
                    <div className="absolute right-2 top-2 z-10 opacity-0 transition-opacity group-hover:opacity-100">
                      <WhiteboardCardActions
                        id={board.id}
                        title={board.title}
                        isPinned={board.isPinned}
                      />
                    </div>

                    <Link
                      href={`/dashboard/whiteboard/${board.id}`}
                      className="flex flex-col"
                    >
                      <div className="aspect-video border-b border-border/60 bg-muted/20 flex items-center justify-center p-4">
                        {board.preview ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={board.preview}
                            alt={board.title}
                            className="max-h-full max-w-full rounded-md object-contain"
                          />
                        ) : (
                          <Layout className="h-10 w-10 text-muted-foreground/30" />
                        )}
                      </div>

                      <CardHeader className="gap-1 px-4 py-4">
                        <CardTitle className="text-base line-clamp-1">
                          {board.title}
                        </CardTitle>
                        <CardDescription className="flex items-center gap-1 text-[10px] uppercase tracking-wider">
                          <Calendar className="h-3 w-3" />
                          {format(board.updatedAt, "d MMM yyyy", { locale: uk })}
                        </CardDescription>
                      </CardHeader>
                    </Link>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </DashboardSurface>
      )}
    </DashboardPage>
  );
}
