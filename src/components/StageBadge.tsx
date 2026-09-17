import clsx from 'clsx'
import type { Stage } from '@/types'
import { STAGE_LABELS } from '@/types'

const STAGE_STYLES: Record<Stage, string> = {
  new: 'bg-surface-sunken text-ink-secondary',
  contacted: 'bg-brand-50 text-brand-700',
  qualified: 'bg-[#eaf7f1] text-[#0d7d57]',
  proposal: 'bg-[#fdf1de] text-[#96660a]',
  negotiation: 'bg-[#f1eefb] text-[#4a3aa7]',
  won: 'bg-[#e8f7e8] text-[#0d6b0d]',
  lost: 'bg-[#fbecec] text-[#a92e2d]',
}

export default function StageBadge({ stage }: { stage: Stage }) {
  return (
    <span
      className={clsx(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
        STAGE_STYLES[stage]
      )}
    >
      {STAGE_LABELS[stage]}
    </span>
  )
}
