// Thin wrapper around Calendly's API v2. The access token is a Personal
// Access Token generated directly in a Calendly account (Integrations &
// apps -> API & Webhooks) — never exposed to the browser, read only here,
// server-side.
const CALENDLY_BASE = 'https://api.calendly.com'

function token(): string {
  const t = process.env.CALENDLY_ACCESS_TOKEN
  if (!t) throw new Error('Missing CALENDLY_ACCESS_TOKEN')
  return t
}

async function calendlyFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${CALENDLY_BASE}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token()}`,
      'Content-Type': 'application/json',
      ...init?.headers,
    },
  })
  if (!res.ok) {
    const body = await res.text().catch(() => '')
    throw new Error(`Calendly API ${res.status} on ${path}: ${body}`)
  }
  return res.json() as Promise<T>
}

export interface CalendlyUser {
  uri: string
  name: string
  current_organization: string
}

export async function getCurrentUser(): Promise<CalendlyUser> {
  const { resource } = await calendlyFetch<{ resource: CalendlyUser }>('/users/me')
  return resource
}

export interface CalendlyScheduledEvent {
  uri: string
  name: string
  status: 'active' | 'canceled'
  start_time: string
  end_time: string
  location?: { type?: string; location?: string; join_url?: string } | null
}

// Calendly paginates with a `next_page` cursor URL rather than page
// numbers — following it until it's null is the documented way to get
// every event in the window.
export async function listScheduledEvents(userUri: string, minStartTime: string, maxStartTime: string): Promise<CalendlyScheduledEvent[]> {
  const events: CalendlyScheduledEvent[] = []
  let path: string | null =
    `/scheduled_events?user=${encodeURIComponent(userUri)}&status=active&sort=start_time:asc` +
    `&min_start_time=${encodeURIComponent(minStartTime)}&max_start_time=${encodeURIComponent(maxStartTime)}&count=100`

  while (path) {
    const data: { collection: CalendlyScheduledEvent[]; pagination: { next_page: string | null } } = await calendlyFetch(path)
    events.push(...data.collection)
    path = data.pagination.next_page ? data.pagination.next_page.replace(CALENDLY_BASE, '') : null
  }
  return events
}

// The event's URI ends in its UUID — used as the stable id we de-dupe on
// when syncing into our own `events` table.
export function calendlyEventId(uri: string): string {
  return uri.split('/').pop() ?? uri
}
