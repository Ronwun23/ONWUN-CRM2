import { useMemo, useState } from 'react'
import { format } from 'date-fns'
import { useApp } from '@/context/AppContext'
import Drawer from '@/components/Drawer'
import { FullScreenCalendar } from '@/components/ui/fullscreen-calendar'
import type { CalendarData, CalendarEvent } from '@/components/ui/fullscreen-calendar'
import { DatePicker } from '@/components/ui/date-picker'
import { toDisplayDate, formatCivilDate } from '@/lib/civilDate'

export default function StudioCalendar() {
  const { studio, addStudioEvent, removeStudioEvent } = useApp()
  const [showAdd, setShowAdd] = useState(false)
  const [title, setTitle] = useState('')
  const [date, setDate] = useState<string | undefined>(undefined)

  const calendarData = useMemo<CalendarData[]>(() => {
    const byDay = new Map<string, CalendarData>()
    for (const event of studio.events) {
      const day = toDisplayDate(event.date)
      const key = format(day, 'yyyy-MM-dd')
      if (!byDay.has(key)) byDay.set(key, { day, events: [] })
      byDay.get(key)!.events.push({ id: event.id, name: event.title })
    }
    return [...byDay.values()]
  }, [studio.events])

  const handleNewEvent = (day: Date) => {
    setDate(formatCivilDate(day))
    setShowAdd(true)
  }

  const handleSelectEvent = (event: CalendarEvent) => {
    if (window.confirm(`Remove "${event.name}" from the calendar?`)) {
      removeStudioEvent(event.id)
    }
  }

  const handleAdd = () => {
    if (!title.trim() || !date) return
    addStudioEvent({ id: `studio-event-${Date.now()}`, title: title.trim(), date })
    setTitle('')
    setDate(undefined)
    setShowAdd(false)
  }

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-xl font-semibold text-ink-primary">Calendar</h1>
        <p className="text-sm text-ink-secondary">Studio events — shoots, launches, team days</p>
      </div>

      <div className="flex h-[75vh] min-h-[560px] flex-col overflow-hidden rounded-xl border border-black/[0.06] bg-white shadow-card">
        <FullScreenCalendar data={calendarData} onNewEvent={handleNewEvent} onSelectEvent={handleSelectEvent} />
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
          <div>
            <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-ink-muted">Date</label>
            <DatePicker value={date} onChange={setDate} placeholder="Select date" />
          </div>
          <button
            onClick={handleAdd}
            className="mt-2 rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-600"
          >
            Add event
          </button>
        </div>
      </Drawer>
    </div>
  )
}
