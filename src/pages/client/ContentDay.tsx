import { useRef, useState } from 'react'
import type { DragEvent, MouseEvent } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import { ArrowLeft, Film, Plus, Trash2, Upload, X } from 'lucide-react'
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
import type { ClientEvent, ContentEventType, ReelDuration } from '@/types'

const CONTENT_TYPE_OPTIONS: ContentEventType[] = ['shoot_day', 'reel', 'static', 'story', 'carousel']
const REEL_DURATION_OPTIONS: ReelDuration[] = ['0_5', '5_10', '10_20', '20_plus']
const MAX_FILE_BYTES = 15 * 1024 * 1024

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onerror = () => reject(reader.error ?? new Error('Could not read file'))
    reader.onload = () => resolve(typeof reader.result === 'string' ? reader.result : '')
    reader.readAsDataURL(file)
  })
}

// Portrait drop zone for a single PNG, JPG or MP4 per task — click to browse
// (the OS decides which folder it opens to) or drag a file straight in.
function ContentFileBox({ clientId, event }: { clientId: string; event: ClientEvent }) {
  const { updateClientEventFile } = useApp()
  const { isClientView } = useViewMode()
  const [isDraggingOver, setIsDraggingOver] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleFile = async (file: File | undefined) => {
    if (!file) return
    const isPng = file.type === 'image/png' || file.name.toLowerCase().endsWith('.png')
    const isJpg = file.type === 'image/jpeg' || /\.jpe?g$/i.test(file.name)
    const isMp4 = file.type === 'video/mp4' || file.name.toLowerCase().endsWith('.mp4')
    if (!isPng && !isJpg && !isMp4) {
      setError('Only PNG, JPG or MP4 files are supported.')
      return
    }
    if (file.size > MAX_FILE_BYTES) {
      setError('That file is too large — keep it under 15MB.')
      return
    }
    setError(null)
    const fileUrl = await readFileAsDataUrl(file)
    const fileKind = isPng ? 'png' : isJpg ? 'jpg' : 'mp4'
    updateClientEventFile(clientId, event.id, { fileUrl, fileName: file.name, fileKind })
  }

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDraggingOver(false)
    if (isClientView) return
    handleFile(e.dataTransfer.files[0])
  }

  const handleRemove = (e: MouseEvent) => {
    e.stopPropagation()
    updateClientEventFile(clientId, event.id, { fileUrl: undefined, fileName: undefined, fileKind: undefined })
  }

  if (event.fileUrl) {
    return (
      <div className="relative aspect-[3/4] w-full overflow-hidden rounded-xl border border-black/[0.06] bg-black shadow-card">
        {event.fileKind === 'mp4' ? (
          <video src={event.fileUrl} controls className="h-full w-full object-contain" />
        ) : (
          <img src={event.fileUrl} alt={event.fileName ?? ''} className="h-full w-full object-contain" />
        )}
        {!isClientView && (
          <button
            onClick={handleRemove}
            className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-black/60 text-white hover:bg-black/80"
            aria-label="Remove file"
          >
            <X size={14} />
          </button>
        )}
        {event.fileName && (
          <p className="absolute inset-x-0 bottom-0 truncate bg-black/60 px-2.5 py-1.5 text-xs text-white">
            {event.fileName}
          </p>
        )}
      </div>
    )
  }

  if (isClientView) return null

  return (
    <div className="flex flex-col gap-1.5">
      <div
        role="button"
        tabIndex={0}
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) => e.key === 'Enter' && inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault()
          setIsDraggingOver(true)
        }}
        onDragLeave={() => setIsDraggingOver(false)}
        onDrop={handleDrop}
        className={`flex aspect-[3/4] w-full cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed p-4 text-center transition-colors ${
          isDraggingOver ? 'border-brand-500 bg-brand-50' : 'border-black/[0.12] bg-white/60 hover:bg-surface-sunken'
        }`}
      >
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-surface-sunken text-ink-secondary">
          {isDraggingOver ? <Upload size={18} /> : <Film size={18} />}
        </div>
        <p className="text-sm font-semibold text-ink-primary">PNG, JPG &amp; MP4</p>
        <p className="text-xs text-ink-muted">Click to upload or drag and drop</p>
        <input
          ref={inputRef}
          type="file"
          accept="image/png,image/jpeg,video/mp4,.png,.jpg,.jpeg,.mp4"
          onChange={(e) => handleFile(e.target.files?.[0])}
          className="hidden"
        />
      </div>
      {error && <p className="text-xs text-status-critical">{error}</p>}
    </div>
  )
}

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

        {/* Right: attach a PNG or MP4 per task */}
        <div className="flex flex-col gap-4">
          {dayEvents.map((event) => (
            <ContentFileBox key={event.id} clientId={client.id} event={event} />
          ))}
        </div>
      </div>
    </div>
  )
}
