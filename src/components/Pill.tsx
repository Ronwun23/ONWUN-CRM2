import clsx from 'clsx'
import type { ReactNode } from 'react'

export type PillTone = 'neutral' | 'brand' | 'good' | 'warning' | 'critical'

const TONE_STYLES: Record<PillTone, string> = {
  neutral: 'bg-surface-sunken text-ink-secondary',
  brand: 'bg-brand-50 text-brand-700',
  good: 'bg-[#e8f7e8] text-[#0d6b0d]',
  warning: 'bg-[#fdf1de] text-[#96660a]',
  critical: 'bg-[#fbecec] text-[#a92e2d]',
}

export default function Pill({ tone = 'neutral', children }: { tone?: PillTone; children: ReactNode }) {
  return (
    <span className={clsx('inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium', TONE_STYLES[tone])}>
      {children}
    </span>
  )
}
