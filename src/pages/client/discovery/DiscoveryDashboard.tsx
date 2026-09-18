import { useNavigate } from 'react-router-dom'
import { ArrowRight, Check } from 'lucide-react'
import clsx from 'clsx'
import { useClientOutlet } from '@/lib/useClient'
import { useApp } from '@/context/AppContext'
import { WORKSHOP_PHASES, WORKSHOP_QUESTION_COUNT } from '@/data/workshopTemplate'
import { answeredCount, discoveryPercent, phaseCompletionStatus, PHASE_STATUS_LABEL } from '@/lib/discoveryProgress'

export default function DiscoveryDashboard() {
  const client = useClientOutlet()
  const { startWorkshop, setWorkshopPosition } = useApp()
  const navigate = useNavigate()
  const { workshop } = client

  const answered = answeredCount(workshop)
  const percent = discoveryPercent(workshop)

  const goToSession = () => navigate(`/clients/${client.id}/discovery/session`)

  const handleStart = () => {
    startWorkshop(client.id)
    goToSession()
  }

  const handleContinue = () => {
    goToSession()
  }

  return (
    <div className="flex flex-col gap-10 pb-8">
      <div className="max-w-xl">
        <p className="max-w-md text-sm leading-relaxed text-ink-secondary">
          Let's uncover what makes {client.name}'s brand matter, where it stands today, and where it's going.
        </p>
      </div>

      {workshop.completed ? (
        <div className="flex flex-col items-start gap-3 rounded-2xl border border-black/[0.06] bg-white px-6 py-6">
          <p className="text-sm font-semibold text-ink-primary">Discovery complete</p>
          <p className="text-sm text-ink-secondary">All discovery questions have been completed.</p>
          <div className="flex items-center gap-4 text-sm text-ink-secondary">
            <span className="font-medium tabular-nums text-ink-primary">
              {answered} / {WORKSHOP_QUESTION_COUNT} questions
            </span>
            <span className="tabular-nums">{percent}%</span>
          </div>
          <button
            onClick={() => navigate(`/clients/${client.id}/discovery/answers`)}
            className="mt-1 flex items-center gap-1.5 rounded-lg bg-brand-500 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-600"
          >
            View answers
            <ArrowRight size={15} />
          </button>
        </div>
      ) : (
        <div className="flex flex-col items-start gap-4 rounded-2xl border border-black/[0.06] bg-white px-6 py-6">
          <div className="flex w-full items-center gap-2">
            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-surface-sunken">
              <div className="h-full rounded-full bg-brand-500 transition-all" style={{ width: `${percent}%` }} />
            </div>
            <span className="shrink-0 text-xs font-medium tabular-nums text-ink-muted">
              {answered} / {WORKSHOP_QUESTION_COUNT}
            </span>
          </div>
          <button
            onClick={workshop.started ? handleContinue : handleStart}
            className="flex items-center gap-1.5 rounded-lg bg-brand-500 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-600"
          >
            {workshop.started ? 'Continue questionnaire' : 'Start questionnaire'}
            <ArrowRight size={15} />
          </button>
        </div>
      )}

      <div>
        <p className="mb-3 text-xs font-medium uppercase tracking-wide text-ink-muted">The process</p>
        <ol className="flex flex-col divide-y divide-black/[0.06] rounded-2xl border border-black/[0.06] bg-white">
          {WORKSHOP_PHASES.map((phase, i) => {
            const status = phaseCompletionStatus(phase, workshop)
            return (
              <li key={phase.id}>
                <button
                  onClick={() => {
                    startWorkshop(client.id)
                    setWorkshopPosition(client.id, i, 'intro', 0)
                    goToSession()
                  }}
                  className="flex w-full items-start gap-4 px-5 py-4 text-left transition-colors hover:bg-surface-sunken/40"
                >
                  <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-black/10 text-xs font-medium tabular-nums text-ink-muted">
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-medium text-ink-primary">{phase.title}</span>
                    <span className="mt-0.5 block text-sm text-ink-muted">{phase.description}</span>
                  </span>
                  <span
                    className={clsx(
                      'mt-0.5 flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium',
                      status === 'complete' && 'bg-brand-50 text-brand-700',
                      status === 'in_progress' && 'bg-surface-sunken text-ink-secondary',
                      status === 'not_started' && 'text-ink-muted'
                    )}
                  >
                    {status === 'complete' && <Check size={12} strokeWidth={3} />}
                    {PHASE_STATUS_LABEL[status]}
                  </span>
                </button>
              </li>
            )
          })}
        </ol>
      </div>
    </div>
  )
}
