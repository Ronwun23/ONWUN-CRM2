// Pure logic for the outreach follow-up sequence and outcome state
// machine — no Supabase calls here, so this same module could back both
// the browser (AppContext) and, if ever needed, a server-side tool
// without duplicating the rules in two places.
import { formatCivilDate } from '@/lib/civilDate'
import type { LeadStatus, SequenceStepType } from '@/types'

export const SEQUENCE_STEP_ORDER: SequenceStepType[] = ['email_1', 'call_1', 'email_2', 'call_2', 'call_3', 'email_3']

export const SEQUENCE_STEP_LABEL: Record<SequenceStepType, string> = {
  email_1: 'Send email 1',
  call_1: 'Make call 1',
  email_2: 'Send email 2',
  call_2: 'Make call 2',
  call_3: 'Make call 3',
  email_3: 'Send email 3',
}

// Days after the previous step each one falls due, once the sequence
// starts (anchored to whenever "Done, sent it" actually gets clicked for
// email 1, not necessarily the day the lead was added).
const STEP_GAP_DAYS: Record<SequenceStepType, number> = {
  email_1: 0,
  call_1: 2,
  email_2: 2,
  call_2: 2,
  call_3: 2,
  email_3: 5,
}

export interface SequenceStepPlan {
  stepType: SequenceStepType
  dueDate: string
  orderIndex: number
}

function addDays(date: Date, days: number): Date {
  const d = new Date(date)
  d.setDate(d.getDate() + days)
  return d
}

export function buildSequence(startDate: Date): SequenceStepPlan[] {
  let cursor = new Date(startDate)
  return SEQUENCE_STEP_ORDER.map((stepType, orderIndex) => {
    cursor = addDays(cursor, STEP_GAP_DAYS[stepType])
    return { stepType, dueDate: formatCivilDate(cursor), orderIndex }
  })
}

/** 90 days out from today, as a civil date — how long a "not now" lead
 * stays parked before it's due to resurface in the queue. */
export function notNowResurfaceDate(): string {
  return formatCivilDate(addDays(new Date(), 90))
}

export const LEAD_STATUS_LABEL: Record<LeadStatus, string> = {
  new: 'New, not contacted',
  contacted: 'Contacted',
  wants_video: 'Wants the video',
  video_sent: 'Video sent',
  call_booked: 'Call booked',
  live_conversation: 'Live conversation',
  not_now: 'Not now',
  suppressed: 'Removed — never contact',
  converted: 'Converted to client',
}

/** The one contextual "next step if they said yes" button — null once
 * there's nowhere further to escalate to (already booked, or the lead
 * isn't live any more). "Not now" / "Remove me" are offered separately,
 * always, as long as the lead is still live — see isLive(). */
export function nextEscalation(status: LeadStatus): { outcome: LeadStatus; label: string } | null {
  switch (status) {
    case 'new':
    case 'contacted':
    case 'live_conversation':
      return { outcome: 'wants_video', label: 'Wants the video' }
    case 'wants_video':
      return { outcome: 'video_sent', label: 'Video sent' }
    case 'video_sent':
      return { outcome: 'call_booked', label: 'Call booked' }
    default:
      return null
  }
}

export function canAskAQuestion(status: LeadStatus): boolean {
  return status === 'new' || status === 'contacted'
}

export function isLive(status: LeadStatus): boolean {
  return status !== 'suppressed' && status !== 'converted'
}

export function canConvertToClient(status: LeadStatus): boolean {
  return status === 'call_booked'
}
