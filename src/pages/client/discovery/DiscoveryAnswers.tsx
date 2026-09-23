import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowRight, Sparkles } from 'lucide-react'
import { useClientOutlet } from '@/lib/useClient'
import { useApp } from '@/context/AppContext'
import { useViewMode } from '@/context/ViewModeContext'
import { confirmAction } from '@/lib/confirm'
import { WORKSHOP_PHASES } from '@/data/workshopTemplate'

export default function DiscoveryAnswers() {
  const client = useClientOutlet()
  const { setWorkshopPosition, saveTranscript, generateStrategy } = useApp()
  const { isClientView } = useViewMode()
  const navigate = useNavigate()
  const { workshop } = client

  const [transcript, setTranscript] = useState(workshop.transcript)
  useEffect(() => setTranscript(workshop.transcript), [workshop.transcript])

  const editQuestion = (phaseIndex: number, questionIndex: number) => {
    setWorkshopPosition(client.id, phaseIndex, 'question', questionIndex)
    navigate(`/clients/${client.id}/discovery/session`)
  }

  const hasAnyAnswers = Object.values(workshop.answers).some((a) => a.trim().length > 0)

  const handleGenerate = async () => {
    const proceed = workshop.strategy
      ? await confirmAction('Regenerating will replace the current AI draft. Continue?', { confirmLabel: 'Continue' })
      : true
    if (!proceed) return
    saveTranscript(client.id, transcript)
    generateStrategy(client.id)
    navigate(`/clients/${client.id}/discovery/strategy`)
  }

  if (!hasAnyAnswers) {
    return (
      <div className="rounded-2xl border border-black/[0.06] bg-white px-6 py-10 text-center">
        <p className="text-sm text-ink-secondary">
          Your answers will appear here as you work through the discovery workshop.
        </p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-10 pb-8">
      <div className="flex flex-col gap-8">
        {WORKSHOP_PHASES.map((phase, phaseIndex) => (
          <div key={phase.id}>
            <p className="mb-3 text-xs font-medium uppercase tracking-wide text-ink-muted">
              Phase {String(phaseIndex + 1).padStart(2, '0')} · {phase.title}
            </p>
            <div className="flex flex-col divide-y divide-black/[0.06] rounded-2xl border border-black/[0.06] bg-white">
              {phase.questions.map((question, questionIndex) => {
                const answer = workshop.answers[question.id]?.trim()
                return (
                  <div key={question.id} className="flex items-start justify-between gap-4 px-5 py-4">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-ink-primary">{question.text}</p>
                      {answer ? (
                        <p className="mt-1.5 whitespace-pre-wrap text-sm leading-relaxed text-ink-secondary">{answer}</p>
                      ) : (
                        <p className="mt-1.5 text-sm italic text-ink-muted">Not answered</p>
                      )}
                    </div>
                    <button
                      onClick={() => editQuestion(phaseIndex, questionIndex)}
                      className="mt-0.5 flex shrink-0 items-center gap-1 text-xs font-medium text-brand-600 hover:text-brand-700"
                    >
                      Edit
                      <ArrowRight size={12} />
                    </button>
                  </div>
                )
              })}
            </div>
          </div>
        ))}
      </div>

      {!isClientView && (
        <div className="rounded-2xl border border-black/[0.06] bg-white px-6 py-6">
          <div className="flex items-center gap-2">
            <Sparkles size={16} className="text-brand-600" />
            <p className="text-sm font-semibold text-ink-primary">Generate strategy draft</p>
          </div>
          <p className="mt-1.5 max-w-lg text-sm text-ink-secondary">
            Use the workshop answers and optional meeting notes to generate a first draft of the brand strategy.
          </p>

          <label className="mb-1.5 mt-4 block text-xs font-medium uppercase tracking-wide text-ink-muted">
            Paste Google Meet transcript
          </label>
          <textarea
            value={transcript}
            onChange={(e) => setTranscript(e.target.value)}
            onBlur={() => saveTranscript(client.id, transcript)}
            rows={6}
            placeholder="Paste your meeting transcript here…"
            className="w-full resize-none rounded-lg border border-black/[0.10] px-3.5 py-3 text-sm leading-relaxed focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
          />

          {!workshop.completed && (
            <p className="mt-3 text-xs text-ink-muted">Complete the workshop to generate a strategy draft.</p>
          )}

          <button
            onClick={handleGenerate}
            disabled={!workshop.completed}
            className="mt-4 flex items-center gap-1.5 rounded-lg bg-brand-500 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Generate strategy
            <ArrowRight size={15} />
          </button>
        </div>
      )}
    </div>
  )
}
