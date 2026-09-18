import clsx from 'clsx'
import type { Client } from '@/types'
import { PHASE_LABELS, PHASES } from '@/types'
import { phaseStatus } from '@/lib/progress'

export default function PhaseTrack({ client }: { client: Client }) {
  return (
    <div className="flex items-center gap-1">
      {PHASES.map((key) => {
        const phase = client.phases.find((p) => p.key === key)!
        const status = phaseStatus(phase)
        return (
          <div
            key={key}
            title={`${PHASE_LABELS[key]}: ${status.replace('_', ' ')}`}
            className={clsx('h-1.5 w-8 rounded-full', {
              'bg-brand-500': status === 'done',
              'bg-brand-200': status === 'in_progress',
              'bg-surface-sunken': status === 'not_started',
            })}
          />
        )
      })}
    </div>
  )
}
