import type { LucideIcon } from 'lucide-react'
import clsx from 'clsx'

interface StatCardProps {
  label: string
  value: string
  delta?: string
  deltaTone?: 'good' | 'bad' | 'neutral'
  icon: LucideIcon
}

export default function StatCard({ label, value, delta, deltaTone = 'neutral', icon: Icon }: StatCardProps) {
  return (
    <div className="rounded-xl border border-black/[0.06] bg-white p-4 shadow-card">
      <div className="flex items-start justify-between">
        <p className="text-sm font-medium text-ink-secondary">{label}</p>
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-surface-sunken text-ink-secondary">
          <Icon size={16} strokeWidth={2} />
        </div>
      </div>
      <p className="mt-2 text-2xl font-semibold tabular-nums text-ink-primary">{value}</p>
      {delta && (
        <p
          className={clsx('mt-1 text-xs font-medium', {
            'text-status-good': deltaTone === 'good',
            'text-status-critical': deltaTone === 'bad',
            'text-ink-muted': deltaTone === 'neutral',
          })}
        >
          {delta}
        </p>
      )}
    </div>
  )
}
