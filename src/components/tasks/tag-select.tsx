"use client";

import * as React from "react";
import { createTag } from "@/server/tasks/actions";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { X, Plus, Tag } from "lucide-react";
import { CommandList } from "@/components/ui/command";


type TagOption = { id: string; name: string };

export function TagSelect({
  tags,
  value,
  onChange,
  disabled,
  hideTrigger = false,
}: {
  tags: TagOption[];
  value: string[];
  onChange: (ids: string[]) => void;
  disabled?: boolean;
  hideTrigger?: boolean;
}) {

  const [open, setOpen] = React.useState(false);
  const [pending, startTransition] = React.useTransition();
  const [searchQuery, setSearchQuery] = React.useState("");

  const selectedTags = tags.filter((t) => value.includes(t.id));
  const filteredTags = tags.filter((t) =>
    t.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const isTagExists = (name: string) => {
    return tags.some((t) => t.name.toLowerCase() === name.toLowerCase().trim());
  };

  const handleToggleTag = (tagId: string) => {
    if (value.includes(tagId)) {
      onChange(value.filter((id) => id !== tagId));
    } else {
      onChange([...value, tagId]);
    }
  };

  const handleCreateTag = (name: string) => {
    const trimmed = name.trim();
    if (!trimmed || isTagExists(trimmed)) return;

    startTransition(async () => {
      try {
        const newTag = await createTag(trimmed);
        onChange([...value, newTag.id]);
        setSearchQuery("");
      } catch (error) {
        console.error("Failed to create tag:", error);
      }
    });
  };

  const content = (
    <Command className="border-0 shadow-none">
      <CommandInput
        placeholder="Пошук або створення мітки..."
        value={searchQuery}
        onValueChange={setSearchQuery}
        className="h-10"
      />
      <CommandList className="max-h-[300px]">
        <CommandEmpty className="py-4 text-xs italic">Нічого не знайдено</CommandEmpty>
        <CommandGroup>
          {searchQuery.trim() && !isTagExists(searchQuery) && (
            <CommandItem
              onSelect={() => handleCreateTag(searchQuery)}
              className="flex items-center gap-2 py-2 cursor-pointer focus:bg-accent"
            >
              <div className="h-4 w-4 flex items-center justify-center rounded-sm bg-primary/10 text-primary">
                <Plus className="h-3 w-3" />
              </div>
              <span className="text-sm font-bold">Створити "{searchQuery}"</span>
            </CommandItem>
          )}

          {filteredTags.map((tag) => {
            const isSelected = value.includes(tag.id);
            return (
              <CommandItem
                key={tag.id}
                value={tag.name}
                onSelect={() => handleToggleTag(tag.id)}
                className="flex items-center gap-2 py-2"
              >
                <Checkbox
                  checked={isSelected}
                  className="h-4 w-4 border-muted-foreground/30 data-[state=checked]:bg-foreground data-[state=checked]:border-foreground"
                />
                <span className="text-sm font-medium">{tag.name}</span>
              </CommandItem>
            );
          })}
        </CommandGroup>
      </CommandList>

    </Command>
  );

  if (hideTrigger) {
    return content;
  }

  return (
    <div className="space-y-2">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" className="justify-start w-full bg-muted/20 border-border/50 hover:bg-muted/40 text-xs h-9" disabled={disabled}>
            {selectedTags.length > 0
              ? `${selectedTags.length} міт${selectedTags.length === 1 ? "ка" : selectedTags.length < 5 ? "ки" : "ок"}`
              : "Додати мітки"}
          </Button>
        </PopoverTrigger>

        <PopoverContent className="w-[300px] p-0" align="start" sideOffset={8}>
          {content}
        </PopoverContent>
      </Popover>


      {selectedTags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 pt-1">
          {selectedTags.map((tag) => (
            <Badge key={tag.id} variant="secondary" className="gap-1.5 pr-1 py-1 px-2.5 bg-foreground/5 text-foreground/80 border-0 hover:bg-foreground/10 transition-colors rounded-lg font-semibold text-[11px]">
              {tag.name}
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                onClick={() => handleToggleTag(tag.id)}
                disabled={disabled}
                className="ml-0.5 h-5 w-5 rounded-full p-0 hover:bg-foreground/20"
              >
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          ))}
        </div>
      )}

    </div>
  );
}
