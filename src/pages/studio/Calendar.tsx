import { useCallback, useMemo, useState } from 'react'
import clsx from 'clsx'
import { Calendar as CalendarIcon, CalendarDays, ChevronLeft, ChevronRight, Clock, Filter, List, Plus, Search, X } from 'lucide-react'
import { useApp } from '@/context/AppContext'
import Drawer from '@/components/Drawer'
import Pill from '@/components/Pill'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Select } from '@/components/ui/select'
import { DatePicker } from '@/components/ui/date-picker'
import { TimePicker } from '@/components/ui/time-picker'
import { toDisplayDate, formatCivilDate } from '@/lib/civilDate'
import { confirmAction } from '@/lib/confirm'
import type { ClientEvent } from '@/types'

type ViewMode = 'month' | 'week' | 'day' | 'list'

const CATEGORIES = ['Meeting', 'Shoot', 'Launch', 'Team', 'Reminder']
const TAGS = ['Important', 'Urgent', 'Client-facing', 'Internal']
const EVENT_COLORS = [
  { name: 'Blue', value: 'blue', swatch: 'bg-series-blue', tint: 'bg-series-blue/[0.12]', text: 'text-series-blue' },
  { name: 'Aqua', value: 'aqua', swatch: 'bg-series-aqua', tint: 'bg-series-aqua/[0.12]', text: 'text-series-aqua' },
  { name: 'Violet', value: 'violet', swatch: 'bg-series-violet', tint: 'bg-series-violet/[0.12]', text: 'text-series-violet' },
  { name: 'Orange', value: 'orange', swatch: 'bg-series-orange', tint: 'bg-series-orange/[0.12]', text: 'text-series-orange' },
  { name: 'Magenta', value: 'magenta', swatch: 'bg-series-magenta', tint: 'bg-series-magenta/[0.12]', text: 'text-series-magenta' },
  { name: 'Red', value: 'red', swatch: 'bg-series-red', tint: 'bg-series-red/[0.12]', text: 'text-series-red' },
]

function colorFor(value: string | undefined) {
  return EVENT_COLORS.find((c) => c.value === value) ?? { name: 'Grey', value: '', swatch: 'bg-ink-muted', tint: 'bg-black/[0.05]', text: 'text-ink-secondary' }
}

function eventStart(event: ClientEvent): Date {
  const start = toDisplayDate(event.date)
  if (event.time) {
    const [h, m] = event.time.split(':').map(Number)
    start.setHours(h, m, 0, 0)
  }
  return start
}

// There's no real "end time" on an event — this is a display-only default
// (1h block) so the week/day grids have something to draw. Never persisted.
function eventEnd(event: ClientEvent): Date {
  const end = new Date(eventStart(event))
  if (event.time) end.setHours(end.getHours() + 1)
  else end.setDate(end.getDate() + 1)
  return end
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
  onDragStart: () => void
  onDragEnd: () => void
  variant?: 'compact' | 'default' | 'detailed'
}

function EventCard({ event, onClick, onDragStart, onDragEnd, variant = 'default' }: EventCardProps) {
  const color = colorFor(event.color)
  const start = eventStart(event)
  const end = eventEnd(event)

  return (
    <div
      draggable
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onClick={onClick}
      className={clsx(
        'group cursor-pointer rounded-md border-l-2 text-left transition-colors',
        color.tint,
        color.swatch.replace('bg-', 'border-'),
        variant === 'compact' ? 'px-1.5 py-0.5' : 'px-2 py-1'
      )}
    >
      <div className={clsx('truncate font-medium', color.text, variant === 'compact' ? 'text-[11px]' : 'text-xs')}>{event.title}</div>
      {variant !== 'compact' && event.time && (
        <div className="flex items-center gap-1 text-[11px] text-ink-muted">
          <Clock size={9} />
          {formatTime(start)}
          {variant === 'detailed' && ` – ${formatTime(end)}`}
        </div>
      )}
      {variant === 'detailed' && (event.category || (event.tags && event.tags.length > 0)) && (
        <div className="mt-1 flex flex-wrap gap-1">
          {event.category && <Pill tone="neutral">{event.category}</Pill>}
          {event.tags?.map((tag) => (
            <Pill key={tag} tone="neutral">
              {tag}
            </Pill>
          ))}
        </div>
      )}
    </div>
  )
}

function FilterPopover({
  label,
  options,
  selected,
  onToggle,
  renderOption,
}: {
  label: string
  options: string[]
  selected: string[]
  onToggle: (value: string) => void
  renderOption?: (value: string) => React.ReactNode
}) {
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
          {label}
          {selected.length > 0 && (
            <span className="rounded-full bg-white/20 px-1.5 text-[10px] tabular-nums">{selected.length}</span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-48 p-1.5">
        {options.map((option) => (
          <button
            key={option}
            onClick={() => onToggle(option)}
            className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-sm text-ink-primary hover:bg-surface-sunken/50"
          >
            <span
              className={clsx(
                'flex h-4 w-4 shrink-0 items-center justify-center rounded border',
                selected.includes(option) ? 'border-black bg-black' : 'border-black/20'
              )}
            >
              {selected.includes(option) && <span className="h-1.5 w-1.5 rounded-sm bg-white" />}
            </span>
            {renderOption ? renderOption(option) : option}
          </button>
        ))}
      </PopoverContent>
    </Popover>
  )
}

export default function StudioCalendar() {
  const { studio, addStudioEvent, removeStudioEvent, updateStudioEvent } = useApp()
  const [view, setView] = useState<ViewMode>('month')
  const [currentDate, setCurrentDate] = useState(new Date())
  const [dragging, setDragging] = useState<ClientEvent | null>(null)

  const [search, setSearch] = useState('')
  const [selectedColors, setSelectedColors] = useState<string[]>([])
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])

  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<ClientEvent | null>(null)
  const [formTitle, setFormTitle] = useState('')
  const [formNotes, setFormNotes] = useState('')
  const [formDate, setFormDate] = useState<string | undefined>(undefined)
  const [formTime, setFormTime] = useState('')
  const [formCategory, setFormCategory] = useState(CATEGORIES[0])
  const [formColor, setFormColor] = useState(EVENT_COLORS[0].value)
  const [formTags, setFormTags] = useState<string[]>([])
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  const filteredEvents = useMemo(() => {
    const q = search.trim().toLowerCase()
    return studio.events.filter((event) => {
      if (q) {
        const matches =
          event.title.toLowerCase().includes(q) ||
          event.notes?.toLowerCase().includes(q) ||
          event.category?.toLowerCase().includes(q) ||
          event.tags?.some((t) => t.toLowerCase().includes(q))
        if (!matches) return false
      }
      if (selectedColors.length > 0 && !selectedColors.includes(event.color ?? '')) return false
      if (selectedCategories.length > 0 && !selectedCategories.includes(event.category ?? '')) return false
      if (selectedTags.length > 0 && !event.tags?.some((t) => selectedTags.includes(t))) return false
      return true
    })
  }, [studio.events, search, selectedColors, selectedTags, selectedCategories])

  const hasActiveFilters = selectedColors.length > 0 || selectedTags.length > 0 || selectedCategories.length > 0 || !!search
  const clearFilters = () => {
    setSelectedColors([])
    setSelectedTags([])
    setSelectedCategories([])
    setSearch('')
  }

  const openCreate = (date?: Date) => {
    setEditing(null)
    setFormTitle('')
    setFormNotes('')
    setFormDate(date ? formatCivilDate(date) : undefined)
    setFormTime('')
    setFormCategory(CATEGORIES[0])
    setFormColor(EVENT_COLORS[0].value)
    setFormTags([])
    setFormError(null)
    setShowForm(true)
  }

  const openEdit = (event: ClientEvent) => {
    setEditing(event)
    setFormTitle(event.title)
    setFormNotes(event.notes ?? '')
    setFormDate(event.date)
    setFormTime(event.time ?? '')
    setFormCategory(event.category ?? CATEGORIES[0])
    setFormColor(event.color ?? EVENT_COLORS[0].value)
    setFormTags(event.tags ?? [])
    setFormError(null)
    setShowForm(true)
  }

  const handleSave = async () => {
    if (!formTitle.trim() || !formDate) return
    setSaving(true)
    setFormError(null)
    try {
      if (editing) {
        updateStudioEvent(editing.id, {
          title: formTitle.trim(),
          notes: formNotes.trim() || undefined,
          date: formDate,
          time: formTime || undefined,
          category: formCategory,
          color: formColor,
          tags: formTags,
        })
      } else {
        await addStudioEvent({
          id: `studio-event-${Date.now()}`,
          title: formTitle.trim(),
          notes: formNotes.trim() || undefined,
          date: formDate,
          time: formTime || undefined,
          category: formCategory,
          color: formColor,
          tags: formTags,
        })
      }
      setShowForm(false)
    } catch (err) {
      console.error('Failed to save event:', err)
      setFormError("Couldn't save this event — try again.")
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!editing) return
    const confirmed = await confirmAction(`Remove "${editing.title}" from the calendar?`, {
      confirmLabel: 'Remove',
      destructive: true,
    })
    if (confirmed) {
      removeStudioEvent(editing.id)
      setShowForm(false)
    }
  }

  const toggleFormTag = (tag: string) => {
    setFormTags((prev) => (prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]))
  }

  const handleDrop = useCallback(
    (date: Date, hour?: number) => {
      if (!dragging) return
      const nextDate = new Date(date)
      const patch: Partial<ClientEvent> = { date: formatCivilDate(nextDate) }
      if (hour !== undefined) patch.time = `${String(hour).padStart(2, '0')}:00`
      updateStudioEvent(dragging.id, patch)
      setDragging(null)
    },
    [dragging, updateStudioEvent]
  )

  const navigate = (direction: 'prev' | 'next') => {
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
          : 'All events'

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold text-ink-primary">Calendar</h1>
          <p className="text-sm text-ink-secondary">Studio events — shoots, launches, team days</p>
        </div>
        <button
          onClick={() => openCreate()}
          className="flex items-center gap-1.5 rounded-lg bg-black px-3 py-1.5 text-xs font-semibold text-white hover:bg-black/85"
        >
          <Plus size={12} />
          New event
        </button>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-black/[0.06] bg-white px-3 py-2 shadow-card">
        <div className="flex items-center gap-3">
          <h2 className="text-sm font-semibold text-ink-primary">{title}</h2>
          {view !== 'list' && (
            <div className="flex items-center gap-1">
              <button
                onClick={() => navigate('prev')}
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
                onClick={() => navigate('next')}
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
            placeholder="Search events…"
            className="w-full min-w-32 text-sm text-ink-primary placeholder:text-ink-muted focus:outline-none"
          />
        </div>
        <FilterPopover
          label="Colour"
          options={EVENT_COLORS.map((c) => c.value)}
          selected={selectedColors}
          onToggle={(v) => setSelectedColors((prev) => (prev.includes(v) ? prev.filter((x) => x !== v) : [...prev, v]))}
          renderOption={(v) => {
            const c = colorFor(v)
            return (
              <span className="flex items-center gap-2">
                <span className={clsx('h-2.5 w-2.5 rounded-full', c.swatch)} />
                {c.name}
              </span>
            )
          }}
        />
        <FilterPopover
          label="Category"
          options={CATEGORIES}
          selected={selectedCategories}
          onToggle={(v) => setSelectedCategories((prev) => (prev.includes(v) ? prev.filter((x) => x !== v) : [...prev, v]))}
        />
        <FilterPopover
          label="Tags"
          options={TAGS}
          selected={selectedTags}
          onToggle={(v) => setSelectedTags((prev) => (prev.includes(v) ? prev.filter((x) => x !== v) : [...prev, v]))}
        />
        {hasActiveFilters && (
          <button onClick={clearFilters} className="flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs font-medium text-ink-muted hover:text-ink-primary">
            <X size={12} />
            Clear
          </button>
        )}
      </div>

      {view === 'month' && <MonthView currentDate={currentDate} events={filteredEvents} onEventClick={openEdit} onDayClick={openCreate} onDrop={handleDrop} onDragStart={setDragging} onDragEnd={() => setDragging(null)} />}
      {view === 'week' && <WeekView currentDate={currentDate} events={filteredEvents} onEventClick={openEdit} onDrop={handleDrop} onDragStart={setDragging} onDragEnd={() => setDragging(null)} />}
      {view === 'day' && <DayView currentDate={currentDate} events={filteredEvents} onEventClick={openEdit} onDrop={handleDrop} onDragStart={setDragging} onDragEnd={() => setDragging(null)} />}
      {view === 'list' && <ListView events={filteredEvents} onEventClick={openEdit} />}

      <Drawer open={showForm} onClose={() => setShowForm(false)} title={editing ? 'Edit event' : 'Add an event'}>
        <div className="flex flex-col gap-4">
          <div>
            <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-ink-muted">Event</label>
            <input
              value={formTitle}
              onChange={(e) => setFormTitle(e.target.value)}
              className="w-full rounded-lg border border-black/[0.10] px-3 py-2 text-sm focus:border-black focus:outline-none focus:ring-1 focus:ring-black"
              autoComplete="off"
              data-1p-ignore
              data-lpignore="true"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-ink-muted">
              Notes <span className="normal-case text-ink-muted/70">(optional)</span>
            </label>
            <textarea
              value={formNotes}
              onChange={(e) => setFormNotes(e.target.value)}
              rows={3}
              className="w-full resize-none rounded-lg border border-black/[0.10] px-3 py-2 text-sm focus:border-black focus:outline-none focus:ring-1 focus:ring-black"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-ink-muted">Date</label>
              <DatePicker value={formDate} onChange={setFormDate} placeholder="Select date" />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-ink-muted">
                Time <span className="normal-case text-ink-muted/70">(optional)</span>
              </label>
              <TimePicker value={formTime} onChange={setFormTime} />
            </div>
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-ink-muted">Category</label>
            <Select value={formCategory} onChange={setFormCategory} options={CATEGORIES.map((c) => ({ value: c, label: c }))} />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-ink-muted">Colour</label>
            <div className="flex flex-wrap gap-2">
              {EVENT_COLORS.map((c) => (
                <button
                  key={c.value}
                  onClick={() => setFormColor(c.value)}
                  className={clsx(
                    'flex h-8 w-8 items-center justify-center rounded-full transition-shadow',
                    formColor === c.value && 'ring-2 ring-offset-2 ring-black'
                  )}
                  aria-label={c.name}
                >
                  <span className={clsx('h-5 w-5 rounded-full', c.swatch)} />
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-ink-muted">Tags</label>
            <div className="flex flex-wrap gap-1.5">
              {TAGS.map((tag) => (
                <button
                  key={tag}
                  onClick={() => toggleFormTag(tag)}
                  className={clsx(
                    'rounded-full px-2.5 py-1 text-xs font-medium transition-colors',
                    formTags.includes(tag) ? 'bg-black text-white' : 'bg-surface-sunken text-ink-secondary hover:bg-black/[0.08]'
                  )}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>
          {formError && <p className="text-xs text-status-critical">{formError}</p>}
          <div className="mt-2 flex gap-2">
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex-1 rounded-lg bg-black px-4 py-2.5 text-sm font-semibold text-white hover:bg-black/85 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving ? 'Saving…' : editing ? 'Save changes' : 'Add event'}
            </button>
            {editing && (
              <button
                onClick={handleDelete}
                className="rounded-lg border border-black/[0.10] px-4 py-2.5 text-sm font-semibold text-status-critical hover:bg-[#fbecec]"
              >
                Remove
              </button>
            )}
          </div>
        </div>
      </Drawer>
    </div>
  )
}

function MonthView({
  currentDate,
  events,
  onEventClick,
  onDayClick,
  onDrop,
  onDragStart,
  onDragEnd,
}: {
  currentDate: Date
  events: ClientEvent[]
  onEventClick: (event: ClientEvent) => void
  onDayClick: (date: Date) => void
  onDrop: (date: Date) => void
  onDragStart: (event: ClientEvent) => void
  onDragEnd: () => void
}) {
  const firstOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1)
  const startDate = new Date(firstOfMonth)
  startDate.setDate(startDate.getDate() - ((startDate.getDay() + 6) % 7)) // Monday-first

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
              <div className="flex flex-col gap-1" onClick={(e) => e.stopPropagation()}>
                {dayEvents.slice(0, 3).map((event) => (
                  <EventCard
                    key={event.id}
                    event={event}
                    variant="compact"
                    onClick={() => onEventClick(event)}
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
  const hours = Array.from({ length: 15 }, (_, i) => i + 7) // 7am–9pm

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
            <EventCard key={event.id} event={event} variant="detailed" onClick={() => onEventClick(event)} onDragStart={() => onDragStart(event)} onDragEnd={onDragEnd} />
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
                  <EventCard key={event.id} event={event} variant="detailed" onClick={() => onEventClick(event)} onDragStart={() => onDragStart(event)} onDragEnd={onDragEnd} />
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
        No events match your filters.
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
              <EventCard key={event.id} event={event} variant="detailed" onClick={() => onEventClick(event)} onDragStart={() => {}} onDragEnd={() => {}} />
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
