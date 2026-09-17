import { useDraggable } from '@dnd-kit/core'
import { CSS } from '@dnd-kit/utilities'
import type { Lead } from '@/types'
import { OwnerAvatar } from '@/components/Avatar'
import PriorityBadge from '@/components/PriorityBadge'
import { formatCurrency } from '@/lib/format'

export default function PipelineCard({ lead, onClick }: { lead: Lead; onClick: () => void }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: lead.id,
  })

  const style = {
    transform: CSS.Translate.toString(transform),
    opacity: isDragging ? 0.4 : 1,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      onClick={onClick}
      className="cursor-grab select-none rounded-lg border border-black/[0.06] bg-white p-3 shadow-card active:cursor-grabbing"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-ink-primary">{lead.name}</p>
          <p className="truncate text-xs text-ink-muted">{lead.company}</p>
        </div>
        <OwnerAvatar ownerId={lead.owner} size={20} />
      </div>
      <div className="mt-2.5 flex items-center justify-between">
        <span className="text-sm font-semibold tabular-nums text-ink-primary">
          {formatCurrency(lead.value)}
        </span>
        <PriorityBadge priority={lead.priority} />
      </div>
    </div>
  )
}
