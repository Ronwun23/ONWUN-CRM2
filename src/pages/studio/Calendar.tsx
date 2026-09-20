import { useMemo, useState } from 'react'
import { format, parse } from 'date-fns'
import { useApp } from '@/context/AppContext'
import Drawer from '@/components/Drawer'
import { FullScreenCalendar } from '@/components/ui/fullscreen-calendar'
import type { CalendarData, CalendarEvent } from '@/components/ui/fullscreen-calendar'
import { DatePicker } from '@/components/ui/date-picker'
import { TimePicker } from '@/components/ui/time-picker'
import { toDisplayDate, formatCivilDate } from '@/lib/civilDate'

function formatEventTime(time: string): string {
  return format(parse(time, 'HH:mm', new Date()), 'h:mm a')
}

export default function StudioCalendar() {
  const { studio, addStudioEvent, removeStudioEvent, updateStudioEventNotes } = useApp()
  const [showAdd, setShowAdd] = useState(false)
  const [title, setTitle] = useState('')
  const [date, setDate] = useState<string | undefined>(undefined)
  const [time, setTime] = useState('')
  const [notesEvent, setNotesEvent] = useState<CalendarEvent | null>(null)
  const [notesText, setNotesText] = useState('')

  const calendarData = useMemo<CalendarData[]>(() => {
    const byDay = new Map<string, CalendarData>()
    for (const event of studio.events) {
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
  }, [studio.events])

  const handleNewEvent = (day: Date) => {
    setDate(formatCivilDate(day))
    setShowAdd(true)
  }

  const handleRemoveEvent = (event: CalendarEvent) => {
    const when = event.time ? ` at ${event.time}` : ''
    if (window.confirm(`Remove "${event.name}"${when} from the calendar?`)) {
      removeStudioEvent(event.id)
    }
  }

  const handleOpenNotes = (event: CalendarEvent) => {
    setNotesEvent(event)
    setNotesText(event.notes ?? '')
  }

  const handleSaveNotes = () => {
    if (!notesEvent) return
    updateStudioEventNotes(notesEvent.id, notesText.trim())
    setNotesEvent(null)
  }

  const handleAdd = () => {
    if (!title.trim() || !date) return
    addStudioEvent({ id: `studio-event-${Date.now()}`, title: title.trim(), date, time: time || undefined })
    setTitle('')
    setDate(undefined)
    setTime('')
    setShowAdd(false)
  }

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-xl font-semibold text-ink-primary">Calendar</h1>
        <p className="text-sm text-ink-secondary">Studio events — shoots, launches, team days</p>
      </div>

      <div className="flex h-[75vh] min-h-[560px] flex-col overflow-hidden rounded-xl border border-black/[0.06] bg-white shadow-card">
        <FullScreenCalendar
          data={calendarData}
          onNewEvent={handleNewEvent}
          onRemoveEvent={handleRemoveEvent}
          onOpenNotes={handleOpenNotes}
        />
      </div>

      <Drawer open={showAdd} onClose={() => setShowAdd(false)} title="Add an event">
        <div className="flex flex-col gap-4">
          <div>
            <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-ink-muted">Event</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded-lg border border-black/[0.10] px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
              autoComplete="off"
              data-1p-ignore
              data-lpignore="true"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-ink-muted">Date</label>
              <DatePicker value={date} onChange={setDate} placeholder="Select date" />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-ink-muted">
                Time <span className="normal-case text-ink-muted/70">(optional)</span>
              </label>
              <TimePicker value={time} onChange={setTime} />
            </div>
          </div>
          <button
            onClick={handleAdd}
            className="mt-2 rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-600"
          >
            Add event
          </button>
        </div>
      </Drawer>

      <Drawer open={!!notesEvent} onClose={() => setNotesEvent(null)} title={notesEvent ? `Notes — ${notesEvent.name}` : 'Notes'}>
        <div className="flex flex-col gap-4">
          <div>
            <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-ink-muted">Notes</label>
            <textarea
              value={notesText}
              onChange={(e) => setNotesText(e.target.value)}
              placeholder="Add details, links, or anything the team should know…"
              rows={6}
              className="w-full resize-none rounded-lg border border-black/[0.10] px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
              autoFocus
            />
          </div>
          <button
            onClick={handleSaveNotes}
            className="mt-2 rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-600"
          >
            Save notes
          </button>
        </div>
      </Drawer>
    </div>
  )
}
