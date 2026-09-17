import { useDroppable } from '@dnd-kit/core'
import clsx from 'clsx'
import type { Lead, Stage } from '@/types'
import { STAGE_LABELS } from '@/types'
import PipelineCard from '@/components/PipelineCard'
import { formatCurrency } from '@/lib/format'

export default function PipelineColumn({
  stage,
  leads,
  onCardClick,
}: {
  stage: Stage
  leads: Lead[]
  onCardClick: (lead: Lead) => void
}) {
  const { setNodeRef, isOver } = useDroppable({ id: stage })
  const total = leads.reduce((sum, l) => sum + l.value, 0)

  return (
    <div className="flex w-72 shrink-0 flex-col">
      <div className="mb-2.5 flex items-center justify-between px-0.5">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold text-ink-primary">{STAGE_LABELS[stage]}</h3>
          <span className="rounded-full bg-surface-sunken px-1.5 py-0.5 text-xs font-medium text-ink-muted">
            {leads.length}
          </span>
        </div>
        <span className="text-xs font-medium tabular-nums text-ink-muted">{formatCurrency(total)}</span>
      </div>
      <div
        ref={setNodeRef}
        className={clsx(
          'flex min-h-[120px] flex-1 flex-col gap-2 rounded-xl border p-2 transition-colors',
          isOver ? 'border-brand-400 bg-brand-50/60' : 'border-black/[0.05] bg-surface-sunken/50'
        )}
      >
        {leads.map((lead) => (
          <PipelineCard key={lead.id} lead={lead} onClick={() => onCardClick(lead)} />
        ))}
        {leads.length === 0 && (
          <p className="px-1 py-3 text-center text-xs text-ink-muted">Drop leads here</p>
        )}
      </div>
    </div>
  )
}
