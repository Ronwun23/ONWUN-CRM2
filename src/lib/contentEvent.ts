import { CONTENT_EVENT_TYPE_LABEL, REEL_DURATION_LABEL } from '@/lib/labels'
import type { ContentEventType, ReelDuration } from '@/types'

// A content-calendar task has no free-typed title — its display name is
// always derived from what was actually picked (type, plus duration for a
// reel or a post count for everything else), so the calendar and day view
// never show a name that drifts from the task's real details.
export function eventDisplayTitle(contentType: ContentEventType, duration: ReelDuration | '', amount: string): string {
  const label = CONTENT_EVENT_TYPE_LABEL[contentType]
  if (contentType === 'reel') return duration ? `${label} — ${REEL_DURATION_LABEL[duration]}` : label
  return amount ? `${label} — ${amount} post${amount === '1' ? '' : 's'}` : label
}
