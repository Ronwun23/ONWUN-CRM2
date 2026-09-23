import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { format, parse } from 'date-fns'
import { useClientOutlet } from '@/lib/useClient'
import { useApp } from '@/context/AppContext'
import { FullScreenCalendar } from '@/components/ui/fullscreen-calendar'
import type { CalendarData, CalendarEvent } from '@/components/ui/fullscreen-calendar'
import { toDisplayDate, formatCivilDate } from '@/lib/civilDate'
import { confirmAction } from '@/lib/confirm'

function formatEventTime(time: string): string {
  return format(parse(time, 'HH:mm', new Date()), 'h:mm a')
}

// Unlike the studio-wide Calendar, clicking into a day here opens a
// dedicated page for that day's content (like clicking into a document),
// rather than a quick-add drawer — there's more to plan per day than a
// single title/time/notes trio.
export default function ClientContentCalendar() {
  const client = useClientOutlet()
  const { removeClientEvent } = useApp()
  const navigate = useNavigate()

  const calendarData = useMemo<CalendarData[]>(() => {
    const byDay = new Map<string, CalendarData>()
    for (const event of client.events) {
      const day = toDisplayDate(event.date)
      const key = format(day, 'yyyy-MM-dd')
      if (!byDay.has(key)) byDay.set(key, { day, events: [] })
      byDay.get(key)!.events.push({
        id: event.id,
        name: event.title,
        time: event.time ? formatEventTime(event.time) : undefined,
        notes: event.notes,
      })
    }
    for (const entry of byDay.values()) {
      entry.events.sort((a, b) => (a.time ?? '').localeCompare(b.time ?? '') || a.name.localeCompare(b.name))
    }
    return [...byDay.values()]
  }, [client.events])

  const goToDay = (day: Date) => {
    navigate(`/clients/${client.id}/content-calendar/${formatCivilDate(day)}`)
  }

  const handleRemoveEvent = async (event: CalendarEvent) => {
    const when = event.time ? ` at ${event.time}` : ''
    const confirmed = await confirmAction(`Remove "${event.name}"${when} from the calendar?`, {
      confirmLabel: 'Remove',
      destructive: true,
    })
    if (confirmed) removeClientEvent(client.id, event.id)
  }

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-xl font-semibold text-ink-primary">Content calendar</h1>
        <p className="text-sm text-ink-secondary">Scheduled posts and content for {client.name}</p>
      </div>

      <div className="flex h-[75vh] min-h-[560px] flex-col overflow-hidden rounded-xl border border-black/[0.06] bg-white shadow-card">
        <FullScreenCalendar
          data={calendarData}
          onDayClick={goToDay}
          onNewEvent={goToDay}
          onRemoveEvent={handleRemoveEvent}
          onOpenNotes={(event) => {
            const source = client.events.find((e) => e.id === event.id)
            if (source) goToDay(toDisplayDate(source.date))
          }}
        />
      </div>
    </div>
  )
}
