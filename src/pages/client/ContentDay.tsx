import { useState } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import { ArrowLeft, Plus, Trash2 } from 'lucide-react'
import { format, parse } from 'date-fns'
import { useClientOutlet } from '@/lib/useClient'
import { useApp } from '@/context/AppContext'
import { useViewMode } from '@/context/ViewModeContext'
import { TimePicker } from '@/components/ui/time-picker'
import { Select } from '@/components/ui/select'
import { confirmAction } from '@/lib/confirm'
import { isCivilDate, parseCivilDate } from '@/lib/civilDate'
import { eventDisplayTitle } from '@/lib/contentEvent'
import { CONTENT_EVENT_TYPE_LABEL, REEL_DURATION_LABEL } from '@/lib/labels'
import type { ContentEventType, ReelDuration } from '@/types'

const CONTENT_TYPE_OPTIONS: ContentEventType[] = ['shoot_day', 'reel', 'static', 'story', 'carousel']
const REEL_DURATION_OPTIONS: ReelDuration[] = ['0_5', '5_10', '10_20', '20_plus']

function formatEventTime(time: string): string {
  return format(parse(time, 'HH:mm', new Date()), 'h:mm a')
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-wide text-ink-muted">{label}</p>
      <p className="mt-0.5 text-sm text-ink-primary">{value}</p>
    </div>
  )
}

export default function ClientContentDay() {
  const client = useClientOutlet()
  const { date } = useParams<{ date: string }>()
  const { addClientEvent, removeClientEvent, updateClientEventNotes } = useApp()
  const { isClientView } = useViewMode()
  const [contentType, setContentType] = useState<ContentEventType | ''>('')
  const [duration, setDuration] = useState<ReelDuration | ''>('')
  const [amount, setAmount] = useState('')
  const [time, setTime] = useState('')
  const [notesDraft, setNotesDraft] = useState<Record<string, string>>({})

  if (!date || !isCivilDate(date)) return <Navigate to={`/clients/${client.id}/content-calendar`} replace />

  const dayEvents = client.events
    .filter((e) => e.date === date)
    .sort((a, b) => (a.time ?? '').localeCompare(b.time ?? ''))

  const handleAdd = () => {
    if (!contentType) return
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
    setTime('')
  }

  const handleRemove = async (eventId: string, name: string) => {
    const confirmed = await confirmAction(`Remove "${name}" from this day?`, { confirmLabel: 'Remove', destructive: true })
    if (confirmed) removeClientEvent(client.id, eventId)
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

      <div className="grid grid-cols-1 gap-4 md:grid-cols-[260px_1fr_1fr] md:items-start">
        {/* Left: key info for whatever's scheduled, plus the add form underneath */}
        <div className="flex flex-col gap-4 rounded-xl border border-black/[0.06] bg-white p-4 shadow-card">
          {dayEvents.map((event, i) => (
            <div key={event.id} className={i > 0 ? 'border-t border-black/[0.06] pt-4' : undefined}>
              <div className="mb-3 flex items-start justify-between gap-2">
                <p className="text-sm font-semibold text-ink-primary">{event.title}</p>
                {!isClientView && (
                  <button
                    onClick={() => handleRemove(event.id, event.title)}
                    className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg text-ink-muted hover:bg-[#fbecec] hover:text-status-critical"
                    aria-label="Remove"
                  >
                    <Trash2 size={13} />
                  </button>
                )}
              </div>
              <div className="flex flex-col gap-3">
                {event.contentType && (
                  <>
                    <InfoRow label="Type" value={CONTENT_EVENT_TYPE_LABEL[event.contentType]} />
                    {event.contentType === 'reel'
                      ? event.duration && <InfoRow label="Duration" value={REEL_DURATION_LABEL[event.duration]} />
                      : event.amount != null && (
                          <InfoRow label="Amount" value={`${event.amount} post${event.amount === 1 ? '' : 's'}`} />
                        )}
                  </>
                )}
                <InfoRow label="Date" value={format(parseCivilDate(date), 'MMM d, yyyy')} />
                {event.time && <InfoRow label="Time" value={formatEventTime(event.time)} />}
              </div>
            </div>
          ))}

          {!isClientView && (
            <div className={dayEvents.length > 0 ? 'border-t border-black/[0.06] pt-4' : undefined}>
              <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-ink-muted">Add to this day</p>
              <div className="flex flex-col gap-3">
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
                    <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-ink-muted">
                      Duration
                    </label>
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
                    <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-ink-muted">
                      Amount
                    </label>
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
                <div>
                  <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-ink-muted">
                    Time <span className="normal-case text-ink-muted/70">(optional)</span>
                  </label>
                  <TimePicker value={time} onChange={setTime} />
                </div>
                <button
                  onClick={handleAdd}
                  disabled={!contentType}
                  className="flex items-center justify-center gap-1.5 rounded-lg bg-brand-500 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <Plus size={14} />
                  Add
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Middle: summary */}
        <div className="flex flex-col gap-4">
          {dayEvents.length === 0 ? (
            <div className="rounded-xl border border-dashed border-black/[0.12] bg-white/60 p-4 text-sm text-ink-muted">
              Add something to this day to start planning it out.
            </div>
          ) : (
            dayEvents.map((event) => (
              <div key={event.id} className="rounded-xl border border-black/[0.06] bg-white p-4 shadow-card">
                <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-ink-muted">Summary</label>
                <textarea
                  value={notesDraft[event.id] ?? event.notes ?? ''}
                  onChange={(e) => setNotesDraft((prev) => ({ ...prev, [event.id]: e.target.value }))}
                  onBlur={() => handleSaveNotes(event.id)}
                  placeholder="Plan the idea for this one — concept, hook, key beats…"
                  rows={10}
                  className="w-full resize-none rounded-lg border border-black/[0.10] px-3 py-2 text-sm leading-relaxed focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                />
              </div>
            ))
          )}
        </div>

        {/* Right: reserved for later */}
        <div />
      </div>
    </div>
  )
}
