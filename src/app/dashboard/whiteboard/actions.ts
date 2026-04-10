"use server";

import { prisma } from "@/lib/prisma";
import { getAuthSession } from "@/lib/auth-session";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

async function requireUser() {
    const session = await getAuthSession();
    if (!session?.user) redirect("/login");
    return session.user;
}

export async function getWhiteboards() {
    const user = await requireUser();
    return prisma.whiteboard.findMany({
        where: { userId: user.id },
        orderBy: [
            { isPinned: "desc" },
            { updatedAt: "desc" }
        ]
    });
}

export async function getWhiteboardById(id: string) {
    const user = await requireUser();
    return prisma.whiteboard.findFirst({
        where: { id, userId: user.id }
    });
}

export async function createWhiteboard(title: string) {
    const user = await requireUser();
    const board = await prisma.whiteboard.create({
        data: {
            userId: user.id,
            title,
            data: [] // Empty elements array for Excalidraw
        }
    });
    revalidatePath("/dashboard/whiteboard");
    return board;
}

export async function updateWhiteboard(id: string, data: any, preview?: string) {
    const user = await requireUser();
    const board = await prisma.whiteboard.update({
        where: { id, userId: user.id },
        data: {
            data,
            ...(preview && { preview })
        }
    });
    // We don't always want to revalidate on every auto-save to avoid flickering
    // but we might need it for the list view
    return board;
}

export async function renameWhiteboard(id: string, title: string) {
    const user = await requireUser();
    await prisma.whiteboard.update({
        where: { id, userId: user.id },
        data: { title }
    });
    revalidatePath("/dashboard/whiteboard");
}

export async function togglePinWhiteboard(id: string, isPinned: boolean) {
    const user = await requireUser();
    await prisma.whiteboard.update({
        where: { id, userId: user.id },
        data: { isPinned }
    });
    revalidatePath("/dashboard/whiteboard");
}

export async function deleteWhiteboard(id: string) {
    const user = await requireUser();
    await prisma.whiteboard.delete({
        where: { id, userId: user.id }
    });
    revalidatePath("/dashboard/whiteboard");
}
