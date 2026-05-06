"use client";

import * as React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import "katex/dist/katex.min.css";
import mermaid from "mermaid";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { buttonVariants } from "@/components/ui/button";

import { Info, AlertTriangle, CheckCircle2, XCircle, Lightbulb, HelpCircle, Flame, StickyNote } from "lucide-react";

// Initialize mermaid
mermaid.initialize({
    startOnLoad: true,
    theme: "default",
    securityLevel: "loose",
});

const CALLOUT_TYPES: Record<string, { icon: React.ElementType, color: string, bg: string, border: string }> = {
    INFO: { icon: Info, color: "text-blue-500", bg: "bg-blue-50/50 dark:bg-blue-900/10", border: "border-blue-200 dark:border-blue-800" },
    NOTE: { icon: StickyNote, color: "text-zinc-500", bg: "bg-zinc-50/50 dark:bg-zinc-800/20", border: "border-zinc-200 dark:border-zinc-700" },
    TIP: { icon: Lightbulb, color: "text-amber-500", bg: "bg-amber-50/50 dark:bg-amber-900/10", border: "border-amber-200 dark:border-amber-800" },
    WARNING: { icon: AlertTriangle, color: "text-orange-500", bg: "bg-orange-50/50 dark:bg-orange-900/10", border: "border-orange-200 dark:border-orange-800" },
    CAUTION: { icon: Flame, color: "text-red-500", bg: "bg-red-50/50 dark:bg-red-900/10", border: "border-red-200 dark:border-red-800" },
    FAILURE: { icon: XCircle, color: "text-red-600", bg: "bg-red-50 dark:bg-red-900/20", border: "border-red-300 dark:border-red-700" },
    SUCCESS: { icon: CheckCircle2, color: "text-emerald-500", bg: "bg-emerald-50/50 dark:bg-emerald-900/10", border: "border-emerald-200 dark:border-emerald-800" },
    QUESTION: { icon: HelpCircle, color: "text-purple-500", bg: "bg-purple-50/50 dark:bg-purple-900/10", border: "border-purple-200 dark:border-purple-800" },
};

interface MarkdownPreviewProps {
    content: string;
    className?: string;
    notes?: Array<{ id: string; title: string }>;
    onNoteNotFound?: (title: string) => void;
}

export function MarkdownPreview({ content, className, notes = [], onNoteNotFound }: MarkdownPreviewProps) {
    const router = useRouter();

    return (
        <div className={cn("prose prose-zinc dark:prose-invert max-w-none prose-headings:scroll-mt-20", className)}>
            <ReactMarkdown
                remarkPlugins={[remarkGfm, remarkMath]}
                rehypePlugins={[rehypeKatex]}
                components={{
                    h1: ({ children, ...props }) => <h1 id={String(children).toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-')} {...props}>{children}</h1>,
                    h2: ({ children, ...props }) => <h2 id={String(children).toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-')} {...props}>{children}</h2>,
                    h3: ({ children, ...props }) => <h3 id={String(children).toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-')} {...props}>{children}</h3>,
                    blockquote: ({ children }) => {
                        const content = React.Children.toArray(children);
                        const firstChild = content[0] as React.ReactElement<{ children?: string[] }>;
                        const text = firstChild?.props?.children?.[0] || "";

                        if (typeof text === "string" && text.startsWith("[!")) {
                            const match = text.match(/\[!(\w+)\]\s*(.*)/);
                            if (match) {
                                const type = match[1].toUpperCase();
                                const title = match[2] || type;
                                const callout = CALLOUT_TYPES[type] || CALLOUT_TYPES.INFO;
                                const Icon = callout.icon;

                                return (
                                    <div className={cn("my-4 rounded-lg border-l-4 overflow-hidden", callout.bg, callout.border)}>
                                        <div className={cn("px-4 py-2 flex items-center gap-2 font-bold text-sm border-b border-black/5 dark:border-white/5", callout.color)}>
                                            <Icon className="h-4 w-4" />
                                            {title}
                                        </div>
                                        <div className="px-4 py-2 text-sm opacity-90 prose-p:my-1">
                                            {content.slice(1)}
                                        </div>
                                    </div>
                                );
                            }
                        }
                        return <blockquote className="border-l-4 border-zinc-200 dark:border-zinc-800 pl-4 my-4 italic text-zinc-600 dark:text-zinc-400">{children}</blockquote>;
                    },
                    code({ className, children, ...props }: React.ClassAttributes<HTMLElement> & React.HTMLAttributes<HTMLElement> & { inline?: boolean; node?: unknown }) {
                        const match = /language-(\w+)/.exec(className || "");
                        const isMermaid = match && match[1] === "mermaid";

                        if (!props.inline && isMermaid) {
                            return <MermaidChart chart={String(children).replace(/\n$/, "")} />;
                        }

                        return (
                            <code className={className} {...props}>
                                {children}
                            </code>
                        );
                    },
                    p: ({ children }) => {
                        // Handle [[Internal Links]] within paragraphs
                        return <p>{processLinks(children, notes, router, onNoteNotFound)}</p>;
                    }
                }}
            >
                {content}
            </ReactMarkdown>
        </div>
    );
}

function processLinks(
    children: React.ReactNode,
    notes: Array<{ id: string; title: string }>,
    router: { push: (path: string) => void },
    onNoteNotFound?: (title: string) => void
): React.ReactNode {
    if (typeof children !== "string") {
        if (Array.isArray(children)) {
            return children.map((child, i) => (
                <React.Fragment key={i}>
                    {processLinks(child, notes, router, onNoteNotFound)}
                </React.Fragment>
            ));
        }
        return children;
    }

    const parts = children.split(/(\[\[[^\]]+\]\])/);
    return parts.map((part, i) => {
        if (part.startsWith("[[") && part.endsWith("]]")) {
            const linkContent = part.slice(2, -2);
            // Support [[Link#Header|Alias]]
            const [pathWithHeader, alias] = linkContent.split("|");
            const [title, header] = pathWithHeader.split("#");

            // Find note in the list
            const note = notes.find(n => n.title.toLowerCase() === title.trim().toLowerCase());

            if (note) {
                return (
                    <button
                        key={i}
                        onClick={() => {
                            router.push(`/dashboard/notes/${note.id}${header ? `#${header}` : ""}`);
                        }}
                        className={cn(
                            buttonVariants({ variant: "link" }),
                            "h-auto p-0 text-blue-600 dark:text-blue-400 decoration-blue-500/30 underline-offset-2"
                        )}
                    >
                        {alias || title}
                    </button>
                );
            } else {
                // Note not found - show as "broken" link or allow creation
                return (
                    <button
                        key={i}
                        onClick={() => {
                            if (onNoteNotFound) {
                                onNoteNotFound(title.trim());
                            } else {
                                toast.error(`Нотатка "${title}" не знайдена`);
                            }
                        }}
                        className={cn(
                            buttonVariants({ variant: "link" }),
                            "h-auto p-0 text-red-400 dark:text-red-500/70 decoration-red-500/20 underline-offset-2 italic"
                        )}
                        title="Натисніть, щоб створити"
                    >
                        {alias || title}
                    </button>
                );
            }
        }
        return part;
    });
}

function MermaidChart({ chart }: { chart: string }) {
    const [svg, setSvg] = React.useState<string>("");
    const id = React.useId().replace(/:/g, "");

    React.useEffect(() => {
        try {
            mermaid.render(`mermaid-${id}`, chart).then((result) => {
                setSvg(result.svg);
            });
        } catch (e) {
            console.error("Mermaid error:", e);
        }
    }, [chart, id]);

    return <div dangerouslySetInnerHTML={{ __html: svg }} className="my-4 flex justify-center overflow-x-auto" />;
}
