import { useEffect, useState } from 'react'
import { Check, ChevronLeft, ChevronRight, Sparkles } from 'lucide-react'
import clsx from 'clsx'
import { useClientOutlet } from '@/lib/useClient'
import { useApp } from '@/context/AppContext'
import Card from '@/components/Card'
import { FLAT_WORKSHOP_QUESTIONS, WORKSHOP_QUESTION_COUNT, WORKSHOP_SECTIONS } from '@/data/workshopTemplate'

export default function ClientDiscovery() {
  const client = useClientOutlet()
  const { startWorkshop, saveWorkshopAnswer, setWorkshopPosition } = useApp()
  const { workshop } = client

  const current = FLAT_WORKSHOP_QUESTIONS.find(
    (q) => q.sectionIndex === workshop.currentSectionIndex && q.questionIndex === workshop.currentQuestionIndex
  )!

  const savedAnswer = workshop.answers[current.question.id]
  const [answerDraft, setAnswerDraft] = useState(savedAnswer?.answer ?? '')
  const [noteDraft, setNoteDraft] = useState(savedAnswer?.note ?? '')

  useEffect(() => {
    setAnswerDraft(savedAnswer?.answer ?? '')
    setNoteDraft(savedAnswer?.note ?? '')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current.question.id])

  const commit = () => {
    saveWorkshopAnswer(client.id, current.question.id, answerDraft, noteDraft)
  }

  const goTo = (sectionIndex: number, questionIndex: number) => {
    commit()
    setWorkshopPosition(client.id, sectionIndex, questionIndex)
  }

  const isFirst = current.overallIndex === 0
  const isLast = current.overallIndex === WORKSHOP_QUESTION_COUNT - 1

  const goNext = () => {
    if (isLast) return
    const next = FLAT_WORKSHOP_QUESTIONS[current.overallIndex + 1]
    goTo(next.sectionIndex, next.questionIndex)
  }

  const goPrev = () => {
    if (isFirst) return
    const prev = FLAT_WORKSHOP_QUESTIONS[current.overallIndex - 1]
    goTo(prev.sectionIndex, prev.questionIndex)
  }

  const answeredCount = Object.values(workshop.answers).filter((a) => a.answer.trim().length > 0).length

  if (!workshop.started) {
    return (
      <div className="mx-auto flex max-w-lg flex-col items-center gap-4 py-16 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
          <Sparkles size={22} />
        </div>
        <h1 className="text-xl font-semibold text-ink-primary">Discovery & Strategy workshop</h1>
        <p className="text-sm text-ink-secondary">
          A step-by-step workshop to run live with {client.name} — {WORKSHOP_SECTIONS.length} sections,{' '}
          {WORKSHOP_QUESTION_COUNT} questions. Capture their answers as you go, plus your own private notes
          alongside each one.
        </p>
        <button
          onClick={() => {
            startWorkshop(client.id)
            setWorkshopPosition(client.id, 0, 0)
          }}
          className="mt-2 rounded-lg bg-brand-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-600"
        >
          Start workshop
        </button>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-xl font-semibold text-ink-primary">Discovery & Strategy workshop</h1>
        <p className="text-sm text-ink-secondary">
          Question {current.overallIndex + 1} of {WORKSHOP_QUESTION_COUNT} · {answeredCount} answered
        </p>
      </div>

      <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface-sunken">
        <div
          className="h-full rounded-full bg-brand-500 transition-all"
          style={{ width: `${((current.overallIndex + 1) / WORKSHOP_QUESTION_COUNT) * 100}%` }}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[220px_1fr]">
        <Card title="Sections" padded={false}>
          <ul className="flex flex-col p-2">
            {WORKSHOP_SECTIONS.map((section, sectionIndex) => {
              const sectionAnswered = section.questions.every((q) => (workshop.answers[q.id]?.answer ?? '').trim().length > 0)
              const isActiveSection = sectionIndex === current.sectionIndex
              return (
                <li key={section.id}>
                  <button
                    onClick={() => goTo(sectionIndex, 0)}
                    className={clsx(
                      'flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-sm transition-colors',
                      isActiveSection ? 'bg-brand-50 text-brand-700 font-medium' : 'text-ink-secondary hover:bg-surface-sunken'
                    )}
                  >
                    <span
                      className={clsx(
                        'flex h-4 w-4 shrink-0 items-center justify-center rounded-full',
                        sectionAnswered ? 'bg-brand-500 text-white' : 'border border-black/15'
                      )}
                    >
                      {sectionAnswered && <Check size={10} strokeWidth={3} />}
                    </span>
                    <span className="truncate">{section.title}</span>
                  </button>
                </li>
              )
            })}
          </ul>
        </Card>

        <Card>
          <p className="text-xs font-medium uppercase tracking-wide text-brand-600">{current.sectionTitle}</p>
          <h2 className="mt-1.5 text-lg font-semibold text-ink-primary">{current.question.text}</h2>
          {current.question.helperText && <p className="mt-1 text-sm text-ink-muted">{current.question.helperText}</p>}

          <div className="mt-4">
            <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-ink-muted">
              Client's answer
            </label>
            <textarea
              value={answerDraft}
              onChange={(e) => setAnswerDraft(e.target.value)}
              onBlur={commit}
              rows={4}
              placeholder="Capture their answer as they talk…"
              className="w-full resize-none rounded-lg border border-black/[0.10] px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
            />
          </div>

          <div className="mt-3">
            <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-ink-muted">
              Your private note
            </label>
            <textarea
              value={noteDraft}
              onChange={(e) => setNoteDraft(e.target.value)}
              onBlur={commit}
              rows={2}
              placeholder="Anything you want to remember for the brief…"
              className="w-full resize-none rounded-lg border border-black/[0.10] bg-surface-sunken/40 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
            />
          </div>

          <div className="mt-5 flex items-center justify-between">
            <button
              onClick={goPrev}
              disabled={isFirst}
              className="flex items-center gap-1 rounded-lg border border-black/[0.10] px-3.5 py-2 text-sm font-medium text-ink-secondary hover:bg-surface-sunken disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ChevronLeft size={15} />
              Previous
            </button>
            {isLast ? (
              <button
                onClick={commit}
                className="flex items-center gap-1.5 rounded-lg bg-brand-500 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-600"
              >
                <Check size={15} />
                Finish
              </button>
            ) : (
              <button
                onClick={goNext}
                className="flex items-center gap-1 rounded-lg bg-brand-500 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-600"
              >
                Next
                <ChevronRight size={15} />
              </button>
            )}
          </div>
        </Card>
      </div>
    </div>
  )
}
