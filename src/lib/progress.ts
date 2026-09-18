import type { Client, PhaseKey, ProjectPhase } from '@/types'
import { PHASES } from '@/types'

export type PhaseStatus = 'done' | 'in_progress' | 'not_started'

export function phaseStatus(phase: ProjectPhase): PhaseStatus {
  const total = phase.steps.length
  const done = phase.steps.filter((s) => s.done).length
  if (total > 0 && done === total) return 'done'
  if (done === 0) return 'not_started'
  return 'in_progress'
}

export function currentPhaseKey(client: Client): PhaseKey {
  const inProgress = client.phases.find((p) => phaseStatus(p) === 'in_progress')
  if (inProgress) return inProgress.key
  const nextNotStarted = client.phases.find((p) => phaseStatus(p) === 'not_started')
  if (nextNotStarted) return nextNotStarted.key
  return PHASES[PHASES.length - 1]
}

export function overallProgress(client: Client): { doneSteps: number; totalSteps: number; percent: number } {
  const allSteps = client.phases.flatMap((p) => p.steps)
  const doneSteps = allSteps.filter((s) => s.done).length
  const totalSteps = allSteps.length
  return { doneSteps, totalSteps, percent: totalSteps === 0 ? 0 : Math.round((doneSteps / totalSteps) * 100) }
}
