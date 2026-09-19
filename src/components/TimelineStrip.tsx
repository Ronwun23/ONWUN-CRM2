import { useEffect, useMemo, useRef, useState } from 'react'
import type { KeyboardEvent } from 'react'
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react'
import type { Client } from '@/types'
import { useApp } from '@/context/AppContext'
import { useViewMode } from '@/context/ViewModeContext'

const DAY_MS = 86400000

function startOfDay(date: Date): Date {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  return d
}

function sameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
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
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => setRangeStart(projectStart), [projectStart])

  const days = useMemo(
    () => Array.from({ length: 7 }, (_, i) => new Date(rangeStart.getTime() + i * DAY_MS)),
    [rangeStart]
  )

  const items = useMemo(() => {
    const taskItems = client.tasks
      .filter((t) => !t.done)
      .map((t) => ({ id: t.id, title: t.title, date: new Date(t.dueDate), tone: 'task' as const }))
    const eventItems = client.events.map((e) => ({ id: e.id, title: e.title, date: new Date(e.date), tone: 'event' as const }))
    return [...taskItems, ...eventItems]
  }, [client])

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
        </div>
      </div>
      <div className="grid grid-cols-7 gap-2">
        {days.map((day) => {
          const dayKey = day.toISOString()
          const dayItems = items.filter((item) => sameDay(item.date, day))
          const isToday = sameDay(day, new Date())
          const isAdding = addingDay === dayKey
          return (
            <div
              key={dayKey}
              className="group flex min-h-[90px] flex-col rounded-lg border border-black/[0.05] bg-surface-sunken/40 p-2"
            >
              <p className={isToday ? 'text-xs font-semibold text-brand-600' : 'text-xs font-medium text-ink-muted'}>
                {day.toLocaleDateString('en-US', { weekday: 'short' })} {day.getDate()}
              </p>
              <div className="mt-1.5 flex flex-col gap-1">
                {dayItems.map((item) => (
                  <div
                    key={item.id}
                    className={
                      item.tone === 'event'
                        ? 'truncate rounded-md bg-brand-100 px-1.5 py-1 text-[11px] font-medium text-brand-700'
                        : 'truncate rounded-md bg-[#fdf1de] px-1.5 py-1 text-[11px] font-medium text-[#96660a]'
                    }
                    title={item.title}
                  >
                    {item.title}
                  </div>
                ))}
              </div>

              {!isClientView &&
                (isAdding ? (
                  <input
                    ref={inputRef}
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    onKeyDown={(e) => handleKeyDown(e, day)}
                    onBlur={() => commitAdd(day)}
                    placeholder="What needs doing…"
                    className="mt-1.5 w-full rounded-md border border-brand-500 bg-white px-1.5 py-1 text-[11px] focus:outline-none"
                  />
                ) : (
                  <button
                    onClick={() => startAdding(dayKey)}
                    className="mt-1.5 flex items-center gap-1 rounded-md px-1.5 py-1 text-[11px] font-medium text-ink-muted opacity-0 transition-opacity hover:bg-white hover:text-ink-secondary group-hover:opacity-100 focus:opacity-100"
                  >
                    <Plus size={11} />
                    Add
                  </button>
                ))}
            </div>
          )
        })}
      </div>
    </div>
  )
}
