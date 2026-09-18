import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ChevronLeft, ChevronRight, X } from 'lucide-react'
import { useClientOutlet } from '@/lib/useClient'
import { useApp } from '@/context/AppContext'
import { WORKSHOP_PHASES } from '@/data/workshopTemplate'
import type { WorkshopScreen } from '@/types'

const LAST_PHASE_INDEX = WORKSHOP_PHASES.length - 1
const LAST_QUESTION_INDEX = 3

export default function DiscoverySession() {
  const client = useClientOutlet()
  const { saveWorkshopAnswer, setWorkshopPosition, completeWorkshop, startWorkshop } = useApp()
  const navigate = useNavigate()
  const { workshop } = client

  useEffect(() => {
    if (!workshop.started) startWorkshop(client.id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const phaseIndex = workshop.currentPhaseIndex
  const screen: WorkshopScreen = workshop.currentScreen
  const questionIndex = workshop.currentQuestionIndex
  const phase = WORKSHOP_PHASES[phaseIndex]
  const question = phase?.questions[questionIndex]

  const [draft, setDraft] = useState(question ? (workshop.answers[question.id] ?? '') : '')
  const commitRef = useRef(draft)
  commitRef.current = draft

  useEffect(() => {
    setDraft(question ? (workshop.answers[question.id] ?? '') : '')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phaseIndex, screen, questionIndex])

  // Autosave shortly after the client stops typing.
  useEffect(() => {
    if (screen !== 'question' || !question) return
    const handle = setTimeout(() => {
      saveWorkshopAnswer(client.id, question.id, draft)
    }, 400)
    return () => clearTimeout(handle)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draft])

  const commit = () => {
    if (screen === 'question' && question) {
      saveWorkshopAnswer(client.id, question.id, commitRef.current)
    }
  }

  const goToDashboard = () => navigate(`/clients/${client.id}/discovery`)

  const goNext = () => {
    commit()
    if (screen === 'intro') {
      setWorkshopPosition(client.id, phaseIndex, 'question', 0)
      return
    }
    if (questionIndex < LAST_QUESTION_INDEX) {
      setWorkshopPosition(client.id, phaseIndex, 'question', questionIndex + 1)
      return
    }
    if (phaseIndex < LAST_PHASE_INDEX) {
      setWorkshopPosition(client.id, phaseIndex + 1, 'intro', 0)
      return
    }
    completeWorkshop(client.id)
    goToDashboard()
  }

  const goPrev = () => {
    commit()
    if (screen === 'question') {
      if (questionIndex > 0) {
        setWorkshopPosition(client.id, phaseIndex, 'question', questionIndex - 1)
      } else {
        setWorkshopPosition(client.id, phaseIndex, 'intro', 0)
      }
      return
    }
    if (phaseIndex > 0) {
      setWorkshopPosition(client.id, phaseIndex - 1, 'question', LAST_QUESTION_INDEX)
    } else {
      goToDashboard()
    }
  }

  if (!phase) return null

  const isFinalQuestion = screen === 'question' && phaseIndex === LAST_PHASE_INDEX && questionIndex === LAST_QUESTION_INDEX

  return (
    <div className="flex min-h-screen flex-col px-4 sm:px-8">
      <div className="flex items-center justify-between py-5">
        <p className="text-xs font-medium text-ink-muted">{client.name}</p>
        <Link
          to={`/clients/${client.id}/discovery`}
          onClick={commit}
          className="flex items-center gap-1 text-xs font-medium text-ink-muted hover:text-ink-secondary"
        >
          <X size={13} />
          Exit
        </Link>
      </div>
      <div className="flex flex-1 flex-col items-center justify-center py-10 text-center">
        {screen === 'intro' ? (
          <div className="flex max-w-lg flex-col items-center gap-4">
            <p className="text-xs font-medium uppercase tracking-wide text-ink-muted">
              Phase {phaseIndex + 1} of {WORKSHOP_PHASES.length}
            </p>
            <h1 className="text-3xl font-semibold text-ink-primary">{phase.introHeading}</h1>
            <p className="max-w-md text-base leading-relaxed text-ink-secondary">{phase.introBody}</p>
          </div>
        ) : (
          <div className="flex w-full max-w-xl flex-col items-center gap-6">
            <p className="text-xs font-medium uppercase tracking-wide text-ink-muted">
              Phase {phaseIndex + 1} · {phase.title}
            </p>
            <h1 className="max-w-lg text-2xl font-semibold leading-snug text-ink-primary sm:text-3xl">
              {question?.text}
            </h1>
            <textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onBlur={commit}
              rows={6}
              autoFocus
              placeholder="Leave a note"
              className="w-full resize-none rounded-xl border border-black/[0.10] bg-white px-4 py-3.5 text-base leading-relaxed text-ink-primary placeholder:text-ink-muted focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
            />
          </div>
        )}
      </div>

      <div className="flex items-center justify-between pb-6 pt-2">
        <button
          onClick={goPrev}
          className="flex items-center gap-1 rounded-lg px-3.5 py-2 text-sm font-medium text-ink-secondary hover:bg-surface-sunken"
        >
          <ChevronLeft size={15} />
          Back
        </button>
        <button
          onClick={goNext}
          className="flex items-center gap-1.5 rounded-lg bg-brand-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-600"
        >
          {screen === 'intro' ? "Let's go" : isFinalQuestion ? 'Finish' : 'Next'}
          {screen !== 'intro' && !isFinalQuestion && <ChevronRight size={15} />}
        </button>
      </div>
    </div>
  )
}
