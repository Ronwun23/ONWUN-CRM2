import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { format, parse } from 'date-fns'
import { useClientOutlet } from '@/lib/useClient'
import { useApp } from '@/context/AppContext'
import Drawer from '@/components/Drawer'
import { FullScreenCalendar } from '@/components/ui/fullscreen-calendar'
import type { CalendarData, CalendarEvent } from '@/components/ui/fullscreen-calendar'
import { DatePicker } from '@/components/ui/date-picker'
import { TimePicker } from '@/components/ui/time-picker'
import { Select } from '@/components/ui/select'
import { toDisplayDate, formatCivilDate } from '@/lib/civilDate'
import { CONTENT_EVENT_TYPE_LABEL, REEL_DURATION_LABEL } from '@/lib/labels'
import { confirmAction } from '@/lib/confirm'
import type { ContentEventType, ReelDuration } from '@/types'

const CONTENT_TYPE_OPTIONS: ContentEventType[] = ['shoot_day', 'reel', 'static', 'story', 'carousel']
const REEL_DURATION_OPTIONS: ReelDuration[] = ['0_5', '5_10', '10_20', '20_plus']

function eventDisplayTitle(contentType: ContentEventType, duration: ReelDuration | '', amount: string): string {
  const label = CONTENT_EVENT_TYPE_LABEL[contentType]
  if (contentType === 'reel') return duration ? `${label} — ${REEL_DURATION_LABEL[duration]}` : label
  return amount ? `${label} — ${amount} post${amount === '1' ? '' : 's'}` : label
}

function formatEventTime(time: string): string {
  return format(parse(time, 'HH:mm', new Date()), 'h:mm a')
}

// Unlike the studio-wide Calendar, double-clicking into a day here opens a
// dedicated page for that day's content (like clicking into a document) —
// there's more to plan per day than a single title/time/notes trio. A
// single click still just selects the day, and "Add task" opens a quick
// side panel rather than jumping straight into that page.
export default function ClientContentCalendar() {
  const client = useClientOutlet()
  const { addClientEvent, removeClientEvent } = useApp()
  const navigate = useNavigate()
  const [showAdd, setShowAdd] = useState(false)
  const [contentType, setContentType] = useState<ContentEventType | ''>('')
  const [duration, setDuration] = useState<ReelDuration | ''>('')
  const [amount, setAmount] = useState('')
  const [date, setDate] = useState<string | undefined>(undefined)
  const [time, setTime] = useState('')

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

  const handleNewEvent = (day: Date) => {
    setDate(formatCivilDate(day))
    setContentType('')
    setDuration('')
    setAmount('')
    setTime('')
    setShowAdd(true)
  }

  const handleRemoveEvent = async (event: CalendarEvent) => {
    const when = event.time ? ` at ${event.time}` : ''
    const confirmed = await confirmAction(`Remove "${event.name}"${when} from the calendar?`, {
      confirmLabel: 'Remove',
      destructive: true,
    })
    if (confirmed) removeClientEvent(client.id, event.id)
  }

  const handleAdd = () => {
    if (!contentType || !date) return
    addClientEvent(client.id, {
      id: `content-event-${Date.now()}`,
      title: eventDisplayTitle(contentType, duration, amount),
      date,
      time: time || undefined,
      contentType,
      duration: contentType === 'reel' ? duration || undefined : undefined,
      amount: contentType !== 'reel' && amount ? Number(amount) : undefined,
    })
    setContentType('')
    setDuration('')
    setAmount('')
    setDate(undefined)
    setTime('')
    setShowAdd(false)
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
          newEventLabel="Add task"
          onNewEvent={handleNewEvent}
          onDayClick={goToDay}
          onRemoveEvent={handleRemoveEvent}
          onOpenNotes={(event) => {
            const source = client.events.find((e) => e.id === event.id)
            if (source) goToDay(toDisplayDate(source.date))
          }}
        />
      </div>

      <Drawer open={showAdd} onClose={() => setShowAdd(false)} title="Add task">
        <div className="flex flex-col gap-4">
          <div>
            <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-ink-muted">Type</label>
            <Select
              value={contentType}
              onChange={(v) => {
                setContentType(v as ContentEventType)
                setDuration('')
                setAmount('')
              }}
              options={CONTENT_TYPE_OPTIONS.map((t) => ({ value: t, label: CONTENT_EVENT_TYPE_LABEL[t] }))}
              placeholder="Select…"
            />
          </div>
          {contentType === 'reel' && (
            <div>
              <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-ink-muted">Duration</label>
              <Select
                value={duration}
                onChange={(v) => setDuration(v as ReelDuration)}
                options={REEL_DURATION_OPTIONS.map((d) => ({ value: d, label: REEL_DURATION_LABEL[d] }))}
                placeholder="Select…"
              />
            </div>
          )}
          {contentType && contentType !== 'reel' && (
            <div>
              <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-ink-muted">Amount</label>
              <input
                type="number"
                min={1}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="Number of posts"
                className="w-full rounded-lg border border-black/[0.10] px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
              />
            </div>
          )}
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
            disabled={!contentType || !date}
            className="mt-2 rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Add task
          </button>
        </div>
      </Drawer>
    </div>
  )
}
