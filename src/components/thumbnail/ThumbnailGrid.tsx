/**
 * Grid Component for Page Thumbnails with dnd-kit Drag and Drop Reordering
 */

import React, { useMemo, useState } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragStartEvent,
  DragOverlay,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  rectSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { PdfPageItem, AppSettings, SearchFilterState } from '../../types';
import { ThumbnailCard } from './ThumbnailCard';
import { ThumbnailListView } from './ThumbnailListView';

interface SortableThumbnailWrapperProps {
  page: PdfPageItem;
  docBuffer: ArrayBuffer | undefined;
  docColor?: string;
  settings: AppSettings;
  onToggleSelect: (pageId: string, e?: React.MouseEvent) => void;
  onRotateCW: (pageId: string) => void;
  onToggleDelete: (pageId: string) => void;
  onToggleSplit: (pageId: string) => void;
  onPreview: (pageId: string) => void;
  onContextMenu: (e: React.MouseEvent, pageId: string) => void;
}

const SortableThumbnailItem: React.FC<SortableThumbnailWrapperProps> = props => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: props.page.id });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <ThumbnailCard
      {...props}
      setNodeRef={setNodeRef}
      dragStyle={style}
      isDragging={isDragging}
      dragHandleProps={{ ...attributes, ...listeners }}
    />
  );
};

interface ThumbnailGridProps {
  pages: PdfPageItem[];
  filteredPages: PdfPageItem[];
  docBuffersMap: Map<string, ArrayBuffer>;
  docColorsMap: Map<string, string>;
  settings: AppSettings;
  searchFilter: SearchFilterState;
  onMovePage: (fromIdx: number, toIdx: number) => void;
  onToggleSelect: (pageId: string, e?: React.MouseEvent) => void;
  onRotateCW: (pageId: string) => void;
  onRotateCCW?: (pageId: string) => void;
  onDuplicate?: (pageId: string) => void;
  onDelete?: (pageId: string) => void;
  onToggleDelete: (pageId: string) => void;
  onToggleSplit: (pageId: string) => void;
  onToggleLock?: (pageId: string) => void;
  onPreview: (pageId: string) => void;
  onContextMenu: (e: React.MouseEvent, pageId: string) => void;
}

export const ThumbnailGrid: React.FC<ThumbnailGridProps> = ({
  pages,
  filteredPages,
  docBuffersMap,
  docColorsMap,
  settings,
  searchFilter,
  onMovePage,
  onToggleSelect,
  onRotateCW,
  onRotateCCW = () => {},
  onDuplicate = () => {},
  onDelete = () => {},
  onToggleDelete,
  onToggleSplit,
  onToggleLock = () => {},
  onPreview,
  onContextMenu,
}) => {
  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5, // Requires slight drag distance before initiating drag
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);
    if (over && active.id !== over.id) {
      const oldIndex = pages.findIndex(p => p.id === active.id);
      const newIndex = pages.findIndex(p => p.id === over.id);
      if (oldIndex !== -1 && newIndex !== -1) {
        onMovePage(oldIndex, newIndex);
      }
    }
  };

  const handleDragCancel = () => {
    setActiveId(null);
  };

  const pageIds = useMemo(() => filteredPages.map(p => p.id), [filteredPages]);

  const activePage = useMemo(() => {
    if (!activeId) return null;
    return pages.find(p => p.id === activeId);
  }, [pages, activeId]);

  if (settings.viewMode === 'list') {
    return (
      <ThumbnailListView
        pages={filteredPages}
        docBuffersMap={docBuffersMap}
        docColorsMap={docColorsMap}
        settings={settings}
        onToggleSelect={onToggleSelect}
        onRotateCW={onRotateCW}
        onRotateCCW={onRotateCCW}
        onDuplicate={onDuplicate}
        onDelete={onDelete}
        onToggleLock={onToggleLock}
        onPreview={onPreview}
        onContextMenu={onContextMenu}
      />
    );
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
      <SortableContext items={pageIds} strategy={rectSortingStrategy}>
        <div className="flex flex-wrap justify-center gap-3 sm:gap-7 p-3 sm:p-8 max-w-[1600px] mx-auto pb-24">
          {filteredPages.map(page => {
            const buffer = docBuffersMap.get(page.docId);
            const docColor = docColorsMap.get(page.docId);

            return (
              <SortableThumbnailItem
                key={page.id}
                page={page}
                docBuffer={buffer}
                docColor={docColor}
                settings={settings}
                onToggleSelect={onToggleSelect}
                onRotateCW={onRotateCW}
                onToggleDelete={onToggleDelete}
                onToggleSplit={onToggleSplit}
                onPreview={onPreview}
                onContextMenu={onContextMenu}
              />
            );
          })}
        </div>
      </SortableContext>
      <DragOverlay dropAnimation={null}>
        {activePage ? (
          <div className="scale-[1.04] shadow-2xl rotate-[1.5deg] cursor-grabbing transition-transform duration-100 ring-2 ring-blue-500/85 rounded-xl sm:rounded-2xl bg-white dark:bg-slate-900 overflow-hidden">
            <ThumbnailCard
              page={activePage}
              docBuffer={docBuffersMap.get(activePage.docId)}
              docColor={docColorsMap.get(activePage.docId)}
              settings={settings}
              onToggleSelect={() => {}}
              onRotateCW={() => {}}
              onToggleDelete={() => {}}
              onToggleSplit={() => {}}
              onPreview={() => {}}
              onContextMenu={() => {}}
            />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
};
