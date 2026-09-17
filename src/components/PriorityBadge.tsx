import clsx from 'clsx'
import type { Priority } from '@/types'

const STYLES: Record<Priority, string> = {
  high: 'text-status-critical',
  medium: 'text-[#96660a]',
  low: 'text-ink-muted',
}

const LABELS: Record<Priority, string> = {
  high: 'High',
  medium: 'Medium',
  low: 'Low',
}

export default function PriorityBadge({ priority }: { priority: Priority }) {
  return (
    <span className={clsx('inline-flex items-center gap-1 text-xs font-medium', STYLES[priority])}>
      <span
        className={clsx('h-1.5 w-1.5 rounded-full', {
          'bg-status-critical': priority === 'high',
          'bg-[#96660a]': priority === 'medium',
          'bg-ink-muted': priority === 'low',
        })}
      />
      {LABELS[priority]}
    </span>
  )
}
