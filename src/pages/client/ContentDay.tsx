import { useState } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import { ArrowLeft, Plus, StickyNote, Trash2 } from 'lucide-react'
import { useClientOutlet } from '@/lib/useClient'
import { useApp } from '@/context/AppContext'
import { TimePicker } from '@/components/ui/time-picker'
import { isCivilDate, parseCivilDate } from '@/lib/civilDate'
import { format, parse } from 'date-fns'

function formatEventTime(time: string): string {
  return format(parse(time, 'HH:mm', new Date()), 'h:mm a')
}

export default function ClientContentDay() {
  const client = useClientOutlet()
  const { date } = useParams<{ date: string }>()
  const { addClientEvent, removeClientEvent, updateClientEventNotes } = useApp()
  const [title, setTitle] = useState('')
  const [time, setTime] = useState('')
  const [notesDraft, setNotesDraft] = useState<Record<string, string>>({})

  if (!date || !isCivilDate(date)) return <Navigate to={`/clients/${client.id}/content-calendar`} replace />

  const dayEvents = client.events
    .filter((e) => e.date === date)
    .sort((a, b) => (a.time ?? '').localeCompare(b.time ?? ''))

  const handleAdd = () => {
    if (!title.trim()) return
    addClientEvent(client.id, {
      id: `content-event-${Date.now()}`,
      title: title.trim(),
      date,
      time: time || undefined,
    })
    setTitle('')
    setTime('')
  }

  const handleRemove = (eventId: string, name: string) => {
    if (!window.confirm(`Remove "${name}" from this day?`)) return
    removeClientEvent(client.id, eventId)
  }

  const handleSaveNotes = (eventId: string) => {
    const text = notesDraft[eventId] ?? ''
    updateClientEventNotes(client.id, eventId, text.trim())
  }

  return (
    <div className="flex flex-col gap-4">
      <Link
        to={`/clients/${client.id}/content-calendar`}
        className="flex w-fit items-center gap-1.5 text-xs font-medium text-ink-muted hover:text-ink-primary"
      >
        <ArrowLeft size={13} />
        Content calendar
      </Link>

      <div>
        <h1 className="text-xl font-semibold text-ink-primary">
          {format(parseCivilDate(date), 'EEEE, MMMM d, yyyy')}
        </h1>
        <p className="text-sm text-ink-secondary">
          {dayEvents.length === 0 ? 'Nothing scheduled yet' : `${dayEvents.length} scheduled`} for {client.name}
        </p>
      </div>

      <ul className="flex flex-col gap-3">
        {dayEvents.map((event) => (
          <li key={event.id} className="rounded-xl border border-black/[0.06] bg-white p-4 shadow-card">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm font-semibold text-ink-primary">{event.title}</p>
                {event.time && <p className="text-xs text-ink-muted">{formatEventTime(event.time)}</p>}
              </div>
              <button
                onClick={() => handleRemove(event.id, event.title)}
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-ink-muted hover:bg-[#fbecec] hover:text-status-critical"
                aria-label="Remove"
              >
                <Trash2 size={14} />
              </button>
            </div>

            <div className="mt-3 flex items-start gap-2 border-t border-black/[0.06] pt-3">
              <StickyNote size={14} className="mt-2 shrink-0 text-ink-muted" />
              <textarea
                value={notesDraft[event.id] ?? event.notes ?? ''}
                onChange={(e) => setNotesDraft((prev) => ({ ...prev, [event.id]: e.target.value }))}
                onBlur={() => handleSaveNotes(event.id)}
                placeholder="Caption, links, brief — anything the team needs…"
                rows={2}
                className="max-h-40 flex-1 resize-none rounded-lg border border-black/[0.10] px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
              />
            </div>
          </li>
        ))}
      </ul>

      <div className="rounded-xl border border-black/[0.06] bg-white p-4 shadow-card">
        <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-ink-muted">Add to this day</p>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="flex-1">
            <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-ink-muted">Title</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Instagram reel — behind the scenes"
              className="w-full rounded-lg border border-black/[0.10] px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
              autoComplete="off"
              data-1p-ignore
              data-lpignore="true"
            />
          </div>
          <div className="sm:w-40">
            <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-ink-muted">
              Time <span className="normal-case text-ink-muted/70">(optional)</span>
            </label>
            <TimePicker value={time} onChange={setTime} />
          </div>
          <button
            onClick={handleAdd}
            disabled={!title.trim()}
            className="flex items-center justify-center gap-1.5 rounded-lg bg-brand-500 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Plus size={14} />
            Add
          </button>
        </div>
      </div>
    </div>
  )
}
