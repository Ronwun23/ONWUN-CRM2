import type { ReactNode } from 'react'
import clsx from 'clsx'

export default function Card({
  title,
  subtitle,
  action,
  children,
  className,
  padded = true,
}: {
  title?: string
  subtitle?: string
  action?: ReactNode
  children: ReactNode
  className?: string
  padded?: boolean
}) {
  return (
    <div className={clsx('rounded-xl border border-black/[0.06] bg-white shadow-card', padded && 'p-4', className)}>
      {(title || action) && (
        <div className={clsx('flex items-start justify-between', padded ? 'mb-3' : 'p-4 pb-0')}>
          <div>
            {title && <h3 className="text-sm font-semibold text-ink-primary">{title}</h3>}
            {subtitle && <p className="text-xs text-ink-muted">{subtitle}</p>}
          </div>
          {action}
        </div>
      )}
      {children}
    </div>
  )
}
