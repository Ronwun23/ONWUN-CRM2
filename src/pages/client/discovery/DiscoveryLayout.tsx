import { NavLink, Navigate, Outlet, useLocation } from 'react-router-dom'
import clsx from 'clsx'
import { useClientOutlet } from '@/lib/useClient'
import { useViewMode } from '@/context/ViewModeContext'
import { WORKSHOP_QUESTION_COUNT } from '@/data/workshopTemplate'
import { answeredCount } from '@/lib/discoveryProgress'
import BookStrategyCallButton from '@/components/BookStrategyCallButton'

const ALL_TABS = [
  { to: '.', label: 'Workshop', end: true },
  { to: 'answers', label: 'Answers', end: false },
  { to: 'strategy', label: 'Strategy', end: false },
]

const STRATEGY_STATUS_LABEL: Record<string, string> = {
  ai_draft: 'AI draft',
  agency_reviewed: 'Agency reviewed',
  approved: 'Strategy approved',
}

export default function DiscoveryLayout() {
  const client = useClientOutlet()
  const { isClientView } = useViewMode()
  const location = useLocation()
  const { workshop } = client
  const answered = answeredCount(workshop)
  // Strategy — and the AI tooling that produces it — is agency-only; a client
  // previewing their own portal never sees that tab or the document itself.
  const strategyLabel = !isClientView && workshop.strategy ? STRATEGY_STATUS_LABEL[workshop.strategy.status] : null
  const tabs = isClientView ? ALL_TABS.filter((t) => t.label !== 'Strategy') : ALL_TABS

  if (isClientView && location.pathname.endsWith('/strategy')) {
    return <Navigate to=".." replace />
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <h1 className="text-xl font-semibold text-ink-primary">Discovery &amp; Strategy</h1>
          {strategyLabel && (
            <span className="rounded-full bg-brand-50 px-2.5 py-0.5 text-xs font-medium text-brand-700">
              {strategyLabel}
            </span>
          )}
        </div>
        <div className="flex items-center gap-3">
          <p className="text-xs text-ink-muted">
            {answered} / {WORKSHOP_QUESTION_COUNT} questions answered
          </p>
          <BookStrategyCallButton />
        </div>
      </div>

      <nav className="flex items-center gap-1 border-b border-black/[0.08]">
        {tabs.map((tab) => (
          <NavLink
            key={tab.label}
            to={tab.to}
            end={tab.end}
            className={({ isActive }) =>
              clsx(
                'relative px-3 py-2.5 text-sm font-medium transition-colors',
                isActive ? 'text-ink-primary' : 'text-ink-muted hover:text-ink-secondary'
              )
            }
          >
            {({ isActive }: { isActive: boolean }) => (
              <>
                {tab.label}
                {isActive && <span className="absolute inset-x-0 -bottom-px h-0.5 rounded-full bg-brand-500" />}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      <Outlet context={client} />
    </div>
  )
}
