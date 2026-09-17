import type { ReactNode } from 'react'

export default function ChartCard({
  title,
  subtitle,
  children,
  legend,
}: {
  title: string
  subtitle?: string
  children: ReactNode
  legend?: ReactNode
}) {
  return (
    <div className="rounded-xl border border-black/[0.06] bg-white p-4 shadow-card">
      <div className="mb-3 flex items-start justify-between">
        <div>
          <h3 className="text-sm font-semibold text-ink-primary">{title}</h3>
          {subtitle && <p className="text-xs text-ink-muted">{subtitle}</p>}
        </div>
        {legend}
      </div>
      {children}
    </div>
  )
}

export function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-xs text-ink-secondary">
      <span className="h-2 w-2 rounded-full" style={{ backgroundColor: color }} />
      {label}
    </span>
  )
}

export function ChartTooltip({
  active,
  payload,
  label,
  formatter,
}: {
  active?: boolean
  payload?: { name: string; value: number; color?: string }[]
  label?: string
  formatter?: (value: number, name: string) => string
}) {
  if (!active || !payload || payload.length === 0) return null
  return (
    <div className="rounded-lg border border-black/[0.08] bg-white px-3 py-2 shadow-pop">
      {label && <p className="mb-1 text-xs font-medium text-ink-secondary">{label}</p>}
      {payload.map((p, i) => (
        <div key={i} className="flex items-center gap-1.5 text-xs">
          {p.color && <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: p.color }} />}
          <span className="text-ink-secondary">{p.name}:</span>
          <span className="font-medium tabular-nums text-ink-primary">
            {formatter ? formatter(p.value, p.name) : p.value}
          </span>
        </div>
      ))}
    </div>
  )
}
