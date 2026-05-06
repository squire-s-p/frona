"use client";

import * as React from "react";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Button } from "@/components/ui/button";
import { SearchIcon } from "@/components/icons/search-icon";
import { searchDashboard, type SearchResult } from "@/server/search/queries";
import { useRouter } from "next/navigation";
import { 
  CheckCircle2, 
  Briefcase, 
  FileText, 
  Users, 
  Layout, 
  Loader2 
} from "lucide-react";

export function SearchCommand() {
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const [results, setResults] = React.useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);
  const [mounted, setMounted] = React.useState(false);
  const router = useRouter();

  React.useEffect(() => {
    setMounted(true);
    const onKeyDown = (e: KeyboardEvent) => {
      const isK = e.code === "KeyK" || e.key === "k" || e.key === "K";
      if ((e.metaKey || e.ctrlKey) && isK) {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  React.useEffect(() => {
    if (query.length < 2) {
      setResults([]);
      setIsLoading(false);
      return;
    }

    const timer = setTimeout(async () => {
      setIsLoading(true);
      try {
        const data = await searchDashboard(query);
        setResults(data);
      } catch (error) {
        console.error("Search error:", error);
      } finally {
        setIsLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  const onSelect = (href: string) => {
    router.push(href);
    setOpen(false);
    setQuery("");
  };

  const tasks = results.filter((r) => r.type === "task");
  const projects = results.filter((r) => r.type === "project");
  const notes = results.filter((r) => r.type === "note");
  const clients = results.filter((r) => r.type === "client");
  const whiteboards = results.filter((r) => r.type === "whiteboard");

  return (
    <>
      <Button
        size="icon-lg"
        variant="outline"
        className="group border-input hover:bg-accent"
        onClick={() => setOpen(true)}
        title="Пошук (Ctrl+K)"
        aria-label="Пошук"
      >
        <SearchIcon className="h-4 w-4 text-muted-foreground group-hover:text-foreground" />
      </Button>

      {mounted && (
        <CommandDialog 
          open={open} 
          onOpenChange={setOpen}
          shouldFilter={false}
        >
          <CommandInput 
            placeholder="Шукайте завдання, проєкти, нотатки..." 
            value={query}
            onValueChange={setQuery}
          />
          <CommandList>
            {isLoading && (
              <div className="flex items-center justify-center py-6 text-sm text-muted-foreground">
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Шукаємо...
              </div>
            )}
            {!isLoading && query.length >= 2 && results.length === 0 && (
              <CommandEmpty>Нічого не знайдено за запитом &quot;{query}&quot;</CommandEmpty>
            )}
            {!isLoading && query.length > 0 && query.length < 2 && (
              <div className="py-6 text-center text-sm text-muted-foreground">
                Введіть принаймні 2 символи...
              </div>
            )}

            {projects.length > 0 && (
              <CommandGroup heading="Проєкти">
                {projects.map((item) => (
                  <CommandItem key={item.id} onSelect={() => onSelect(item.href)}>
                    <Briefcase className="mr-2 h-4 w-4" />
                    <span>{item.title}</span>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}

            {tasks.length > 0 && (
              <CommandGroup heading="Завдання">
                {tasks.map((item) => (
                  <CommandItem key={item.id} onSelect={() => onSelect(item.href)}>
                    <CheckCircle2 className="mr-2 h-4 w-4" />
                    <span>{item.title}</span>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}

            {notes.length > 0 && (
              <CommandGroup heading="Нотатки">
                {notes.map((item) => (
                  <CommandItem key={item.id} onSelect={() => onSelect(item.href)}>
                    <FileText className="mr-2 h-4 w-4" />
                    <span>{item.title}</span>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}

            {clients.length > 0 && (
              <CommandGroup heading="Клієнти">
                {clients.map((item) => (
                  <CommandItem key={item.id} onSelect={() => onSelect(item.href)}>
                    <Users className="mr-2 h-4 w-4" />
                    <span>{item.title}</span>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}

            {whiteboards.length > 0 && (
              <CommandGroup heading="Дошки">
                {whiteboards.map((item) => (
                  <CommandItem key={item.id} onSelect={() => onSelect(item.href)}>
                    <Layout className="mr-2 h-4 w-4" />
                    <span>{item.title}</span>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
          </CommandList>
        </CommandDialog>
      )}
    </>
  );
}

