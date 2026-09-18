import type { WorkshopPhase, WorkshopState } from '@/types'
import { WORKSHOP_QUESTION_COUNT } from '@/data/workshopTemplate'

export type PhaseCompletionStatus = 'not_started' | 'in_progress' | 'complete'

function isAnswered(workshop: WorkshopState, questionId: string): boolean {
  return (workshop.answers[questionId] ?? '').trim().length > 0
}

export function answeredCount(workshop: WorkshopState): number {
  return Object.values(workshop.answers).filter((a) => a.trim().length > 0).length
}

export function discoveryPercent(workshop: WorkshopState): number {
  return Math.round((answeredCount(workshop) / WORKSHOP_QUESTION_COUNT) * 100)
}

export function phaseCompletionStatus(phase: WorkshopPhase, workshop: WorkshopState): PhaseCompletionStatus {
  const answered = phase.questions.filter((q) => isAnswered(workshop, q.id)).length
  if (answered === 0) return 'not_started'
  if (answered === phase.questions.length) return 'complete'
  return 'in_progress'
}

export const PHASE_STATUS_LABEL: Record<PhaseCompletionStatus, string> = {
  not_started: 'Not started',
  in_progress: 'In progress',
  complete: 'Complete',
}
