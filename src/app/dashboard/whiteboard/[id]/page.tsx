import { getWhiteboardById } from "@/app/dashboard/whiteboard/actions";
import WhiteboardEditor from "@/components/whiteboard/whiteboard-editor";
import { notFound } from "next/navigation";

export default async function WhiteboardPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const board = await getWhiteboardById(id);

    if (!board) {
        notFound();
    }

    return (
        <div className="flex-1 h-full min-h-[calc(100vh-160px)] flex flex-col">
            <WhiteboardEditor board={board as any} />
        </div>
    );
}
