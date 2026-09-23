import { useEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { RefreshCw } from 'lucide-react'
import clsx from 'clsx'
import { useClientOutlet } from '@/lib/useClient'
import { useApp } from '@/context/AppContext'
import { formatDate } from '@/lib/format'
import { confirmAction } from '@/lib/confirm'
import type { StrategyDraft, StrategyStatus } from '@/types'

const STATUS_STEPS: { key: StrategyStatus; label: string }[] = [
  { key: 'ai_draft', label: 'AI draft' },
  { key: 'agency_reviewed', label: 'Agency reviewed' },
  { key: 'approved', label: 'Approved' },
]

function SectionHeading({ index, title }: { index: string; title: string }) {
  return (
    <h2 className="text-sm font-semibold uppercase tracking-wide text-ink-muted">
      {index} — {title}
    </h2>
  )
}

function EditableTextarea({
  value,
  onChange,
  onBlur,
  rows = 3,
  label,
}: {
  value: string
  onChange: (v: string) => void
  onBlur: () => void
  rows?: number
  label?: string
}) {
  return (
    <div>
      {label && <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-ink-muted">{label}</label>}
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onBlur}
        rows={rows}
        className="w-full resize-none rounded-lg border border-black/[0.10] bg-white px-3.5 py-3 text-sm leading-relaxed text-ink-primary focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
      />
    </div>
  )
}

function EditableInput({
  value,
  onChange,
  onBlur,
  label,
  className,
}: {
  value: string
  onChange: (v: string) => void
  onBlur: () => void
  label?: string
  className?: string
}) {
  return (
    <div className={className}>
      {label && <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-ink-muted">{label}</label>}
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onBlur}
        className="w-full rounded-lg border border-black/[0.10] bg-white px-3.5 py-2 text-sm font-medium text-ink-primary focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
        autoComplete="off"
        data-1p-ignore
        data-lpignore="true"
      />
    </div>
  )
}

function Card({ children }: { children: ReactNode }) {
  return <div className="rounded-2xl border border-black/[0.06] bg-white p-6">{children}</div>
}

export default function DiscoveryStrategy() {
  const client = useClientOutlet()
  const { generateStrategy, updateStrategy, setStrategyStatus } = useApp()
  const { workshop } = client

  const [draft, setDraft] = useState<StrategyDraft | null>(workshop.strategy)
  const draftRef = useRef(draft)
  draftRef.current = draft

  useEffect(() => setDraft(workshop.strategy), [workshop.strategy])

  const commit = () => {
    if (draftRef.current) updateStrategy(client.id, () => draftRef.current as StrategyDraft)
  }

  const patch = (fn: (d: StrategyDraft) => StrategyDraft) => {
    setDraft((prev) => (prev ? fn(prev) : prev))
  }

  const handleRegenerate = async () => {
    if (!(await confirmAction('Regenerating will replace the current AI draft. Continue?', { confirmLabel: 'Continue' })))
      return
    generateStrategy(client.id)
  }

  if (!workshop.strategy || !draft) {
    return (
      <div className="rounded-2xl border border-black/[0.06] bg-white px-6 py-10 text-center">
        <p className="text-sm text-ink-secondary">
          Your draft strategy will appear here once the discovery workshop has been completed.
        </p>
      </div>
    )
  }

  const currentStepIndex = STATUS_STEPS.findIndex((s) => s.key === draft.status)

  return (
    <div className="flex flex-col gap-8 pb-10">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-black/[0.06] bg-white px-5 py-4">
        <div className="flex items-center gap-2">
          {STATUS_STEPS.map((step, i) => (
            <div key={step.key} className="flex items-center gap-2">
              <span
                className={clsx(
                  'rounded-full px-2.5 py-1 text-xs font-medium',
                  i === currentStepIndex
                    ? 'bg-brand-500 text-white'
                    : i < currentStepIndex
                      ? 'bg-brand-50 text-brand-700'
                      : 'bg-surface-sunken text-ink-muted'
                )}
              >
                {step.label}
              </span>
              {i < STATUS_STEPS.length - 1 && <span className="text-ink-muted">→</span>}
            </div>
          ))}
          <span className="ml-2 text-xs text-ink-muted">Updated {formatDate(draft.generatedAt)}</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleRegenerate}
            className="flex items-center gap-1.5 rounded-lg border border-black/[0.10] px-3 py-1.5 text-xs font-medium text-ink-secondary hover:bg-surface-sunken"
          >
            <RefreshCw size={12} />
            Regenerate draft
          </button>
          {draft.status !== 'approved' && (
            <button
              onClick={() => setStrategyStatus(client.id, 'approved')}
              className="rounded-lg bg-brand-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-brand-600"
            >
              Approve strategy
            </button>
          )}
        </div>
      </div>

      <Card>
        <SectionHeading index="01" title="Origin story" />
        <div className="mt-3">
          <EditableTextarea
            value={draft.originStory}
            onChange={(v) => patch((d) => ({ ...d, originStory: v }))}
            onBlur={commit}
            rows={4}
          />
        </div>
      </Card>

      <Card>
        <SectionHeading index="02" title="The problem" />
        <div className="mt-3">
          <EditableTextarea
            value={draft.problem}
            onChange={(v) => patch((d) => ({ ...d, problem: v }))}
            onBlur={commit}
            rows={3}
          />
        </div>
      </Card>

      <Card>
        <SectionHeading index="03" title="Our solution" />
        <div className="mt-3">
          <EditableTextarea
            value={draft.solution}
            onChange={(v) => patch((d) => ({ ...d, solution: v }))}
            onBlur={commit}
            rows={3}
          />
        </div>
      </Card>

      <Card>
        <SectionHeading index="04" title="Our mission" />
        <div className="mt-3">
          <EditableTextarea
            value={draft.mission}
            onChange={(v) => patch((d) => ({ ...d, mission: v }))}
            onBlur={commit}
            rows={2}
          />
        </div>
      </Card>

      <Card>
        <SectionHeading index="05" title="Our vision" />
        <div className="mt-3">
          <EditableTextarea
            value={draft.vision}
            onChange={(v) => patch((d) => ({ ...d, vision: v }))}
            onBlur={commit}
            rows={2}
          />
        </div>
      </Card>

      <Card>
        <SectionHeading index="06" title="Brand values" />
        <div className="mt-4 flex flex-col gap-5">
          {draft.values.map((value, i) => (
            <div key={i} className="flex flex-col gap-2 border-t border-black/[0.06] pt-4 first:border-t-0 first:pt-0">
              <p className="text-xs font-medium tabular-nums text-ink-muted">{String(i + 1).padStart(2, '0')}</p>
              <EditableInput
                value={value.name}
                onChange={(v) =>
                  patch((d) => ({ ...d, values: d.values.map((val, vi) => (vi === i ? { ...val, name: v } : val)) }))
                }
                onBlur={commit}
              />
              <EditableTextarea
                value={value.description}
                onChange={(v) =>
                  patch((d) => ({
                    ...d,
                    values: d.values.map((val, vi) => (vi === i ? { ...val, description: v } : val)),
                  }))
                }
                onBlur={commit}
                rows={2}
              />
            </div>
          ))}
        </div>
      </Card>

      <Card>
        <SectionHeading index="07" title="Tone of voice" />
        <div className="mt-4 flex flex-col gap-5">
          {draft.toneOfVoice.map((tone, i) => (
            <div key={i} className="flex flex-col gap-2 border-t border-black/[0.06] pt-4 first:border-t-0 first:pt-0">
              <p className="text-xs font-medium tabular-nums text-ink-muted">{String(i + 1).padStart(2, '0')}</p>
              <EditableInput
                value={tone.tone}
                onChange={(v) =>
                  patch((d) => ({
                    ...d,
                    toneOfVoice: d.toneOfVoice.map((t, ti) => (ti === i ? { ...t, tone: v } : t)),
                  }))
                }
                onBlur={commit}
              />
              <EditableTextarea
                value={tone.description}
                onChange={(v) =>
                  patch((d) => ({
                    ...d,
                    toneOfVoice: d.toneOfVoice.map((t, ti) => (ti === i ? { ...t, description: v } : t)),
                  }))
                }
                onBlur={commit}
                rows={2}
              />
              <EditableTextarea
                label="Example"
                value={tone.example}
                onChange={(v) =>
                  patch((d) => ({
                    ...d,
                    toneOfVoice: d.toneOfVoice.map((t, ti) => (ti === i ? { ...t, example: v } : t)),
                  }))
                }
                onBlur={commit}
                rows={2}
              />
            </div>
          ))}
        </div>
      </Card>

      <Card>
        <SectionHeading index="08" title="Competitor analysis" />
        <div className="mt-4 flex flex-col gap-5">
          {draft.competitors.map((c, i) => (
            <div key={i} className="flex flex-col gap-2 border-t border-black/[0.06] pt-4 first:border-t-0 first:pt-0">
              <p className="text-xs font-medium text-ink-muted">Competitor {i + 1}</p>
              <EditableInput
                value={c.name}
                onChange={(v) =>
                  patch((d) => ({
                    ...d,
                    competitors: d.competitors.map((comp, ci) => (ci === i ? { ...comp, name: v } : comp)),
                  }))
                }
                onBlur={commit}
              />
              <EditableTextarea
                label="What they do"
                value={c.whatTheyDo}
                onChange={(v) =>
                  patch((d) => ({
                    ...d,
                    competitors: d.competitors.map((comp, ci) => (ci === i ? { ...comp, whatTheyDo: v } : comp)),
                  }))
                }
                onBlur={commit}
                rows={2}
              />
              <EditableTextarea
                label="Positioning"
                value={c.positioning}
                onChange={(v) =>
                  patch((d) => ({
                    ...d,
                    competitors: d.competitors.map((comp, ci) => (ci === i ? { ...comp, positioning: v } : comp)),
                  }))
                }
                onBlur={commit}
                rows={2}
              />
              <EditableTextarea
                label="Strengths"
                value={c.strengths}
                onChange={(v) =>
                  patch((d) => ({
                    ...d,
                    competitors: d.competitors.map((comp, ci) => (ci === i ? { ...comp, strengths: v } : comp)),
                  }))
                }
                onBlur={commit}
                rows={2}
              />
              <EditableTextarea
                label="Observations"
                value={c.observations}
                onChange={(v) =>
                  patch((d) => ({
                    ...d,
                    competitors: d.competitors.map((comp, ci) => (ci === i ? { ...comp, observations: v } : comp)),
                  }))
                }
                onBlur={commit}
                rows={2}
              />
            </div>
          ))}
        </div>
      </Card>

      <Card>
        <SectionHeading index="09" title="Brand positioning" />
        <div className="mt-4 flex flex-col gap-4">
          <EditableTextarea
            label="Our positioning"
            value={draft.ourPositioning}
            onChange={(v) => patch((d) => ({ ...d, ourPositioning: v }))}
            onBlur={commit}
            rows={3}
          />
          <EditableTextarea
            label="Market positioning"
            value={draft.marketPositioning}
            onChange={(v) => patch((d) => ({ ...d, marketPositioning: v }))}
            onBlur={commit}
            rows={3}
          />
        </div>
      </Card>

      <Card>
        <SectionHeading index="10" title="Audience persona" />
        <div className="mt-4 flex flex-col gap-4">
          <EditableInput
            label="Name / archetype"
            value={draft.audiencePersona.name}
            onChange={(v) => patch((d) => ({ ...d, audiencePersona: { ...d.audiencePersona, name: v } }))}
            onBlur={commit}
          />
          <EditableTextarea
            label="Who they are"
            value={draft.audiencePersona.whoTheyAre}
            onChange={(v) => patch((d) => ({ ...d, audiencePersona: { ...d.audiencePersona, whoTheyAre: v } }))}
            onBlur={commit}
            rows={2}
          />
          <EditableTextarea
            label="Demographics / context"
            value={draft.audiencePersona.demographics}
            onChange={(v) => patch((d) => ({ ...d, audiencePersona: { ...d.audiencePersona, demographics: v } }))}
            onBlur={commit}
            rows={2}
          />
          <EditableTextarea
            label="Goals"
            value={draft.audiencePersona.goals}
            onChange={(v) => patch((d) => ({ ...d, audiencePersona: { ...d.audiencePersona, goals: v } }))}
            onBlur={commit}
            rows={2}
          />
          <EditableTextarea
            label="Challenges"
            value={draft.audiencePersona.challenges}
            onChange={(v) => patch((d) => ({ ...d, audiencePersona: { ...d.audiencePersona, challenges: v } }))}
            onBlur={commit}
            rows={2}
          />
          <EditableTextarea
            label="Pain points"
            value={draft.audiencePersona.painPoints}
            onChange={(v) => patch((d) => ({ ...d, audiencePersona: { ...d.audiencePersona, painPoints: v } }))}
            onBlur={commit}
            rows={2}
          />
          <EditableTextarea
            label="Motivations"
            value={draft.audiencePersona.motivations}
            onChange={(v) => patch((d) => ({ ...d, audiencePersona: { ...d.audiencePersona, motivations: v } }))}
            onBlur={commit}
            rows={2}
          />
          <EditableTextarea
            label="What they value"
            value={draft.audiencePersona.values}
            onChange={(v) => patch((d) => ({ ...d, audiencePersona: { ...d.audiencePersona, values: v } }))}
            onBlur={commit}
            rows={2}
          />
          <EditableTextarea
            label="What they're looking for"
            value={draft.audiencePersona.lookingFor}
            onChange={(v) => patch((d) => ({ ...d, audiencePersona: { ...d.audiencePersona, lookingFor: v } }))}
            onBlur={commit}
            rows={2}
          />
          <EditableTextarea
            label="Why they'd choose this brand"
            value={draft.audiencePersona.whyThisBrand}
            onChange={(v) => patch((d) => ({ ...d, audiencePersona: { ...d.audiencePersona, whyThisBrand: v } }))}
            onBlur={commit}
            rows={2}
          />
        </div>
      </Card>
    </div>
  )
}
