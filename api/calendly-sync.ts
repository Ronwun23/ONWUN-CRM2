import type { VercelRequest, VercelResponse } from '@vercel/node'
import { getCurrentUser, listScheduledEvents, calendlyEventId } from './_calendly/client.js'
import { supabaseAdmin } from './_mcp/supabaseAdmin.js'

// The studio's own local timezone — Calendly always returns UTC
// timestamps, so this is what turns "2026-10-01T14:00:00Z" into the
// correct local day and time rather than whatever timezone this function
// happens to run in.
const STUDIO_TIMEZONE = 'Europe/London'

function isoToCivil(iso: string): { date: string; time: string } {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: STUDIO_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(new Date(iso))
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? ''
  return { date: `${get('year')}-${get('month')}-${get('day')}`, time: `${get('hour')}:${get('minute')}` }
}

// Pulls every active Calendly booking in the next 60 days and upserts it
// into the shared `events` table as a studio-wide event (client_id null),
// keyed on calendly_uri so re-running this never creates duplicates.
// Triggered either by the "Sync now" button in Settings or the Vercel
// Cron job configured in vercel.json — neither carries a user session, so
// this intentionally isn't gated behind auth; it only ever reads from
// Calendly and writes calendar events, nothing sensitive.
export default async function calendlySync(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  if (req.method !== 'POST' && req.method !== 'GET') {
    res.status(405).json({ error: 'method_not_allowed' })
    return
  }

  try {
    const user = await getCurrentUser()
    const now = new Date()
    const horizon = new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000)
    const events = await listScheduledEvents(user.uri, now.toISOString(), horizon.toISOString())

    const supabase = supabaseAdmin()
    let synced = 0
    for (const event of events) {
      const { date, time } = isoToCivil(event.start_time)
      const { error } = await supabase.from('events').upsert(
        {
          client_id: null,
          title: event.name,
          date,
          time,
          calendly_uri: calendlyEventId(event.uri),
        },
        { onConflict: 'calendly_uri' }
      )
      if (error) throw error
      synced++
    }

    res.status(200).json({ synced, total: events.length })
  } catch (err) {
    console.error('calendly-sync error:', err)
    res.status(500).json({ error: 'sync_failed', message: err instanceof Error ? err.message : String(err) })
  }
}
