"use client";

import React, { useState, useTransition } from "react";
import { WidgetLayout, DEFAULT_LAYOUT, WIDGET_CATALOG, renderWidget } from "./widgets";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  rectSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Button } from "@/components/ui/button";
import { updateDashboardActivityLayoutAction } from "@/app/dashboard/actions";
import { toast } from "sonner";
import { Loader2, Edit3, Check, GripHorizontal, X, Plus, Maximize2, Minimize2 } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

const SIZE_LABELS: Record<WidgetLayout["size"], string> = {
  sm: "S",
  md: "M",
  lg: "L",
};

const SIZE_ORDER: WidgetLayout["size"][] = ["sm", "md", "lg"];

const SIZE_CLASSES: Record<WidgetLayout["size"], string> = {
  sm: "col-span-1 aspect-square",
  md: "col-span-2 aspect-[2.1/1]",
  lg: "col-span-2 aspect-square",
};

function SortableWidget({ item, isEditing, onRemove, onResize, children }: {
  item: WidgetLayout;
  isEditing: boolean;
  onRemove: () => void;
  onResize: (size: WidgetLayout["size"]) => void;
  children: React.ReactNode;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: item.id,
    disabled: !isEditing,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : 1,
    opacity: isDragging ? 0.6 : 1,
  };

  const currentSizeIdx = SIZE_ORDER.indexOf(item.size);
  const canGrow = currentSizeIdx < SIZE_ORDER.length - 1;
  const canShrink = currentSizeIdx > 0;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`relative ${SIZE_CLASSES[item.size]}`}
    >
      <div
        className={`h-full relative rounded-2xl transition-all duration-300 ${
          isEditing
            ? "ring-2 ring-border cursor-grab active:cursor-grabbing scale-[0.97]"
            : ""
        }`}
        {...(isEditing ? { ...attributes, ...listeners } : {})}
      >
        {/* EDIT CONTROLS */}
        {isEditing && (
          <>
            {/* Remove button */}
            <button
              onPointerDown={(e) => e.stopPropagation()}
              onClick={(e) => { e.stopPropagation(); onRemove(); }}
              className="absolute -top-2.5 -left-2.5 z-30 h-6 w-6 rounded-full bg-destructive text-white flex items-center justify-center shadow-md hover:scale-110 transition-transform"
            >
              <X className="h-3.5 w-3.5" />
            </button>

            {/* Grip indicator */}
            <div className="absolute inset-x-0 top-1 flex justify-center z-10 pointer-events-none">
              <div className="bg-background/90 border border-border shadow-sm rounded-full px-2 py-0.5 flex items-center gap-1">
                <GripHorizontal className="h-3 w-3 text-muted-foreground" />
                <span className="text-[10px] text-muted-foreground">перетягнути</span>
              </div>
            </div>

            {/* Size controls */}
            <div
              className="absolute -bottom-2.5 left-1/2 -translate-x-1/2 z-30 flex items-center gap-1 bg-background border border-border rounded-full px-1.5 py-0.5 shadow-md"
              onPointerDown={(e) => e.stopPropagation()}
            >
              <button
                onClick={(e) => { e.stopPropagation(); canShrink && onResize(SIZE_ORDER[currentSizeIdx - 1]); }}
                disabled={!canShrink}
                className="h-4 w-4 flex items-center justify-center rounded-full hover:bg-muted disabled:opacity-30 transition-colors"
              >
                <Minimize2 className="h-2.5 w-2.5" />
              </button>
              <span className="text-[10px] font-bold text-foreground/70 min-w-[16px] text-center">
                {SIZE_LABELS[item.size]}
              </span>
              <button
                onClick={(e) => { e.stopPropagation(); canGrow && onResize(SIZE_ORDER[currentSizeIdx + 1]); }}
                disabled={!canGrow}
                className="h-4 w-4 flex items-center justify-center rounded-full hover:bg-muted disabled:opacity-30 transition-colors"
              >
                <Maximize2 className="h-2.5 w-2.5" />
              </button>
            </div>
          </>
        )}

        {/* Content — non-interactive when editing to avoid accidental clicks */}
        <div className={`h-full ${isEditing ? "pointer-events-none select-none" : ""}`}>
          {children}
        </div>
      </div>
    </div>
  );
}

export function DashboardGrid({ initialLayout, data, isEditing, setIsEditing }: { 
  initialLayout: any; 
  data: any;
  isEditing: boolean;
  setIsEditing: (val: boolean) => void;
}) {
  const [items, setItems] = useState<WidgetLayout[]>(
    Array.isArray(initialLayout) && initialLayout.length > 0
      ? initialLayout
      : DEFAULT_LAYOUT
  );
  const [isPending, startTransition] = useTransition();
  const [sheetOpen, setSheetOpen] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor)
  );

  const handleDragEnd = (event: any) => {
    const { active, over } = event;
    if (active.id !== over?.id) {
      setItems((items) => {
        const oldIndex = items.findIndex((i) => i.id === active.id);
        const newIndex = items.findIndex((i) => i.id === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  const handleRemove = (id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
  };

  const handleResize = (id: string, size: WidgetLayout["size"]) => {
    setItems((prev) => prev.map((i) => i.id === id ? { ...i, size } : i));
  };

  const handleAddWidget = (type: WidgetLayout["type"]) => {
    const catalogEntry = WIDGET_CATALOG.find((c) => c.type === type);
    const newWidget: WidgetLayout = {
      id: `${type.toLowerCase()}-${Date.now()}`,
      type,
      size: catalogEntry?.defaultSize ?? "md",
    };
    setItems((prev) => [...prev, newWidget]);
    setSheetOpen(false);
  };

  const handleSave = () => {
    setIsEditing(false);
    startTransition(async () => {
      const res = await updateDashboardActivityLayoutAction(items);
      if (res.error) toast.error(res.error);
      else toast.success("Макет збережено");
    });
  };

  const handleCancel = () => {
    setIsEditing(false);
  };

  const existingTypes = items.map((i) => i.type);

  return (
    <div className="space-y-4">
      {/* TOOLBAR (only shows when editing) */}
      {isEditing && (
        <div className="flex justify-between items-center rounded-2xl border px-4 py-2.5 transition-all border-foreground/20 bg-foreground/[0.03]">
          <div className="flex items-center gap-3">
            <span className="text-sm font-semibold">Налаштування віджетів</span>
            <span className="text-xs text-muted-foreground hidden sm:inline">Перетягуйте для зміни порядку</span>
          </div>

          <div className="flex items-center gap-2">
            {/* Add widget button */}
            <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
              <SheetTrigger asChild>
                <Button variant="outline" size="sm" className="gap-1.5 rounded-xl text-xs h-8">
                  <Plus className="h-3.5 w-3.5" />
                  Додати
                </Button>
              </SheetTrigger>
              <SheetContent className="w-[360px] sm:w-[420px] flex flex-col h-full">
                <SheetHeader className="shrink-0 pb-4 border-b">
                  <SheetTitle>Бібліотека віджетів</SheetTitle>
                </SheetHeader>
                <div className="flex-1 overflow-y-auto mt-4 pr-1 space-y-2 pb-8 scrollbar-hide">
                  {WIDGET_CATALOG.map((widget) => {
                    const alreadyAdded = existingTypes.includes(widget.type);
                    return (
                      <button
                        key={widget.type}
                        disabled={alreadyAdded}
                        onClick={() => handleAddWidget(widget.type)}
                        className="w-full flex items-start gap-3 p-3 rounded-xl border border-border/50 hover:border-border hover:bg-muted/40 transition-all text-left disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium">{widget.label}</span>
                            {alreadyAdded && (
                              <span className="text-[10px] font-semibold bg-muted text-muted-foreground rounded-full px-2 py-0.5">додано</span>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground mt-0.5">{widget.description}</p>
                        </div>
                        <span className="text-[10px] font-semibold bg-muted text-muted-foreground rounded-md px-1.5 py-0.5 shrink-0">
                          {SIZE_LABELS[widget.defaultSize]}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </SheetContent>
            </Sheet>

            {/* Cancel */}
            <Button onClick={handleCancel} variant="ghost" size="sm" className="rounded-xl text-xs h-8">
              Скасувати
            </Button>

            {/* Save */}
            <Button
              onClick={handleSave}
              disabled={isPending}
              size="sm"
              className="gap-1.5 rounded-xl text-xs h-8"
            >
              {isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
              Зберегти
            </Button>
          </div>
        </div>
      )}

      {/* GRID */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext items={items.map((i) => i.id)} strategy={rectSortingStrategy}>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
            {items.map((item) => (
              <SortableWidget
                key={item.id}
                item={item}
                isEditing={isEditing}
                onRemove={() => handleRemove(item.id)}
                onResize={(size) => handleResize(item.id, size)}
              >
                {renderWidget(item, data)}
              </SortableWidget>
            ))}
          </div>
        </SortableContext>
      </DndContext>

      {/* Empty state */}
      {items.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-center border border-dashed border-border/50 rounded-2xl">
          <p className="text-muted-foreground text-sm mb-3">Панель порожня</p>
          <Button onClick={() => { setIsEditing(true); setSheetOpen(true); }} variant="outline" size="sm" className="gap-1.5 rounded-xl">
            <Plus className="h-3.5 w-3.5" />
            Додати перший віджет
          </Button>
        </div>
      )}
    </div>
  );
}
