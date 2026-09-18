import { useMemo, useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import type { Client } from '@/types'

const DAY_MS = 86400000

function startOfWeek(date: Date): Date {
  const d = new Date(date)
  const day = d.getDay()
  const diff = day === 0 ? -6 : 1 - day // Monday start
  d.setDate(d.getDate() + diff)
  d.setHours(0, 0, 0, 0)
  return d
}

function sameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
}

export default function TimelineStrip({ client }: { client: Client }) {
  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date()))

  const days = useMemo(
    () => Array.from({ length: 7 }, (_, i) => new Date(weekStart.getTime() + i * DAY_MS)),
    [weekStart]
  )

  const items = useMemo(() => {
    const taskItems = client.tasks
      .filter((t) => !t.done)
      .map((t) => ({ id: t.id, title: t.title, date: new Date(t.dueDate), tone: 'task' as const }))
    const eventItems = client.events.map((e) => ({ id: e.id, title: e.title, date: new Date(e.date), tone: 'event' as const }))
    return [...taskItems, ...eventItems]
  }, [client])

  const rangeLabel = `${weekStart.getDate()} ${weekStart.toLocaleDateString('en-US', { month: 'short' })} – ${days[6].getDate()} ${days[6].toLocaleDateString('en-US', { month: 'short' })}`

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <p className="text-xs font-medium text-ink-muted">{rangeLabel}</p>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setWeekStart((d) => new Date(d.getTime() - 7 * DAY_MS))}
            className="flex h-6 w-6 items-center justify-center rounded-md text-ink-muted hover:bg-surface-sunken hover:text-ink-primary"
            aria-label="Previous week"
          >
            <ChevronLeft size={14} />
          </button>
          <button
            onClick={() => setWeekStart((d) => new Date(d.getTime() + 7 * DAY_MS))}
            className="flex h-6 w-6 items-center justify-center rounded-md text-ink-muted hover:bg-surface-sunken hover:text-ink-primary"
            aria-label="Next week"
          >
            <ChevronRight size={14} />
          </button>
        </div>
      </div>
      <div className="grid grid-cols-7 gap-2">
        {days.map((day) => {
          const dayItems = items.filter((item) => sameDay(item.date, day))
          const isToday = sameDay(day, new Date())
          return (
            <div key={day.toISOString()} className="min-h-[90px] rounded-lg border border-black/[0.05] bg-surface-sunken/40 p-2">
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
            </div>
          )
        })}
      </div>
    </div>
  )
}
