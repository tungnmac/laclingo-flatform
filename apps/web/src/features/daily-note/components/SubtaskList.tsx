'use client'

import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import { SortableContext, arrayMove, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { useTranslation } from '@/hooks/useTranslation'
import { cn } from '@/lib/utils'
import type { DailyTaskItem } from '@/types/api'

/** Checklist việc con: tích xong, xoá, kéo tay nắm ⋮⋮ để sắp thứ tự ưu tiên (chuột, cảm ứng, bàn phím) */
export function SubtaskList({
  items,
  editable,
  busy,
  onToggle,
  onDelete,
  onReorder,
}: {
  items: DailyTaskItem[]
  editable: boolean
  busy: boolean
  onToggle: (item: DailyTaskItem) => void
  onDelete: (item: DailyTaskItem) => void
  onReorder: (items: DailyTaskItem[]) => void
}) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    // Cảm ứng: giữ một chút mới kéo — vuốt nhanh vẫn cuộn trang được
    useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )
  const onDragEnd = ({ active, over }: DragEndEvent) => {
    if (!over || active.id === over.id) return
    const from = items.findIndex((i) => i.id === active.id)
    const to = items.findIndex((i) => i.id === over.id)
    if (from >= 0 && to >= 0) onReorder(arrayMove(items, from, to))
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
      <SortableContext items={items.map((i) => i.id)} strategy={verticalListSortingStrategy}>
        <ul className="mt-2 space-y-1">
          {items.map((item) => (
            <SubtaskRow
              key={item.id}
              item={item}
              editable={editable}
              busy={busy}
              sortable={editable && items.length > 1}
              onToggle={onToggle}
              onDelete={onDelete}
            />
          ))}
        </ul>
      </SortableContext>
    </DndContext>
  )
}

function SubtaskRow({
  item,
  editable,
  busy,
  sortable,
  onToggle,
  onDelete,
}: {
  item: DailyTaskItem
  editable: boolean
  busy: boolean
  sortable: boolean
  onToggle: (item: DailyTaskItem) => void
  onDelete: (item: DailyTaskItem) => void
}) {
  const t = useTranslation()
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } = useSortable({
    id: item.id,
    disabled: !sortable || busy,
  })

  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn('group flex items-center gap-2 rounded-md text-sm', isDragging && 'relative z-10 bg-white shadow-md ring-1 ring-indigo-200')}
    >
      {sortable && (
        <button
          type="button"
          ref={setActivatorNodeRef}
          {...attributes}
          {...listeners}
          className="shrink-0 cursor-grab touch-none rounded px-0.5 leading-none text-slate-300 hover:bg-slate-100 hover:text-slate-500 active:cursor-grabbing"
          aria-label={t.daily.dragItem(item.title)}
          title={t.daily.dragItem(item.title)}
        >
          ⋮⋮
        </button>
      )}
      <input
        type="checkbox"
        checked={item.done}
        disabled={!editable || busy}
        onChange={() => onToggle(item)}
        className="h-4 w-4 shrink-0 accent-emerald-600"
        aria-label={item.title}
      />
      <span className={cn('min-w-0 flex-1 break-words', item.done ? 'text-slate-400 line-through' : 'text-slate-700')}>{item.title}</span>
      {editable && (
        <button
          type="button"
          disabled={busy}
          onClick={() => onDelete(item)}
          className="shrink-0 rounded px-1 text-slate-400 hover:bg-rose-50 hover:text-rose-600 sm:opacity-0 sm:group-hover:opacity-100 sm:focus:opacity-100"
          aria-label={t.daily.deleteItem(item.title)}
          title={t.daily.deleteItem(item.title)}
        >
          ×
        </button>
      )}
    </li>
  )
}
