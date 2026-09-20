import { useState } from 'react'
import { Check, Eye, Plus } from 'lucide-react'
import clsx from 'clsx'
import { useClientOutlet } from '@/lib/useClient'
import { useApp } from '@/context/AppContext'
import { useViewMode } from '@/context/ViewModeContext'
import Card from '@/components/Card'
import Pill from '@/components/Pill'
import { Steps } from '@/components/Steps'
import { ClientAvatar, MemberAvatar, memberName } from '@/components/Avatar'
import TimelineStrip from '@/components/TimelineStrip'
import { CLIENT_STATUS_LABEL, CLIENT_STATUS_TONE } from '@/lib/labels'
import { overallProgress, phaseStatus } from '@/lib/progress'
import { formatDate } from '@/lib/format'
import { PHASE_LABELS, PHASES } from '@/types'

export default function ClientDashboard() {
  const client = useClientOutlet()
  const { toggleStep, addStep } = useApp()
  const { isClientView, setIsClientView } = useViewMode()
  const [selectedPhase, setSelectedPhase] = useState(client.phases[0].key)
  const [newStepTitle, setNewStepTitle] = useState('')

  const phase = client.phases.find((p) => p.key === selectedPhase)!
  const progress = overallProgress(client)
  // activeStep = index of the first phase that isn't fully done, or PHASES.length
  // if every phase is done (so the stepper shows all steps as completed).
  const firstOpenPhaseIndex = PHASES.findIndex((key) => phaseStatus(client.phases.find((p) => p.key === key)!) !== 'done')
  const activeStep = firstOpenPhaseIndex === -1 ? PHASES.length : firstOpenPhaseIndex

  const handleAddStep = () => {
    if (!newStepTitle.trim()) return
    addStep(client.id, selectedPhase, newStepTitle.trim())
    setNewStepTitle('')
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <ClientAvatar initials={client.initials} color={client.color} avatarUrl={client.avatarUrl} size={44} />
          <div>
            <h1 className="text-xl font-semibold text-ink-primary">{client.name}</h1>
            <p className="text-sm text-ink-secondary">{client.projectName}</p>
          </div>
        </div>
        <div className="flex items-center gap-2.5">
          <Pill tone={CLIENT_STATUS_TONE[client.status]}>{CLIENT_STATUS_LABEL[client.status]}</Pill>
          <button
            onClick={() => setIsClientView(!isClientView)}
            className={clsx(
              'flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors',
              isClientView
                ? 'bg-brand-500 text-white hover:bg-brand-600'
                : 'border border-black/[0.10] text-ink-secondary hover:bg-surface-sunken'
            )}
          >
            <Eye size={13} />
            {isClientView ? 'Exit client view' : 'View as client'}
          </button>
        </div>
      </div>

      <Card>
        <Steps activeStep={activeStep} aria-label="Project phase">
          {PHASES.map((key, i) => (
            <Steps.Item key={key} index={i} label={PHASE_LABELS[key]}>
              <Steps.Indicator />
              {i < PHASES.length - 1 && <Steps.Separator />}
            </Steps.Item>
          ))}
        </Steps>
      </Card>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_280px]">
        <Card title="The process" padded={false}>
          <div className="flex">
            <div className="flex w-44 shrink-0 flex-col gap-0 border-r border-black/[0.06] p-3">
              {PHASES.map((key, i) => {
                const p = client.phases.find((ph) => ph.key === key)!
                const status = phaseStatus(p)
                const doneCount = p.steps.filter((s) => s.done).length
                return (
                  <button
                    key={key}
                    onClick={() => setSelectedPhase(key)}
                    className={clsx(
                      'flex items-start gap-2.5 rounded-lg px-2.5 py-2.5 text-left transition-colors',
                      selectedPhase === key ? 'bg-surface-sunken' : 'hover:bg-surface-sunken/60'
                    )}
                  >
                    <div className="flex flex-col items-center">
                      <span
                        className={clsx(
                          'flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-white',
                          status === 'done' ? 'bg-brand-500' : status === 'in_progress' ? 'bg-brand-300' : 'bg-surface-sunken border border-black/10'
                        )}
                      >
                        {status === 'done' && <Check size={12} strokeWidth={3} />}
                      </span>
                      {i < PHASES.length - 1 && <span className="mt-0.5 h-6 w-px bg-black/10" />}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-ink-primary">{PHASE_LABELS[key]}</p>
                      <p className="text-xs text-ink-muted">
                        {status === 'done'
                          ? 'Completed'
                          : status === 'not_started'
                            ? 'Not started'
                            : `${doneCount}/${p.steps.length} done`}
                      </p>
                    </div>
                  </button>
                )
              })}
            </div>

            <div className="flex-1 p-4">
              <ul className="flex flex-col divide-y divide-black/[0.05]">
                {phase.steps.map((step) => (
                  <li key={step.id} className="flex items-center gap-3 py-2.5">
                    <button
                      onClick={() => toggleStep(client.id, phase.key, step.id)}
                      className={clsx(
                        'flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-colors',
                        step.done ? 'border-brand-500 bg-brand-500 text-white' : 'border-black/20 hover:border-brand-500'
                      )}
                      aria-label="Toggle step"
                    >
                      {step.done && <Check size={11} strokeWidth={3} />}
                    </button>
                    <span className={clsx('flex-1 text-sm', step.done ? 'text-ink-muted line-through' : 'text-ink-primary')}>
                      {step.title}
                    </span>
                    <Pill tone={step.done ? 'good' : 'neutral'}>{step.done ? 'Done' : 'Pending'}</Pill>
                  </li>
                ))}
              </ul>
              {!isClientView && (
                <div className="mt-3 flex items-center gap-2">
                  <input
                    value={newStepTitle}
                    onChange={(e) => setNewStepTitle(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddStep()}
                    placeholder="Add a step…"
                    className="flex-1 rounded-lg border border-black/[0.10] px-3 py-1.5 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                    autoComplete="off"
                    data-1p-ignore
                    data-lpignore="true"
                  />
                  <button
                    onClick={handleAddStep}
                    className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-500 text-white hover:bg-brand-600"
                    aria-label="Add step"
                  >
                    <Plus size={15} />
                  </button>
                </div>
              )}
            </div>
          </div>
        </Card>

        <Card title="Project">
          <dl className="flex flex-col gap-3.5 text-sm">
            <div>
              <dt className="text-xs text-ink-muted">Progress</dt>
              <dd className="mt-1 flex items-center gap-2">
                <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-surface-sunken">
                  <div className="h-full rounded-full bg-brand-500" style={{ width: `${progress.percent}%` }} />
                </div>
                <span className="text-xs font-medium tabular-nums text-ink-primary">{progress.percent}%</span>
              </dd>
            </div>
            <div>
              <dt className="text-xs text-ink-muted">Status</dt>
              <dd className="mt-1">
                <Pill tone={CLIENT_STATUS_TONE[client.status]}>{CLIENT_STATUS_LABEL[client.status]}</Pill>
              </dd>
            </div>
            <div>
              <dt className="text-xs text-ink-muted">Started</dt>
              <dd className="mt-1 text-ink-primary">{formatDate(client.startDate)}</dd>
            </div>
            <div>
              <dt className="text-xs text-ink-muted">Due</dt>
              <dd className="mt-1 text-ink-primary">{formatDate(client.dueDate)}</dd>
            </div>
            <div>
              <dt className="text-xs text-ink-muted">Owner</dt>
              <dd className="mt-1.5 flex items-center gap-2">
                <MemberAvatar memberId={client.owner} size={22} />
                <span className="text-ink-primary">{memberName(client.owner)}</span>
              </dd>
            </div>
          </dl>
        </Card>
      </div>

      <Card title="Timeline">
        <TimelineStrip client={client} />
      </Card>
    </div>
  )
}
