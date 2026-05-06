"use client";

import * as React from "react";
import CodeMirror, { EditorView as CodeMirrorEditorView, ReactCodeMirrorRef } from "@uiw/react-codemirror";
import { markdown, markdownLanguage } from "@codemirror/lang-markdown";
import { languages } from "@codemirror/language-data";
import { oneDark } from "@codemirror/theme-one-dark";
import { useTheme } from "next-themes";
import { EditorView, keymap } from "@codemirror/view";
import { NotesAutocomplete } from "./notes-autocomplete";
import { Bold, Italic, Strikethrough, Heading1, Heading2, List, ListOrdered, CheckSquare, Quote, Link as LinkIcon, Code } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface MarkdownEditorProps {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    notes?: Array<{ id: string; title: string }>;
}

export function MarkdownEditor({ value, onChange, placeholder, notes = [] }: MarkdownEditorProps) {
    const { resolvedTheme } = useTheme();
    const editorRef = React.useRef<ReactCodeMirrorRef>(null);
    const [mounted, setMounted] = React.useState(false);
    const [autocomplete, setAutocomplete] = React.useState<{
        show: boolean;
        query: string;
        position: { top: number; left: number };
        cursorPos: number;
    } | null>(null);

    React.useEffect(() => {
        setMounted(true);
    }, []);

    // Hotkeys для форматування
    const formatBold = (view: CodeMirrorEditorView) => {
        const { from, to } = view.state.selection.main;
        const selectedText = view.state.doc.sliceString(from, to);
        const newText = `**${selectedText}**`;
        view.dispatch({
            changes: { from, to, insert: newText },
            selection: { anchor: from + 2, head: to + 2 }
        });
        return true;
    };

    const formatItalic = (view: CodeMirrorEditorView) => {
        const { from, to } = view.state.selection.main;
        const selectedText = view.state.doc.sliceString(from, to);
        const newText = `*${selectedText}*`;
        view.dispatch({
            changes: { from, to, insert: newText },
            selection: { anchor: from + 1, head: to + 1 }
        });
        return true;
    };

    const formatCode = (view: CodeMirrorEditorView) => {
        const { from, to } = view.state.selection.main;
        const selectedText = view.state.doc.sliceString(from, to);
        const newText = `\`${selectedText}\``;
        view.dispatch({
            changes: { from, to, insert: newText },
            selection: { anchor: from + 1, head: to + 1 }
        });
        return true;
    };

    const formatStrikethrough = (view: CodeMirrorEditorView) => {
        const { from, to } = view.state.selection.main;
        const selectedText = view.state.doc.sliceString(from, to);
        const newText = `~~${selectedText}~~`;
        view.dispatch({
            changes: { from, to, insert: newText },
            selection: { anchor: from + 2, head: to + 2 }
        });
        return true;
    };

    const formatHeading = (view: CodeMirrorEditorView, level: number) => {
        const pos = view.state.selection.main.head;
        const line = view.state.doc.lineAt(pos);
        const prefix = "#".repeat(level) + " ";
        view.dispatch({
            changes: { from: line.from, to: line.from, insert: prefix },
            selection: { anchor: pos + prefix.length }
        });
        return true;
    };

    const formatList = (view: CodeMirrorEditorView, type: 'bullet' | 'ordered' | 'check') => {
        const pos = view.state.selection.main.head;
        const line = view.state.doc.lineAt(pos);
        let prefix = "- ";
        if (type === 'ordered') prefix = "1. ";
        if (type === 'check') prefix = "- [ ] ";

        view.dispatch({
            changes: { from: line.from, to: line.from, insert: prefix },
            selection: { anchor: pos + prefix.length }
        });
        return true;
    };

    const formatQuote = (view: CodeMirrorEditorView) => {
        const pos = view.state.selection.main.head;
        const line = view.state.doc.lineAt(pos);
        const prefix = "> ";
        view.dispatch({
            changes: { from: line.from, to: line.from, insert: prefix },
            selection: { anchor: pos + prefix.length }
        });
        return true;
    };

    const formatLink = (view: CodeMirrorEditorView) => {
        const { from, to } = view.state.selection.main;
        const selectedText = view.state.doc.sliceString(from, to);
        const newText = `[${selectedText}](url)`;
        view.dispatch({
            changes: { from, to, insert: newText },
            selection: { anchor: from + 1, head: from + 1 + selectedText.length }
        });
        return true;
    };

    const handleValueChange = React.useCallback((newValue: string, viewUpdate: any) => {
        onChange(newValue);

        // Перевіряємо чи користувач вводить [[
        const view = viewUpdate.view;
        const cursorPos = view.state.selection.main.head;
        const lineStart = view.state.doc.lineAt(cursorPos).from;
        const textBeforeCursor = view.state.doc.sliceString(lineStart, cursorPos);

        // Шукаємо незакриті [[
        const match = textBeforeCursor.match(/\[\[([^\]]*?)$/);

        if (match) {
            const query = match[1] || "";
            const coords = view.coordsAtPos(cursorPos);

            if (coords) {
                setAutocomplete({
                    show: true,
                    query,
                    position: {
                        top: coords.bottom + 8,
                        left: coords.left
                    },
                    cursorPos: cursorPos - match[0].length
                });
            }
        } else {
            setAutocomplete(null);
        }
    }, [onChange]);

    const handleAutocompleteSelect = (note: { id: string; title: string }) => {
        if (!autocomplete || !editorRef.current?.view) return;

        const view = editorRef.current.view;
        const cursorPos = view.state.selection.main.head;

        // Знаходимо початок [[
        const lineStart = view.state.doc.lineAt(cursorPos).from;
        const textBeforeCursor = view.state.doc.sliceString(lineStart, cursorPos);
        const match = textBeforeCursor.match(/\[\[([^\]]*?)$/);

        if (match) {
            const startPos = cursorPos - match[0].length;
            const noteLink = `[[${note.title}]]`;

            view.dispatch({
                changes: { from: startPos, to: cursorPos, insert: noteLink },
                selection: { anchor: startPos + noteLink.length }
            });
        }

        setAutocomplete(null);
    };

    const extensions = React.useMemo(() => [
        markdown({ base: markdownLanguage, codeLanguages: languages }),
        EditorView.lineWrapping,
        keymap.of([
            {
                key: "Mod-b",
                preventDefault: true,
                run: formatBold
            },
            {
                key: "Mod-i",
                preventDefault: true,
                run: formatItalic
            },
            {
                key: "Mod-e",
                preventDefault: true,
                run: formatCode
            }
        ]),
        EditorView.theme({
            "&": {
                height: "calc(100% - 40px)",
                fontSize: "16px",
                backgroundColor: "transparent !important",
                fontFamily: "var(--font-geist-sans), var(--font-sans), ui-sans-serif, system-ui, sans-serif !important",
            },
            ".cm-scroller": {
                backgroundColor: "transparent !important",
                overflowX: "hidden !important",
                fontFamily: "inherit !important",
            },
            ".cm-content": {
                padding: "20px 0",
                lineHeight: "1.7",
                backgroundColor: "transparent !important",
                fontFamily: "inherit !important",
            },
            // Ultra-aggressive hiding of markdown markers globally except on the active line
            ".cm-line:not(.cm-activeLine) *[class*='formatting'], .cm-line:not(.cm-activeLine) *[class*='cm-formatting'], .cm-line:not(.cm-activeLine) *[class*='cm-m-']": {
                display: "none !important",
                opacity: "0 !important",
                fontSize: "0 !important",
                visibility: "hidden !important",
                pointerEvents: "none !important",
            },
            ".cm-activeLine *[class*='formatting'], .cm-activeLine *[class*='cm-formatting'], .cm-activeLine *[class*='cm-m-']": {
                display: "inline !important",
                opacity: "0.25 !important",
                fontSize: "inherit !important",
                visibility: "visible !important",
            },
            ".cm-line": {
                padding: "0 !important",
            },
            ".cm-activeLine": {
                backgroundColor: "rgba(128,128,128,0.06) !important",
            }
        })
    ], []);

    return (
        <div className="h-full w-full relative flex flex-col">
            <TooltipProvider>
                <div className="flex items-center gap-0.5 py-2 mb-4 border-b border-zinc-200 dark:border-zinc-800 sticky top-0 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-sm z-10 shrink-0 overflow-x-auto no-scrollbar">
                    <ToolbarButton icon={Bold} label="Жирний" shortcut="Mod-B" onClick={() => editorRef.current?.view && formatBold(editorRef.current.view)} />
                    <ToolbarButton icon={Italic} label="Курсив" shortcut="Mod-I" onClick={() => editorRef.current?.view && formatItalic(editorRef.current.view)} />
                    <ToolbarButton icon={Strikethrough} label="Закреслений" onClick={() => editorRef.current?.view && formatStrikethrough(editorRef.current.view)} />
                    <div className="w-px h-4 bg-zinc-200 dark:bg-zinc-800 mx-1" />
                    <ToolbarButton icon={Heading1} label="Заголовок 1" onClick={() => editorRef.current?.view && formatHeading(editorRef.current.view, 1)} />
                    <ToolbarButton icon={Heading2} label="Заголовок 2" onClick={() => editorRef.current?.view && formatHeading(editorRef.current.view, 2)} />
                    <div className="w-px h-4 bg-zinc-200 dark:bg-zinc-800 mx-1" />
                    <ToolbarButton icon={List} label="Список" onClick={() => editorRef.current?.view && formatList(editorRef.current.view, 'bullet')} />
                    <ToolbarButton icon={ListOrdered} label="Нумерований список" onClick={() => editorRef.current?.view && formatList(editorRef.current.view, 'ordered')} />
                    <ToolbarButton icon={CheckSquare} label="Завдання" onClick={() => editorRef.current?.view && formatList(editorRef.current.view, 'check')} />
                    <div className="w-px h-4 bg-zinc-200 dark:bg-zinc-800 mx-1" />
                    <ToolbarButton icon={Quote} label="Цитата" onClick={() => editorRef.current?.view && formatQuote(editorRef.current.view)} />
                    <ToolbarButton icon={LinkIcon} label="Посилання" shortcut="Mod-K" onClick={() => editorRef.current?.view && formatLink(editorRef.current.view)} />
                    <ToolbarButton icon={Code} label="Код" shortcut="Mod-E" onClick={() => editorRef.current?.view && formatCode(editorRef.current.view)} />
                </div>
            </TooltipProvider>

            <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden custom-scrollbar">
                {mounted ? (
                    <CodeMirror
                        ref={editorRef}
                        value={value}
                        height="100%"
                        theme={resolvedTheme === "dark" ? oneDark : "light"}
                        extensions={extensions}
                        onChange={handleValueChange}
                        placeholder={placeholder || "Почніть писати..."}
                        basicSetup={{
                            lineNumbers: false,
                            foldGutter: false,
                            highlightActiveLine: true,
                        }}
                    />
                ) : (
                    <div className="w-full h-full bg-transparent" />
                )}
            </div>

            {autocomplete?.show && (
                <NotesAutocomplete
                    notes={notes}
                    query={autocomplete.query}
                    position={autocomplete.position}
                    onSelect={handleAutocompleteSelect}
                    onClose={() => setAutocomplete(null)}
                />
            )}
        </div>
    );
}

function ToolbarButton({ icon: Icon, label, shortcut, onClick }: { icon: React.ElementType, label: string, shortcut?: string, onClick: () => void }) {
    return (
        <Tooltip>
            <TooltipTrigger asChild>
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
                    onClick={(e) => {
                        e.preventDefault();
                        onClick();
                    }}
                >
                    <Icon className="h-4 w-4" />
                </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="text-[10px] py-1 px-2">
                <div className="flex items-center gap-2">
                    <span>{label}</span>
                    {shortcut && <span className="text-zinc-400 font-mono">{shortcut}</span>}
                </div>
            </TooltipContent>
        </Tooltip>
    );
}
