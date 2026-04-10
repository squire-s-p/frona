import { getWhiteboards, createWhiteboard } from "@/app/dashboard/whiteboard/actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Plus, Layout, Pin, Calendar, ArrowRight, MoreVertical, Trash2 } from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import { uk } from "date-fns/locale";
import { redirect } from "next/navigation";
import { WhiteboardCardActions } from "@/components/whiteboard/whiteboard-card-actions";

export default async function WhiteboardListPage() {
    const boards = await getWhiteboards();

    async function handleCreate(formData: FormData) {
        "use server";
        const title = formData.get("title") as string || "Нова дошка";
        const board = await createWhiteboard(title);
        redirect(`/dashboard/whiteboard/${board.id}`);
    }

    return (
        <div className="space-y-6 flex flex-col h-full">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Дошки</h1>
                    <p className="text-zinc-500 dark:text-zinc-400 mt-1">
                        Візуалізуйте свої ідеї та плани
                    </p>
                </div>
                <form action={handleCreate}>
                    <Button type="submit">
                        <Plus className="h-4 w-4 mr-2" />
                        Нова дошка
                    </Button>
                </form>
            </div>

            {boards.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-2xl p-12 text-center">
                    <div className="bg-zinc-100 dark:bg-zinc-900 p-4 rounded-full mb-4">
                        <Layout className="h-8 w-8 text-zinc-400" />
                    </div>
                    <h3 className="text-lg font-semibold">У вас ще немає дощок</h3>
                    <p className="text-zinc-500 max-w-sm mt-2">
                        Створіть свою першу візуальну дошку для малювання схем, планів або просто нотаток.
                    </p>
                    <form action={handleCreate} className="mt-6">
                        <Button variant="outline" type="submit">
                            Створити першу дошку
                        </Button>
                    </form>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {boards.map((board: any) => (
                        <Card key={board.id} className="group hover:shadow-md transition-all border-zinc-200 dark:border-zinc-800 flex flex-col overflow-hidden relative">
                            <div className="absolute top-2 right-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
                                <WhiteboardCardActions id={board.id} title={board.title} isPinned={board.isPinned} />
                            </div>
                            <Link href={`/dashboard/whiteboard/${board.id}`} className="flex-1 flex flex-col">
                                <div className="aspect-video bg-zinc-50 dark:bg-zinc-900 border-b border-zinc-100 dark:border-zinc-800 relative flex items-center justify-center p-4">
                                    {board.preview ? (
                                        <img src={board.preview} alt={board.title} className="max-h-full max-w-full object-contain shadow-sm rounded" />
                                    ) : (
                                        <Layout className="h-12 w-12 text-zinc-200 dark:text-zinc-800" />
                                    )}
                                    {board.isPinned && (
                                        <div className="absolute top-2 left-2 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-sm p-1 rounded shadow-sm border border-zinc-100 dark:border-zinc-800">
                                            <Pin className="h-3 w-3 text-blue-500 fill-blue-500" />
                                        </div>
                                    )}
                                </div>
                                <CardHeader className="p-4 space-y-1">
                                    <div className="flex items-center justify-between gap-2">
                                        <CardTitle className="text-base line-clamp-1">{board.title}</CardTitle>
                                    </div>
                                    <CardDescription className="flex items-center text-[10px] uppercase tracking-wider">
                                        <Calendar className="h-3 w-3 mr-1" />
                                        {format(board.updatedAt, "d MMM yyyy", { locale: uk })}
                                    </CardDescription>
                                </CardHeader>
                            </Link>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}
