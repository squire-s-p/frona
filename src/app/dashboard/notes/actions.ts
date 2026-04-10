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

// --- FOLDERS ---

export async function getFolders() {
    const user = await requireUser();
    return prisma.folder.findMany({
        where: { userId: user.id },
        include: { _count: { select: { notes: true } } },
        orderBy: { name: "asc" }
    });
}

export async function createFolder(name: string, parentId?: string | null) {
    const user = await requireUser();
    const folder = await prisma.folder.create({
        data: {
            userId: user.id,
            name,
            parentId: parentId || null
        }
    });
    revalidatePath("/dashboard/notes");
    return folder;
}

export async function deleteFolder(id: string) {
    const user = await requireUser();
    await prisma.folder.delete({
        where: { id, userId: user.id }
    });
    revalidatePath("/dashboard/notes");
}

export async function renameFolder(id: string, name: string) {
    const user = await requireUser();
    await prisma.folder.update({
        where: { id, userId: user.id },
        data: { name }
    });
    revalidatePath("/dashboard/notes");
}

// --- NOTES ---

export async function getNotes(options?: { folderId?: string | null, tag?: string }) {
    const user = await requireUser();
    return prisma.note.findMany({
        where: {
            userId: user.id,
            ...(options?.folderId !== undefined && { folderId: options.folderId }),
            ...(options?.tag && { tagsRel: { some: { name: options.tag } } }),
            isArchived: false
        },
        include: {
            tagsRel: true
        },
        orderBy: { updatedAt: "desc" }
    });
}

export async function getTags() {
    const user = await requireUser();
    return prisma.tag.findMany({
        where: { userId: user.id },
        orderBy: { name: "asc" }
    });
}

export async function updateTag(id: string, data: { name?: string, color?: string }) {
    const user = await requireUser();
    const tag = await prisma.tag.update({
        where: { id, userId: user.id },
        data
    });
    revalidatePath("/dashboard/notes");
    return tag;
}

export async function deleteTag(id: string) {
    const user = await requireUser();
    await prisma.tag.delete({
        where: { id, userId: user.id }
    });
    revalidatePath("/dashboard/notes");
}

export async function getNoteById(id: string) {
    const user = await requireUser();
    return prisma.note.findFirst({
        where: { id, userId: user.id },
        include: {
            incomingLinks: { include: { source: { select: { id: true, title: true } } } },
            outgoingLinks: { include: { target: { select: { id: true, title: true } } } },
            tagsRel: true
        }
    });
}

export async function createNote(title: string, folderId?: string | null) {
    const user = await requireUser();
    const note = await prisma.note.create({
        data: {
            userId: user.id,
            title,
            folderId: folderId || null,
            content: "",
            properties: {}
        }
    });
    revalidatePath("/dashboard/notes");
    return note;
}

export async function bulkCreateNotes(notes: { title: string, content: string }[], folderId?: string | null) {
    const user = await requireUser();

    // Create multiple notes in a single query for high performance
    const createdNotes = await (prisma.note as any).createManyAndReturn({
        data: notes.map(note => ({
            userId: user.id,
            title: note.title,
            content: note.content,
            folderId: folderId || null,
            properties: {}
        }))
    });

    // Sync links for all created notes sequentially to avoid auth overhead and DB stress
    for (const note of createdNotes) {
        await syncNoteLinks(note.id, note.content ?? "", user.id);
    }

    revalidatePath("/dashboard/notes");
    return createdNotes;
}

export async function updateNote(id: string, data: { title?: string, content?: string, properties?: any, folderId?: string | null, isFavorite?: boolean, tags?: string[] }) {
    const user = await requireUser();

    const note = await prisma.note.update({
        where: { id, userId: user.id },
        data: {
            ...data,
            tagsRel: data.tags !== undefined ? {
                set: [], // Clear existing relations
                connectOrCreate: data.tags.map(tagName => ({
                    where: { userId_name: { userId: user.id, name: tagName } },
                    create: { userId: user.id, name: tagName }
                }))
            } : undefined
        }
    });

    if (data.content !== undefined) {
        await syncNoteLinks(id, data.content, user.id);
    }

    revalidatePath("/dashboard/notes");
    return note;
}

export async function deleteNote(id: string) {
    const user = await requireUser();
    await prisma.note.delete({
        where: { id, userId: user.id }
    });
    revalidatePath("/dashboard/notes");
}

// --- LINK PARSING ---

async function syncNoteLinks(sourceNoteId: string, content: string, userId?: string) {
    const finalUserId = userId || (await requireUser()).id;

    // Simple regex for [[Note Title]] - handles [[Link|Alias]] by splitting
    const linkRegex = /\[\[(.*?)\]\]/g;
    const matches = Array.from(content.matchAll(linkRegex));
    const targetTitles = [...new Set(matches.map(m => m[1].split('|')[0].trim()))];

    // Find notes with these titles for the user
    const targetNotes = await prisma.note.findMany({
        where: {
            userId: finalUserId,
            title: { in: targetTitles }
        },
        select: { id: true }
    });

    const targetIds = targetNotes.map(n => n.id);

    // Delete old links
    await prisma.noteLink.deleteMany({
        where: { sourceId: sourceNoteId }
    });

    // Create new links
    if (targetIds.length > 0) {
        await prisma.noteLink.createMany({
            data: targetIds.map(targetId => ({
                sourceId: sourceNoteId,
                targetId
            })),
            skipDuplicates: true
        });
    }
}

// --- SEARCH & UTILS ---

export async function findNoteByTitle(title: string) {
    const user = await requireUser();
    return prisma.note.findFirst({
        where: { userId: user.id, title }
    });
}

export async function getDailyNote() {
    const user = await requireUser();
    const today = new Date();
    const title = today.toISOString().split("T")[0]; // YYYY-MM-DD

    let note = await prisma.note.findFirst({
        where: { userId: user.id, title }
    });

    if (!note) {
        note = await prisma.note.create({
            data: {
                userId: user.id,
                title,
                content: `# ${title}\n\n`,
                properties: {}
            }
        });
    }

    return note;
}

export async function searchNotes(query: string) {
    const user = await requireUser();
    return prisma.note.findMany({
        where: {
            userId: user.id,
            OR: [
                { title: { contains: query, mode: "insensitive" } },
                { content: { contains: query, mode: "insensitive" } }
            ]
        },
        take: 10
    });
}

export async function getNoteGraph() {
    const user = await requireUser();

    const [notes, links] = await Promise.all([
        prisma.note.findMany({
            where: { userId: user.id },
            select: {
                id: true,
                title: true,
                tagsRel: {
                    select: { color: true },
                    take: 1
                }
            }
        }),
        prisma.noteLink.findMany({
            where: {
                source: { userId: user.id }
            }
        })
    ]);

    return {
        nodes: notes.map(n => ({
            id: n.id,
            title: n.title,
            color: n.tagsRel[0]?.color || null
        })),
        links: links.map(l => ({ source: l.sourceId, target: l.targetId }))
    };
}

export async function getUnlinkedMentions(noteId: string, title: string) {
    const user = await requireUser();

    // Find notes that contain the title but don't have a formal link
    // This is a simple implementation; Obsidian's is more complex.
    const notes = await prisma.note.findMany({
        where: {
            userId: user.id,
            id: { not: noteId },
            content: { contains: title, mode: "insensitive" },
            outgoingLinks: {
                none: { targetId: noteId }
            }
        },
        select: { id: true, title: true }
    });

    return notes;
}

export async function seedTestData() {
    const user = await requireUser();

    // 1. Створення папок
    const folderWork = await prisma.folder.create({
        data: { userId: user.id, name: "Робота" }
    });

    const folderPersonal = await prisma.folder.create({
        data: { userId: user.id, name: "Особисте" }
    });

    const folderTech = await prisma.folder.create({
        data: { userId: user.id, name: "Технології" }
    });

    const folderLearning = await prisma.folder.create({
        data: { userId: user.id, name: "Навчання" }
    });

    // 2. Створення нотаток (Робота)
    const note1 = await prisma.note.create({
        data: {
            userId: user.id,
            folderId: folderWork.id,
            title: "Проект Альфа",
            content: "# Проект Альфа\n\nЦе основна нотатка проекту. Потрібно перевірити [[План розвитку]] та [[Список задач]].\n\nТакож ми використовуємо [[React]] для фронтенду. #tasks #work",
            tags: ["tasks", "work"],
            properties: { priority: "high", status: "active" }
        }
    });

    const note2 = await prisma.note.create({
        data: {
            userId: user.id,
            folderId: folderWork.id,
            title: "План розвитку",
            content: "# План розвитку\n\n1. Дослідження ринку\n2. Проектування архітектури\n3. Розробка MVP\n\nДив. також [[Проект Альфа]].",
            properties: {}
        }
    });

    const note3 = await prisma.note.create({
        data: {
            userId: user.id,
            folderId: folderWork.id,
            title: "Список задач",
            content: "# Список задач\n\n- [ ] Купити домен\n- [x] Налаштувати сервер\n- [ ] Написати код\n\nПов'язано з [[Проект Альфа]]. Див. [[Налаштування оточення]].",
            properties: {}
        }
    });

    // 3. Створення нотаток (Технології)
    const noteReact = await prisma.note.create({
        data: {
            userId: user.id,
            folderId: folderTech.id,
            title: "React",
            content: "# React\n\nБібліотека для створення інтерфейсів. Ми використовуємо її в [[Проект Альфа]].\n\nВарто вивчити [[Next.js]] для серверного рендерингу. #frontend #js",
            tags: ["frontend", "js"],
            properties: { type: "library" }
        }
    });

    const noteNext = await prisma.note.create({
        data: {
            userId: user.id,
            folderId: folderTech.id,
            title: "Next.js",
            content: "# Next.js\n\nФреймворк на базі [[React]]. Дуже потужний інструмент.\n\nПотрібно додати в [[Список задач]] пункт про міграцію.",
            properties: { type: "framework" }
        }
    });

    // 4. Створення нотаток (Особисте)
    const note4 = await prisma.note.create({
        data: {
            userId: user.id,
            folderId: folderPersonal.id,
            title: "Ідеї для відпустки",
            content: "# Відпустка 2024\n\n- Ісландія\n- Японія\n- Норвегія\n\nТреба переглянути [[Бюджет]]. #travel",
            tags: ["travel"],
            properties: {}
        }
    });

    const note5 = await prisma.note.create({
        data: {
            userId: user.id,
            folderId: folderPersonal.id,
            title: "Бюджет",
            content: "# Фінансовий план\n\n- Авіаквитки: 500$\n- Готель: 800$\n- Харчування: 400$\n\nДо [[Ідеї для відпустки]].",
            properties: {}
        }
    });

    // 5. Нотатка в корінь (без папки)
    const noteRoot = await prisma.note.create({
        data: {
            userId: user.id,
            title: "Налаштування оточення",
            content: "# Оточення\n\nПотрібно встановити Node.js та VS Code.\n\nЗгадується в [[Список задач]].",
            properties: {}
        }
    });

    // 6. Синхронізація лінків (для всіх нотаток)
    const allNotes = [note1, note2, note3, noteReact, noteNext, note4, note5, noteRoot];
    await Promise.all(
        allNotes.map(n => syncNoteLinks(n.id, n.content ?? ""))
    );

    revalidatePath("/dashboard/notes");
}
