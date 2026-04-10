"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import Underline from "@tiptap/extension-underline";
import Link from "@tiptap/extension-link";
import TaskItem from "@tiptap/extension-task-item";
import TaskList from "@tiptap/extension-task-list";
import { TextStyle } from "@tiptap/extension-text-style";
import { Color } from "@tiptap/extension-color";
import {
    Bold,
    Italic,
    Strikethrough,
    Underline as UnderlineIcon,
    Type,
    List as ListIcon,
    ListOrdered,
    CheckSquare,
    Quote,
    Link as LinkIcon,
    ChevronDown,
    Baseline,
    Check,
    Save
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import * as React from "react";

interface RichTextEditorProps {
    content: string;
    onChange: (content: string) => void;
    onBlur?: () => void;
    onSave?: (content: string) => void;
    placeholder?: string;
    className?: string;
    showSaveButton?: boolean;
}


export function RichTextEditor({ content, onChange, onBlur, onSave, placeholder, className, showSaveButton = true }: RichTextEditorProps) {

    const [linkUrl, setLinkUrl] = React.useState("");
    const [linkOpen, setLinkOpen] = React.useState(false);
    const [isDirty, setIsDirty] = React.useState(false);

    const editor = useEditor({
        immediatelyRender: false,
        extensions: [
            StarterKit.configure({
                bulletList: {
                    keepMarks: true,
                    keepAttributes: false,
                    HTMLAttributes: {
                        class: "list-disc ml-6 space-y-1 my-4",
                    }
                },
                orderedList: {
                    keepMarks: true,
                    keepAttributes: false,
                    HTMLAttributes: {
                        class: "list-decimal ml-6 space-y-1 my-4",
                    }
                },
                heading: {
                    levels: [1, 2, 3],
                }
            }),
            Placeholder.configure({
                placeholder: placeholder || "Додайте опис...",
            }),
            Underline,
            Link.configure({
                openOnClick: false,
                HTMLAttributes: {
                    class: "text-primary underline underline-offset-4 font-bold decoration-primary/50 hover:decoration-primary transition-all",
                },
            }),
            TextStyle,
            Color,
            TaskList.configure({
                HTMLAttributes: {
                    class: "not-prose space-y-2 my-4",
                },
            }),
            TaskItem.configure({
                nested: true,
                HTMLAttributes: {
                    class: "flex gap-3 items-start group/task",
                },
            }),
        ],
        content,
        onUpdate: ({ editor }) => {
            const html = editor.getHTML();
            onChange(html);
            setIsDirty(true);
        },
        onBlur: () => {
            onBlur?.();
        },
        editorProps: {
            attributes: {
                class: cn(
                    "prose prose-sm dark:prose-invert max-w-none min-h-[150px] focus:outline-none py-2 px-4 leading-relaxed",
                    className
                ),
            },
        },
    });

    // Sync content from props if needed (only if not dirty to avoid loops/stutter)
    React.useEffect(() => {
        if (editor && content !== editor.getHTML() && !isDirty) {
            editor.commands.setContent(content);
        }
    }, [content, editor, isDirty]);

    const setLink = React.useCallback(() => {
        if (!editor) return;

        if (linkUrl === "") {
            editor.chain().focus().extendMarkRange("link").unsetLink().run();
        } else {
            editor.chain().focus().extendMarkRange("link").setLink({ href: linkUrl }).run();
        }

        setLinkUrl("");
        setLinkOpen(false);
    }, [editor, linkUrl]);

    const handleManualSave = () => {
        if (!editor) return;
        onSave?.(editor.getHTML());
        setIsDirty(false);
    };

    if (!editor) return null;

    return (
        <div className="relative border rounded-md overflow-hidden dark:bg-input/30 bg-transparent group/editor border-input shadow-xs transition-[color,box-shadow] outline-none focus-within:border-ring focus-within:ring-ring/50 focus-within:ring-[3px]">
            <div className="sticky top-0 z-30 flex flex-wrap items-center gap-0.5 p-1 border-b bg-background/95 backdrop-blur-md transition-all duration-200 rounded-t-[inherit]">
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8 gap-1 px-2 text-[13px] font-medium">
                            <Type className="h-3.5 w-3.5" />
                            <ChevronDown className="h-3 w-3 opacity-50" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start" className="w-48">
                        <DropdownMenuItem onClick={() => editor.chain().focus().setParagraph().run()}>
                            <Type className="h-4 w-4 mr-2" /> Текст
                            {editor.isActive('paragraph') && <Check className="ml-auto h-3.5 w-3.5" />}
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}>
                            <span className="font-bold mr-2 text-lg">H1</span> Заголовок 1
                            {editor.isActive('heading', { level: 1 }) && <Check className="ml-auto h-3.5 w-3.5" />}
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}>
                            <span className="font-bold mr-2 text-md">H2</span> Заголовок 2
                            {editor.isActive('heading', { level: 2 }) && <Check className="ml-auto h-3.5 w-3.5" />}
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}>
                            <span className="font-bold mr-2 text-base">H3</span> Заголовок 3
                            {editor.isActive('heading', { level: 3 }) && <Check className="ml-auto h-3.5 w-3.5" />}
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>

                <div className="w-px h-4 bg-border mx-1" />

                <Button
                    variant="ghost"
                    size="icon"
                    className={cn("h-8 w-8", editor.isActive("bold") && "bg-muted text-primary")}
                    onClick={() => editor.chain().focus().toggleBold().run()}
                >
                    <Bold className="h-3.5 w-3.5" />
                </Button>
                <Button
                    variant="ghost"
                    size="icon"
                    className={cn("h-8 w-8", editor.isActive("italic") && "bg-muted text-primary")}
                    onClick={() => editor.chain().focus().toggleItalic().run()}
                >
                    <Italic className="h-3.5 w-3.5" />
                </Button>
                <Button
                    variant="ghost"
                    size="icon"
                    className={cn("h-8 w-8", editor.isActive("strike") && "bg-muted text-primary")}
                    onClick={() => editor.chain().focus().toggleStrike().run()}
                >
                    <Strikethrough className="h-3.5 w-3.5" />
                </Button>
                <Button
                    variant="ghost"
                    size="icon"
                    className={cn("h-8 w-8", editor.isActive("underline") && "bg-muted text-primary")}
                    onClick={() => editor.chain().focus().toggleUnderline().run()}
                >
                    <UnderlineIcon className="h-3.5 w-3.5" />
                </Button>

                <div className="w-px h-4 bg-border mx-1" />

                <Button
                    variant="ghost"
                    size="icon"
                    className={cn("h-8 w-8", editor.isActive("bulletList") && "bg-muted text-primary")}
                    onClick={() => editor.chain().focus().toggleBulletList().run()}
                >
                    <ListIcon className="h-3.5 w-3.5" />
                </Button>
                <Button
                    variant="ghost"
                    size="icon"
                    className={cn("h-8 w-8", editor.isActive("orderedList") && "bg-muted text-primary")}
                    onClick={() => editor.chain().focus().toggleOrderedList().run()}
                >
                    <ListOrdered className="h-3.5 w-3.5" />
                </Button>
                <Button
                    variant="ghost"
                    size="icon"
                    className={cn("h-8 w-8", editor.isActive("taskList") && "bg-muted text-primary")}
                    onClick={() => editor.chain().focus().toggleTaskList().run()}
                >
                    <CheckSquare className="h-3.5 w-3.5" />
                </Button>
                <Button
                    variant="ghost"
                    size="icon"
                    className={cn("h-8 w-8", editor.isActive("blockquote") && "bg-muted text-primary")}
                    onClick={() => editor.chain().focus().toggleBlockquote().run()}
                >
                    <Quote className="h-3.5 w-3.5" />
                </Button>

                <div className="w-px h-4 bg-border mx-1" />

                <Popover open={linkOpen} onOpenChange={setLinkOpen}>
                    <PopoverTrigger asChild>
                        <Button
                            variant="ghost"
                            size="icon"
                            className={cn("h-8 w-8", editor.isActive("link") && "bg-muted text-primary")}
                        >
                            <LinkIcon className="h-3.5 w-3.5" />
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-72 p-2" sideOffset={8}>
                        <div className="flex gap-2">
                            <Input
                                placeholder="https://..."
                                value={linkUrl}
                                onChange={(e) => setLinkUrl(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && setLink()}
                                className="h-8 text-xs focus-visible:ring-1"
                                autoFocus
                            />
                            <Button size="sm" className="h-8 px-3 text-[11px]" onClick={setLink}>
                                OK
                            </Button>
                        </div>
                    </PopoverContent>
                </Popover>

                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                            <Baseline className="h-3.5 w-3.5" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="p-1">
                        <div className="grid grid-cols-5 gap-1 p-2">
                            {['#f97316', '#ef4444', '#3b82f6', '#10b981', '#ffffff'].map(color => (
                                <Button
                                    key={color}
                                    variant="outline"
                                    size="icon"
                                    className="w-6 h-6 rounded-full p-0 border border-border shrink-0"
                                    style={{ backgroundColor: color }}
                                    onClick={() => editor.chain().focus().setColor(color).run()}
                                />
                            ))}
                        </div>
                        <DropdownMenuItem onClick={() => editor.chain().focus().unsetColor().run()}>
                            Скинути колір
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>

                {showSaveButton && (
                    <div className="ml-auto pr-1">
                        <Button
                            variant={isDirty ? "default" : "ghost"}
                            size="sm"
                            className={cn("h-8 gap-1.5 px-3 text-[11px] font-bold transition-all", !isDirty && "opacity-50")}
                            onClick={handleManualSave}
                            disabled={!isDirty}
                        >
                            <Save className="h-3.5 w-3.5" />
                            {isDirty ? "Зберегти" : "Збережено"}
                        </Button>
                    </div>
                )}

            </div>

            <EditorContent editor={editor} />

            <style jsx global>{`
        /* Empty State */
        .ProseMirror p.is-editor-empty:first-child::before {
          content: attr(data-placeholder);
          float: left;
          color: #adb5bd;
          pointer-events: none;
          height: 0;
          font-style: italic;
        }

        /* Typography & Styles */
        .ProseMirror {
          outline: none !important;
          color: hsl(var(--foreground));
        }

        .ProseMirror h1 {
          font-size: 1.875rem; 
          font-weight: 800;
          line-height: 1.25;
          margin-top: 1.5rem;
          margin-bottom: 1rem;
          color: hsl(var(--foreground));
        }

        .ProseMirror h2 {
          font-size: 1.5rem;
          font-weight: 700;
          line-height: 1.35;
          margin-top: 1.25rem;
          margin-bottom: 0.75rem;
          color: hsl(var(--foreground));
        }

        .ProseMirror h3 {
          font-size: 1.25rem;
          font-weight: 600;
          line-height: 1.4;
          margin-top: 1rem;
          margin-bottom: 0.5rem;
          color: hsl(var(--foreground));
        }

        /* Lists */
        .ProseMirror ul {
          list-style-type: disc;
          padding-left: 1.5rem;
          margin: 1rem 0;
        }

        .ProseMirror ol {
          list-style-type: decimal;
          padding-left: 1.5rem;
          margin: 1rem 0;
        }

        .ProseMirror li {
           margin-bottom: 0.25rem;
        }

        /* Task List Styling - Linear Style */
        .ProseMirror ul[data-type="taskList"] {
          list-style: none;
          padding: 0;
          margin: 1rem 0;
        }
        .ProseMirror ul[data-type="taskList"] li {
          display: flex;
          align-items: flex-start;
          gap: 0.75rem;
          margin-bottom: 0.5rem;
        }
        .ProseMirror ul[data-type="taskList"] li > label {
          flex: 0 0 auto;
          user-select: none;
          margin-top: 0.25rem;
        }
        .ProseMirror ul[data-type="taskList"] li > div {
          flex: 1 1 auto;
          min-width: 0;
        }
        
        .ProseMirror ul[data-type="taskList"] input[type="checkbox"] {
          -webkit-appearance: none;
          appearance: none;
          background-color: transparent;
          margin: 0;
          width: 1.1rem;
          height: 1.1rem;
          border: 1.5px solid #4B5563;
          border-radius: 4px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.2s;
        }
        
        .ProseMirror ul[data-type="taskList"] input[type="checkbox"]:checked {
          background-color: #3B82F6;
          border-color: #3B82F6;
        }
        
        .ProseMirror ul[data-type="taskList"] input[type="checkbox"]:checked::after {
          content: "";
          width: 0.55rem;
          height: 0.3rem;
          border-left: 2px solid white;
          border-bottom: 2px solid white;
          transform: rotate(-45deg) translate(1px, -1px);
        }
        
        .ProseMirror ul[data-type="taskList"] li[data-checked="true"] > div {
          text-decoration: line-through;
          color: #9CA3AF;
        }

        /* Generic Formatting */
        .ProseMirror blockquote {
          border-left: 3px solid hsl(var(--primary) / 0.3);
          padding-left: 1rem;
          margin: 1rem 0;
          font-style: italic;
          color: hsl(var(--muted-foreground));
          background-color: hsl(var(--muted) / 0.3);
          padding-top: 0.5rem;
          padding-bottom: 0.5rem;
          border-radius: 0 4px 4px 0;
        }

        .ProseMirror a {
          color: hsl(var(--primary));
          text-decoration: underline;
          text-underline-offset: 4px;
          font-weight: 500;
        }
      `}</style>
        </div>
    );
}
