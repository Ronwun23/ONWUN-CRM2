import { useEffect, useMemo, useRef, useState } from 'react'
import type { KeyboardEvent } from 'react'
import clsx from 'clsx'
import { ChevronLeft, ChevronRight, Maximize2, Plus } from 'lucide-react'
import type { Client } from '@/types'
import { useApp } from '@/context/AppContext'
import { useViewMode } from '@/context/ViewModeContext'
import Modal from '@/components/Modal'

const DAY_MS = 86400000

function startOfDay(date: Date): Date {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  return d
}

function sameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
}

interface TimelineBar {
  id: string
  title: string
  start: Date
  end: Date
  tone: 'task' | 'event'
}

interface LaidOutBar extends TimelineBar {
  startCol: number // 1-based, inclusive
  endCol: number // 1-based, inclusive
  lane: number
  clippedStart: boolean
  clippedEnd: boolean
}

// Greedy interval scheduling: sorted by start then by length (longest first),
// each bar takes the first lane whose last-placed bar ends before it starts.
function layoutLanes(bars: TimelineBar[], rangeStart: Date, rangeEnd: Date, dayCount: number): LaidOutBar[] {
  const dayIndex = (d: Date) => Math.round((startOfDay(d).getTime() - rangeStart.getTime()) / DAY_MS)
  const lastCol = dayCount - 1

  const visible = bars
    .filter((b) => b.end >= rangeStart && b.start <= rangeEnd)
    .map((b) => ({
      ...b,
      startCol: Math.max(0, dayIndex(b.start)) + 1,
      endCol: Math.min(lastCol, dayIndex(b.end)) + 1,
      clippedStart: b.start < rangeStart,
      clippedEnd: b.end > rangeEnd,
    }))
    .sort((a, b) => a.startCol - b.startCol || b.endCol - b.startCol - (a.endCol - a.startCol))

  const laneEnds: number[] = []
  return visible.map((bar) => {
    let lane = laneEnds.findIndex((end) => end < bar.startCol)
    if (lane === -1) {
      lane = laneEnds.length
      laneEnds.push(bar.endCol)
    } else {
      laneEnds[lane] = bar.endCol
    }
    return { ...bar, lane }
  })
}

// Header + lane-bar grid, shared by the rolling 7-day strip and the
// full-scope expanded view — only the day count and column width differ.
function TimelineGrid({ days, laidOut, dense }: { days: Date[]; laidOut: LaidOutBar[]; dense?: boolean }) {
  const laneCount = Math.max(1, ...laidOut.map((b) => b.lane + 1))
  const columns = dense ? `repeat(${days.length}, minmax(40px, 1fr))` : `repeat(${days.length}, minmax(0, 1fr))`

  return (
    <div className={dense ? 'overflow-x-auto' : undefined}>
      <div style={{ minWidth: dense ? days.length * 40 : undefined }}>
        <div className="grid border-b border-black/[0.06] bg-surface-sunken/40" style={{ gridTemplateColumns: columns }}>
          {days.map((day, i) => {
            const isToday = sameDay(day, new Date())
            const showMonth = dense && (i === 0 || day.getDate() === 1)
            return (
              <div key={day.toISOString()} className="border-r border-black/[0.05] px-2 py-1.5 text-center last:border-r-0">
                {showMonth && <p className="text-[10px] text-ink-muted">{day.toLocaleDateString('en-US', { month: 'short' })}</p>}
                <p className={isToday ? 'text-xs font-semibold text-brand-600' : 'text-xs font-medium text-ink-muted'}>
                  {dense ? day.getDate() : `${day.toLocaleDateString('en-US', { weekday: 'short' })} ${day.getDate()}`}
                </p>
              </div>
            )
          })}
        </div>

        <div
          className="grid gap-y-1 p-1.5"
          style={{ gridTemplateColumns: columns, gridAutoRows: 'minmax(22px, auto)', minHeight: laneCount * 22 + (laneCount - 1) * 4 }}
        >
          {laidOut.map((bar) => (
            <div
              key={bar.id}
              style={{ gridColumn: `${bar.startCol} / ${bar.endCol + 1}`, gridRow: bar.lane + 1 }}
              title={bar.title}
              className={clsx(
                'flex items-center truncate px-1.5 py-1 text-[11px] font-medium',
                bar.tone === 'event' ? 'bg-brand-100 text-brand-700' : 'bg-[#fdf1de] text-[#96660a]',
                bar.clippedStart ? 'rounded-l-none' : 'rounded-l-md',
                bar.clippedEnd ? 'rounded-r-none' : 'rounded-r-md'
              )}
            >
              {bar.title}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default function TimelineStrip({ client }: { client: Client }) {
  const { addTask } = useApp()
  const { isClientView } = useViewMode()
  // The timeline always begins on the client's creation/start date — never earlier — and
  // scrolls forward from there in rolling 7-day windows, for every client, old or new.
  const projectStart = useMemo(() => startOfDay(new Date(client.startDate)), [client.startDate])
  const [rangeStart, setRangeStart] = useState(projectStart)
  const [addingDay, setAddingDay] = useState<string | null>(null)
  const [draft, setDraft] = useState('')
  const [expanded, setExpanded] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => setRangeStart(projectStart), [projectStart])

  const days = useMemo(
    () => Array.from({ length: 7 }, (_, i) => new Date(rangeStart.getTime() + i * DAY_MS)),
    [rangeStart]
  )
  const rangeEnd = days[6]

  const bars = useMemo<TimelineBar[]>(() => {
    const taskBars = client.tasks
      .filter((t) => !t.done)
      .map((t) => {
        const due = startOfDay(new Date(t.dueDate))
        const start = t.startDate ? startOfDay(new Date(t.startDate)) : due
        return { id: t.id, title: t.title, start: start <= due ? start : due, end: due, tone: 'task' as const }
      })
    const eventBars = client.events.map((e) => {
      const day = startOfDay(new Date(e.date))
      return { id: e.id, title: e.title, start: day, end: day, tone: 'event' as const }
    })
    return [...taskBars, ...eventBars]
  }, [client])

  const laidOut = useMemo(() => layoutLanes(bars, rangeStart, rangeEnd, days.length), [bars, rangeStart, rangeEnd, days.length])

  // Full project scope: every day from kickoff to the due date, so the
  // expanded view isn't just a longer rolling window — it's the whole thing.
  const fullDays = useMemo(() => {
    const end = startOfDay(new Date(client.dueDate))
    const totalDays = Math.max(1, Math.round((end.getTime() - projectStart.getTime()) / DAY_MS) + 1)
    return Array.from({ length: totalDays }, (_, i) => new Date(projectStart.getTime() + i * DAY_MS))
  }, [projectStart, client.dueDate])
  const fullLaidOut = useMemo(
    () => layoutLanes(bars, projectStart, fullDays[fullDays.length - 1], fullDays.length),
    [bars, projectStart, fullDays]
  )

  const isAtProjectStart = rangeStart.getTime() <= projectStart.getTime()
  const rangeLabel = `${rangeStart.getDate()} ${rangeStart.toLocaleDateString('en-US', { month: 'short' })} – ${days[6].getDate()} ${days[6].toLocaleDateString('en-US', { month: 'short' })}`

  const startAdding = (dayKey: string) => {
    setAddingDay(dayKey)
    setDraft('')
    requestAnimationFrame(() => inputRef.current?.focus())
  }

  const commitAdd = (day: Date) => {
    const title = draft.trim()
    if (title) {
      addTask(client.id, {
        id: `task-${Date.now()}`,
        title,
        done: false,
        dueDate: day.toISOString(),
        assignee: client.owner,
      })
    }
    setAddingDay(null)
    setDraft('')
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>, day: Date) => {
    if (e.key === 'Enter') commitAdd(day)
    if (e.key === 'Escape') {
      setAddingDay(null)
      setDraft('')
    }
  }

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <p className="text-xs font-medium text-ink-muted">{rangeLabel}</p>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setRangeStart((d) => new Date(Math.max(d.getTime() - 7 * DAY_MS, projectStart.getTime())))}
            disabled={isAtProjectStart}
            className="flex h-6 w-6 items-center justify-center rounded-md text-ink-muted hover:bg-surface-sunken hover:text-ink-primary disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:bg-transparent"
            aria-label="Previous week"
            title={isAtProjectStart ? 'Project start' : 'Previous week'}
          >
            <ChevronLeft size={14} />
          </button>
          <button
            onClick={() => setRangeStart((d) => new Date(d.getTime() + 7 * DAY_MS))}
            className="flex h-6 w-6 items-center justify-center rounded-md text-ink-muted hover:bg-surface-sunken hover:text-ink-primary"
            aria-label="Next week"
          >
            <ChevronRight size={14} />
          </button>
          <span className="mx-1 h-4 w-px bg-black/[0.08]" />
          <button
            onClick={() => setExpanded(true)}
            className="flex h-6 w-6 items-center justify-center rounded-md text-ink-muted hover:bg-surface-sunken hover:text-ink-primary"
            aria-label="Expand full project timeline"
            title="Expand full project timeline"
          >
            <Maximize2 size={13} />
          </button>
        </div>
      </div>

      <div className="overflow-hidden rounded-lg border border-black/[0.06]">
        <TimelineGrid days={days} laidOut={laidOut} />

        {!isClientView && (
          <div className="grid grid-cols-7 border-t border-black/[0.05]">
            {days.map((day) => {
              const dayKey = day.toISOString()
              const isAdding = addingDay === dayKey
              return (
                <div key={dayKey} className="group border-r border-black/[0.05] px-1.5 py-1 last:border-r-0">
                  {isAdding ? (
                    <input
                      ref={inputRef}
                      value={draft}
                      onChange={(e) => setDraft(e.target.value)}
                      onKeyDown={(e) => handleKeyDown(e, day)}
                      onBlur={() => commitAdd(day)}
                      placeholder="What needs doing…"
                      className="w-full rounded-md border border-brand-500 bg-white px-1.5 py-1 text-[11px] focus:outline-none"
                      autoComplete="off"
                      data-1p-ignore
                      data-lpignore="true"
                    />
                  ) : (
                    <button
                      onClick={() => startAdding(dayKey)}
                      className="flex w-full items-center gap-1 rounded-md px-1.5 py-1 text-[11px] font-medium text-ink-muted opacity-0 transition-opacity hover:bg-surface-sunken hover:text-ink-secondary group-hover:opacity-100 focus:opacity-100"
                    >
                      <Plus size={11} />
                      Add
                    </button>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      <Modal
        open={expanded}
        onClose={() => setExpanded(false)}
        title="Project timeline"
        subtitle={`${projectStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – ${fullDays[fullDays.length - 1].toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} · full scope`}
        maxWidthClassName="max-w-5xl"
      >
        <div className="overflow-hidden rounded-lg border border-black/[0.06]">
          <TimelineGrid days={fullDays} laidOut={fullLaidOut} dense />
        </div>
      </Modal>
    </div>
  )
}
