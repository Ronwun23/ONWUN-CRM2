import { useMemo, useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { useApp } from '@/context/AppContext'
import Card from '@/components/Card'
import Drawer from '@/components/Drawer'
import { Calendar } from '@/components/ui/calendar'
import { DatePicker } from '@/components/ui/date-picker'
import { formatDate } from '@/lib/format'
import { toDisplayDate } from '@/lib/civilDate'

export default function StudioCalendar() {
  const { studio, addStudioEvent, removeStudioEvent } = useApp()
  const [showAdd, setShowAdd] = useState(false)
  const [title, setTitle] = useState('')
  const [date, setDate] = useState<string | undefined>(undefined)

  const eventDates = useMemo(() => studio.events.map((e) => toDisplayDate(e.date)), [studio.events])

  const upcoming = useMemo(() => {
    const startOfToday = new Date()
    startOfToday.setHours(0, 0, 0, 0)
    return [...studio.events]
      .filter((e) => toDisplayDate(e.date).getTime() >= startOfToday.getTime())
      .sort((a, b) => toDisplayDate(a.date).getTime() - toDisplayDate(b.date).getTime())
  }, [studio.events])

  const handleAdd = () => {
    if (!title.trim() || !date) return
    addStudioEvent({ id: `studio-event-${Date.now()}`, title: title.trim(), date })
    setTitle('')
    setDate(undefined)
    setShowAdd(false)
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-ink-primary">Calendar</h1>
          <p className="text-sm text-ink-secondary">Studio events — shoots, launches, team days</p>
        </div>
        <button
          onClick={() => setShowAdd(true)}
          className="flex items-center gap-1.5 rounded-lg bg-brand-500 px-3.5 py-2 text-sm font-semibold text-white hover:bg-brand-600"
        >
          <Plus size={16} />
          Add event
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[auto_1fr]">
        <Card>
          <Calendar
            mode="single"
            selected={undefined}
            onSelect={() => {}}
            modifiers={{ event: eventDates }}
            modifiersClassNames={{
              event:
                'relative after:absolute after:bottom-1 after:left-1/2 after:h-1 after:w-1 after:-translate-x-1/2 after:rounded-full after:bg-brand-500',
            }}
          />
        </Card>

        <Card title="Upcoming" subtitle={`${upcoming.length} scheduled`}>
          {upcoming.length === 0 && <p className="py-4 text-sm text-ink-muted">Nothing on the calendar yet.</p>}
          <ul className="flex flex-col divide-y divide-black/[0.05]">
            {upcoming.map((event) => (
              <li key={event.id} className="group flex items-center gap-3 py-2.5">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm text-ink-primary">{event.title}</p>
                </div>
                <span className="text-xs text-ink-muted">{formatDate(event.date)}</span>
                <button
                  onClick={() => removeStudioEvent(event.id)}
                  className="flex h-6 w-6 items-center justify-center rounded-md text-ink-muted opacity-0 transition-opacity hover:bg-surface-sunken hover:text-status-critical group-hover:opacity-100"
                  aria-label={`Remove ${event.title}`}
                >
                  <Trash2 size={13} />
                </button>
              </li>
            ))}
          </ul>
        </Card>
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
