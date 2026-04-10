import { getFolders, getNotes, getNoteById, getTags } from "@/app/dashboard/notes/actions";
import { NoteWorkspace } from "@/components/notes/note-workspace";
import { notFound } from "next/navigation";

export default async function NotePage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;

    const [folders, notes, note, tags] = await Promise.all([
        getFolders(),
        getNotes(),
        getNoteById(id),
        getTags()
    ]);

    if (!note) {
        notFound();
    }

    return <NoteWorkspace note={note} folders={folders} notes={notes} tags={tags} />;
}
