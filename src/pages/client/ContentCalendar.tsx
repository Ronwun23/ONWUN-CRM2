import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import clsx from 'clsx'
import { Calendar as CalendarIcon, CalendarDays, ChevronLeft, ChevronRight, Clock, Filter, List, Plus, Search, Trash2, X } from 'lucide-react'
import { useClientOutlet } from '@/lib/useClient'
import { useApp } from '@/context/AppContext'
import Drawer from '@/components/Drawer'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { DatePicker } from '@/components/ui/date-picker'
import { TimePicker } from '@/components/ui/time-picker'
import { Select } from '@/components/ui/select'
import { toDisplayDate, formatCivilDate } from '@/lib/civilDate'
import { CONTENT_EVENT_TYPE_LABEL, REEL_DURATION_LABEL } from '@/lib/labels'
import { confirmAction } from '@/lib/confirm'
import { eventDisplayTitle } from '@/lib/contentEvent'
import type { ClientEvent, ContentEventType, ReelDuration } from '@/types'

type ViewMode = 'month' | 'week' | 'day' | 'list'

const CONTENT_TYPE_OPTIONS: ContentEventType[] = ['shoot_day', 'reel', 'static', 'story', 'carousel']
const REEL_DURATION_OPTIONS: ReelDuration[] = ['0_5', '5_10', '10_20', '20_plus']

// Colour-coded by content type — there's no separate "colour" field here,
// since contentType already is the one categorization axis this data has.
const CONTENT_TYPE_COLOR: Record<ContentEventType, { swatch: string; tint: string; text: string }> = {
  shoot_day: { swatch: 'bg-series-orange', tint: 'bg-series-orange/[0.12]', text: 'text-series-orange' },
  reel: { swatch: 'bg-series-violet', tint: 'bg-series-violet/[0.12]', text: 'text-series-violet' },
  static: { swatch: 'bg-series-blue', tint: 'bg-series-blue/[0.12]', text: 'text-series-blue' },
  story: { swatch: 'bg-series-magenta', tint: 'bg-series-magenta/[0.12]', text: 'text-series-magenta' },
  carousel: { swatch: 'bg-series-aqua', tint: 'bg-series-aqua/[0.12]', text: 'text-series-aqua' },
}

function eventStart(event: ClientEvent): Date {
  const start = toDisplayDate(event.date)
  if (event.time) {
    const [h, m] = event.time.split(':').map(Number)
    start.setHours(h, m, 0, 0)
  }
  return start
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString('en-GB', { hour: 'numeric', minute: '2-digit' })
}

function sameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
}

interface EventCardProps {
  event: ClientEvent
  onClick: () => void
  onRemove?: () => void
  onDragStart: () => void
  onDragEnd: () => void
  variant?: 'compact' | 'default'
}

function EventCard({ event, onClick, onRemove, onDragStart, onDragEnd, variant = 'default' }: EventCardProps) {
  const color = event.contentType ? CONTENT_TYPE_COLOR[event.contentType] : { swatch: 'bg-ink-muted', tint: 'bg-black/[0.05]', text: 'text-ink-secondary' }
  const start = eventStart(event)

  return (
    <div
      draggable
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onClick={(e) => {
        e.stopPropagation()
        onClick()
      }}
      className={clsx(
        'group/event relative cursor-pointer rounded-md border-l-2 text-left transition-colors',
        color.tint,
        color.swatch.replace('bg-', 'border-'),
        variant === 'compact' ? 'px-1.5 py-0.5' : 'px-2 py-1'
      )}
    >
      <div className={clsx('truncate pr-4 font-medium', color.text, variant === 'compact' ? 'text-[11px]' : 'text-xs')}>{event.title}</div>
      {variant !== 'compact' && event.time && (
        <div className="flex items-center gap-1 text-[11px] text-ink-muted">
          <Clock size={9} />
          {formatTime(start)}
        </div>
      )}
      {onRemove && (
        <button
          onClick={(e) => {
            e.stopPropagation()
            onRemove()
          }}
          className="absolute right-1 top-1 flex h-4 w-4 items-center justify-center rounded text-ink-muted opacity-0 hover:bg-[#fbecec] hover:text-status-critical group-hover/event:opacity-100"
          aria-label={`Remove ${event.title}`}
        >
          <Trash2 size={10} />
        </button>
      )}
    </div>
  )
}

function TypeFilterPopover({ selected, onToggle }: { selected: string[]; onToggle: (value: string) => void }) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          className={clsx(
            'flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-colors',
            selected.length > 0
              ? 'border-black bg-black text-white'
              : 'border-black/[0.10] text-ink-secondary hover:bg-surface-sunken/40'
          )}
        >
          <Filter size={12} />
          Type
          {selected.length > 0 && <span className="rounded-full bg-white/20 px-1.5 text-[10px] tabular-nums">{selected.length}</span>}
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-48 p-1.5">
        {CONTENT_TYPE_OPTIONS.map((type) => {
          const color = CONTENT_TYPE_COLOR[type]
          return (
            <button
              key={type}
              onClick={() => onToggle(type)}
              className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-sm text-ink-primary hover:bg-surface-sunken/50"
            >
              <span
                className={clsx(
                  'flex h-4 w-4 shrink-0 items-center justify-center rounded border',
                  selected.includes(type) ? 'border-black bg-black' : 'border-black/20'
                )}
              >
                {selected.includes(type) && <span className="h-1.5 w-1.5 rounded-sm bg-white" />}
              </span>
              <span className={clsx('h-2.5 w-2.5 rounded-full', color.swatch)} />
              {CONTENT_EVENT_TYPE_LABEL[type]}
            </button>
          )
        })}
      </PopoverContent>
    </Popover>
  )
}

// Unlike the studio Calendar, clicking into a day here opens a dedicated page
// for that day's content (like clicking into a document) — there's more to
// plan per day than a single title/time/notes trio (see ContentDay.tsx).
// Clicking an event chip goes straight to its day; the drawer here is only
// ever the quick "add" form, never an editor.
export default function ClientContentCalendar() {
  const client = useClientOutlet()
  const { addClientEvent, removeClientEvent, updateClientEventSchedule } = useApp()
  const navigate = useNavigate()

  const [view, setView] = useState<ViewMode>('month')
  const [currentDate, setCurrentDate] = useState(new Date())
  const [dragging, setDragging] = useState<ClientEvent | null>(null)

  const [search, setSearch] = useState('')
  const [selectedTypes, setSelectedTypes] = useState<string[]>([])

  const [showAdd, setShowAdd] = useState(false)
  const [contentType, setContentType] = useState<ContentEventType | ''>('')
  const [duration, setDuration] = useState<ReelDuration | ''>('')
  const [amount, setAmount] = useState('')
  const [date, setDate] = useState<string | undefined>(undefined)
  const [time, setTime] = useState('')

  const filteredEvents = useMemo(() => {
    const q = search.trim().toLowerCase()
    return client.events.filter((event) => {
      if (q && !event.title.toLowerCase().includes(q) && !event.notes?.toLowerCase().includes(q)) return false
      if (selectedTypes.length > 0 && !selectedTypes.includes(event.contentType ?? '')) return false
      return true
    })
  }, [client.events, search, selectedTypes])

  const hasActiveFilters = selectedTypes.length > 0 || !!search
  const clearFilters = () => {
    setSelectedTypes([])
    setSearch('')
  }

  const goToDay = (day: Date) => {
    navigate(`/clients/${client.id}/content-calendar/${formatCivilDate(day)}`)
  }

  const openAdd = (day?: Date) => {
    setDate(day ? formatCivilDate(day) : formatCivilDate(new Date()))
    setContentType('')
    setDuration('')
    setAmount('')
    setTime('')
    setShowAdd(true)
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
    setShowAdd(false)
  }

  const handleRemove = async (event: ClientEvent) => {
    const when = event.time ? ` at ${event.time}` : ''
    const confirmed = await confirmAction(`Remove "${event.title}"${when} from the calendar?`, {
      confirmLabel: 'Remove',
      destructive: true,
    })
    if (confirmed) removeClientEvent(client.id, event.id)
  }

  const handleDrop = (dropDate: Date, hour?: number) => {
    if (!dragging) return
    const patch: { date: string; time?: string } = { date: formatCivilDate(dropDate) }
    if (hour !== undefined) patch.time = `${String(hour).padStart(2, '0')}:00`
    updateClientEventSchedule(client.id, dragging.id, patch)
    setDragging(null)
  }

  const navigateDate = (direction: 'prev' | 'next') => {
    setCurrentDate((prev) => {
      const next = new Date(prev)
      const step = direction === 'next' ? 1 : -1
      if (view === 'month') next.setMonth(prev.getMonth() + step)
      else if (view === 'week') next.setDate(prev.getDate() + step * 7)
      else if (view === 'day') next.setDate(prev.getDate() + step)
      return next
    })
  }

  const title =
    view === 'month'
      ? currentDate.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })
      : view === 'week'
        ? `Week of ${currentDate.toLocaleDateString('en-GB', { month: 'short', day: 'numeric' })}`
        : view === 'day'
          ? currentDate.toLocaleDateString('en-GB', { weekday: 'long', month: 'long', day: 'numeric' })
          : 'All scheduled content'

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold text-ink-primary">Content calendar</h1>
          <p className="text-sm text-ink-secondary">Scheduled posts and content for {client.name}</p>
        </div>
        <button
          onClick={() => openAdd()}
          className="flex items-center gap-1.5 rounded-lg bg-black px-3 py-1.5 text-xs font-semibold text-white hover:bg-black/85"
        >
          <Plus size={12} />
          Add task
        </button>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-black/[0.06] bg-white px-3 py-2 shadow-card">
        <div className="flex items-center gap-3">
          <h2 className="text-sm font-semibold text-ink-primary">{title}</h2>
          {view !== 'list' && (
            <div className="flex items-center gap-1">
              <button
                onClick={() => navigateDate('prev')}
                className="flex h-7 w-7 items-center justify-center rounded-lg text-ink-muted hover:bg-surface-sunken/50 hover:text-ink-primary"
              >
                <ChevronLeft size={14} />
              </button>
              <button
                onClick={() => setCurrentDate(new Date())}
                className="rounded-lg px-2 py-1 text-xs font-medium text-ink-secondary hover:bg-surface-sunken/50"
              >
                Today
              </button>
              <button
                onClick={() => navigateDate('next')}
                className="flex h-7 w-7 items-center justify-center rounded-lg text-ink-muted hover:bg-surface-sunken/50 hover:text-ink-primary"
              >
                <ChevronRight size={14} />
              </button>
            </div>
          )}
        </div>

        <div className="flex items-center gap-1 rounded-lg border border-black/[0.08] p-0.5">
          {(
            [
              ['month', CalendarIcon],
              ['week', CalendarDays],
              ['day', Clock],
              ['list', List],
            ] as const
          ).map(([key, Icon]) => (
            <button
              key={key}
              onClick={() => setView(key)}
              className={clsx(
                'flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-medium capitalize transition-colors',
                view === key ? 'bg-black text-white' : 'text-ink-secondary hover:bg-surface-sunken/50'
              )}
            >
              <Icon size={12} />
              {key}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div className="flex flex-1 items-center gap-1.5 rounded-lg border border-black/[0.08] px-2.5 py-1.5">
          <Search size={13} className="text-ink-muted" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search content…"
            className="w-full min-w-32 text-sm text-ink-primary placeholder:text-ink-muted focus:outline-none"
          />
        </div>
        <TypeFilterPopover
          selected={selectedTypes}
          onToggle={(v) => setSelectedTypes((prev) => (prev.includes(v) ? prev.filter((x) => x !== v) : [...prev, v]))}
        />
        {hasActiveFilters && (
          <button onClick={clearFilters} className="flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs font-medium text-ink-muted hover:text-ink-primary">
            <X size={12} />
            Clear
          </button>
        )}
      </div>

      {view === 'month' && (
        <MonthView
          currentDate={currentDate}
          events={filteredEvents}
          onEventClick={(e) => goToDay(toDisplayDate(e.date))}
          onEventRemove={handleRemove}
          onDayClick={goToDay}
          onDrop={handleDrop}
          onDragStart={setDragging}
          onDragEnd={() => setDragging(null)}
        />
      )}
      {view === 'week' && (
        <WeekView
          currentDate={currentDate}
          events={filteredEvents}
          onEventClick={(e) => goToDay(toDisplayDate(e.date))}
          onDrop={handleDrop}
          onDragStart={setDragging}
          onDragEnd={() => setDragging(null)}
        />
      )}
      {view === 'day' && (
        <DayView
          currentDate={currentDate}
          events={filteredEvents}
          onEventClick={(e) => goToDay(toDisplayDate(e.date))}
          onDrop={handleDrop}
          onDragStart={setDragging}
          onDragEnd={() => setDragging(null)}
        />
      )}
      {view === 'list' && <ListView events={filteredEvents} onEventClick={(e) => goToDay(toDisplayDate(e.date))} />}

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
                className="w-full rounded-lg border border-black/[0.10] px-3 py-2 text-sm focus:border-black focus:outline-none focus:ring-1 focus:ring-black"
              />
            </div>
          )}
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
          <button
            onClick={handleAdd}
            disabled={!contentType || !date}
            className="mt-2 rounded-lg bg-black px-4 py-2.5 text-sm font-semibold text-white hover:bg-black/85 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Add task
          </button>
        </div>
      </Drawer>
    </div>
  )
}

function MonthView({
  currentDate,
  events,
  onEventClick,
  onEventRemove,
  onDayClick,
  onDrop,
  onDragStart,
  onDragEnd,
}: {
  currentDate: Date
  events: ClientEvent[]
  onEventClick: (event: ClientEvent) => void
  onEventRemove: (event: ClientEvent) => void
  onDayClick: (date: Date) => void
  onDrop: (date: Date) => void
  onDragStart: (event: ClientEvent) => void
  onDragEnd: () => void
}) {
  const firstOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1)
  const startDate = new Date(firstOfMonth)
  startDate.setDate(startDate.getDate() - ((startDate.getDay() + 6) % 7))

  const days = Array.from({ length: 42 }, (_, i) => {
    const d = new Date(startDate)
    d.setDate(startDate.getDate() + i)
    return d
  })

  const eventsByDay = (day: Date) => events.filter((e) => sameDay(eventStart(e), day))

  return (
    <div className="overflow-hidden rounded-xl border border-black/[0.06] bg-white shadow-card">
      <div className="grid grid-cols-7 border-b border-black/[0.06]">
        {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((d) => (
          <div key={d} className="border-r border-black/[0.06] px-2 py-2 text-center text-xs font-medium text-ink-muted last:border-r-0">
            {d}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7">
        {days.map((day, i) => {
          const dayEvents = eventsByDay(day)
          const isCurrentMonth = day.getMonth() === currentDate.getMonth()
          const isToday = sameDay(day, new Date())
          return (
            <div
              key={i}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => onDrop(day)}
              onClick={() => onDayClick(day)}
              className={clsx(
                'min-h-24 cursor-pointer border-b border-r border-black/[0.06] p-1.5 transition-colors last:border-r-0 hover:bg-surface-sunken/20',
                !isCurrentMonth && 'bg-surface-sunken/20'
              )}
            >
              <div
                className={clsx(
                  'mb-1 flex h-5 w-5 items-center justify-center rounded-full text-xs',
                  isToday ? 'bg-black font-semibold text-white' : isCurrentMonth ? 'text-ink-primary' : 'text-ink-muted'
                )}
              >
                {day.getDate()}
              </div>
              <div className="flex flex-col gap-1">
                {dayEvents.slice(0, 3).map((event) => (
                  <EventCard
                    key={event.id}
                    event={event}
                    variant="compact"
                    onClick={() => onEventClick(event)}
                    onRemove={() => onEventRemove(event)}
                    onDragStart={() => onDragStart(event)}
                    onDragEnd={onDragEnd}
                  />
                ))}
                {dayEvents.length > 3 && <div className="px-1 text-[10px] text-ink-muted">+{dayEvents.length - 3} more</div>}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function WeekView({
  currentDate,
  events,
  onEventClick,
  onDrop,
  onDragStart,
  onDragEnd,
}: {
  currentDate: Date
  events: ClientEvent[]
  onEventClick: (event: ClientEvent) => void
  onDrop: (date: Date, hour: number) => void
  onDragStart: (event: ClientEvent) => void
  onDragEnd: () => void
}) {
  const startOfWeek = new Date(currentDate)
  startOfWeek.setDate(currentDate.getDate() - ((currentDate.getDay() + 6) % 7))
  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(startOfWeek)
    d.setDate(startOfWeek.getDate() + i)
    return d
  })
  const hours = Array.from({ length: 15 }, (_, i) => i + 7)

  return (
    <div className="overflow-auto rounded-xl border border-black/[0.06] bg-white shadow-card">
      <div className="grid grid-cols-8 border-b border-black/[0.06]">
        <div className="border-r border-black/[0.06] p-2 text-center text-xs font-medium text-ink-muted">Time</div>
        {weekDays.map((day) => (
          <div key={day.toISOString()} className="border-r border-black/[0.06] p-2 text-center last:border-r-0">
            <div className="text-xs font-medium text-ink-primary">{day.toLocaleDateString('en-GB', { weekday: 'short' })}</div>
            <div className="text-[10px] text-ink-muted">{day.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</div>
          </div>
        ))}
      </div>
      {hours.map((hour) => (
        <div key={hour} className="grid grid-cols-8 border-b border-black/[0.04] last:border-b-0">
          <div className="border-r border-black/[0.06] p-1.5 text-[10px] text-ink-muted">{String(hour).padStart(2, '0')}:00</div>
          {weekDays.map((day) => {
            const cellEvents = events.filter((e) => sameDay(eventStart(e), day) && e.time && eventStart(e).getHours() === hour)
            return (
              <div
                key={`${day.toISOString()}-${hour}`}
                onDragOver={(e) => e.preventDefault()}
                onDrop={() => onDrop(day, hour)}
                className="min-h-10 border-r border-black/[0.06] p-0.5 transition-colors last:border-r-0 hover:bg-surface-sunken/20"
              >
                {cellEvents.map((event) => (
                  <EventCard key={event.id} event={event} onClick={() => onEventClick(event)} onDragStart={() => onDragStart(event)} onDragEnd={onDragEnd} />
                ))}
              </div>
            )
          })}
        </div>
      ))}
    </div>
  )
}

function DayView({
  currentDate,
  events,
  onEventClick,
  onDrop,
  onDragStart,
  onDragEnd,
}: {
  currentDate: Date
  events: ClientEvent[]
  onEventClick: (event: ClientEvent) => void
  onDrop: (date: Date, hour: number) => void
  onDragStart: (event: ClientEvent) => void
  onDragEnd: () => void
}) {
  const hours = Array.from({ length: 15 }, (_, i) => i + 7)
  const allDay = events.filter((e) => sameDay(eventStart(e), currentDate) && !e.time)

  return (
    <div className="overflow-auto rounded-xl border border-black/[0.06] bg-white shadow-card">
      {allDay.length > 0 && (
        <div className="flex flex-wrap gap-1.5 border-b border-black/[0.06] p-2">
          {allDay.map((event) => (
            <EventCard key={event.id} event={event} onClick={() => onEventClick(event)} onDragStart={() => onDragStart(event)} onDragEnd={onDragEnd} />
          ))}
        </div>
      )}
      {hours.map((hour) => {
        const hourEvents = events.filter((e) => sameDay(eventStart(e), currentDate) && e.time && eventStart(e).getHours() === hour)
        return (
          <div key={hour} className="flex border-b border-black/[0.04] last:border-b-0" onDragOver={(e) => e.preventDefault()} onDrop={() => onDrop(currentDate, hour)}>
            <div className="w-16 shrink-0 border-r border-black/[0.06] p-2 text-xs text-ink-muted">{String(hour).padStart(2, '0')}:00</div>
            <div className="min-h-14 flex-1 p-1.5 transition-colors hover:bg-surface-sunken/20">
              <div className="flex flex-col gap-1.5">
                {hourEvents.map((event) => (
                  <EventCard key={event.id} event={event} onClick={() => onEventClick(event)} onDragStart={() => onDragStart(event)} onDragEnd={onDragEnd} />
                ))}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

function ListView({ events, onEventClick }: { events: ClientEvent[]; onEventClick: (event: ClientEvent) => void }) {
  const sorted = [...events].sort((a, b) => eventStart(a).getTime() - eventStart(b).getTime())
  const groups = new Map<string, ClientEvent[]>()
  for (const event of sorted) {
    const key = formatCivilDate(eventStart(event))
    if (!groups.has(key)) groups.set(key, [])
    groups.get(key)!.push(event)
  }

  if (sorted.length === 0) {
    return (
      <div className="rounded-xl border border-black/[0.06] bg-white p-8 text-center text-sm text-ink-muted shadow-card">
        Nothing scheduled yet.
      </div>
    )
  }

  return (
    <div className="divide-y divide-black/[0.06] overflow-hidden rounded-xl border border-black/[0.06] bg-white shadow-card">
      {[...groups.entries()].map(([dateKey, dayEvents]) => (
        <div key={dateKey} className="p-3.5">
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-muted">
            {toDisplayDate(dateKey).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })}
          </h3>
          <div className="flex flex-col gap-1.5">
            {dayEvents.map((event) => (
              <EventCard key={event.id} event={event} onClick={() => onEventClick(event)} onDragStart={() => {}} onDragEnd={() => {}} />
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
