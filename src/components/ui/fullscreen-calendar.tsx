import * as React from 'react'
import {
  add,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  getDay,
  isEqual,
  isSameDay,
  isSameMonth,
  isToday,
  parse,
  startOfToday,
  startOfWeek,
} from 'date-fns'
import { ChevronLeftIcon, ChevronRightIcon, PlusCircleIcon, SearchIcon, StickyNoteIcon, XIcon } from 'lucide-react'

import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { useMediaQuery } from '@/hooks/use-media-query'

export interface CalendarEvent {
  id: string
  name: string
  time?: string
  notes?: string
}

export interface CalendarData {
  day: Date
  events: CalendarEvent[]
}

interface FullScreenCalendarProps {
  data: CalendarData[]
  /** Called with the day currently selected in the calendar when "New Event" is clicked. */
  onNewEvent?: (day: Date) => void
  /** Called when the small "x" on an event card is clicked, to remove it. */
  onRemoveEvent?: (event: CalendarEvent) => void
  /** Called when an event card is double-clicked, to open/edit its notes. */
  onOpenNotes?: (event: CalendarEvent) => void
}

const colStartClasses = ['', 'col-start-2', 'col-start-3', 'col-start-4', 'col-start-5', 'col-start-6', 'col-start-7']

export function FullScreenCalendar({ data, onNewEvent, onRemoveEvent, onOpenNotes }: FullScreenCalendarProps) {
  const today = startOfToday()
  const [selectedDay, setSelectedDay] = React.useState(today)
  const [currentMonth, setCurrentMonth] = React.useState(format(today, 'MMM-yyyy'))
  const firstDayCurrentMonth = parse(currentMonth, 'MMM-yyyy', new Date())
  const isDesktop = useMediaQuery('(min-width: 768px)')
  // The event whose "remove" x is currently revealed — a click on an event
  // card arms it, a second click elsewhere (or on the x) dismisses it.
  const [armedEventId, setArmedEventId] = React.useState<string | null>(null)

  const days = eachDayOfInterval({
    start: startOfWeek(firstDayCurrentMonth),
    end: endOfWeek(endOfMonth(firstDayCurrentMonth)),
  })

  function previousMonth() {
    const firstDayNextMonth = add(firstDayCurrentMonth, { months: -1 })
    setCurrentMonth(format(firstDayNextMonth, 'MMM-yyyy'))
  }

  function nextMonth() {
    const firstDayNextMonth = add(firstDayCurrentMonth, { months: 1 })
    setCurrentMonth(format(firstDayNextMonth, 'MMM-yyyy'))
  }

  function goToToday() {
    setCurrentMonth(format(today, 'MMM-yyyy'))
  }

  return (
    <div className="flex flex-1 flex-col">
      {/* Calendar Header */}
      <div className="flex flex-col space-y-4 p-4 md:flex-row md:items-center md:justify-between md:space-y-0 lg:flex-none">
        <div className="flex flex-auto">
          <div className="flex items-center gap-4">
            <div className="hidden w-20 flex-col items-center justify-center rounded-lg border border-black/[0.08] bg-surface-sunken p-0.5 md:flex">
              <h1 className="p-1 text-xs uppercase text-ink-muted">{format(today, 'MMM')}</h1>
              <div className="flex w-full items-center justify-center rounded-lg border border-black/[0.08] bg-white p-0.5 text-lg font-bold text-ink-primary">
                <span>{format(today, 'd')}</span>
              </div>
            </div>
            <div className="flex flex-col">
              <h2 className="text-lg font-semibold text-ink-primary">{format(firstDayCurrentMonth, 'MMMM, yyyy')}</h2>
              <p className="text-sm text-ink-muted">
                {format(firstDayCurrentMonth, 'MMM d, yyyy')} - {format(endOfMonth(firstDayCurrentMonth), 'MMM d, yyyy')}
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-col items-center gap-4 md:flex-row md:gap-6">
          <Button variant="outline" size="icon" className="hidden lg:flex">
            <SearchIcon size={16} strokeWidth={2} aria-hidden="true" />
          </Button>

          <Separator orientation="vertical" className="hidden h-6 lg:block" />

          <div className="inline-flex w-full -space-x-px rounded-lg shadow-sm shadow-black/5 md:w-auto rtl:space-x-reverse">
            <Button
              onClick={previousMonth}
              className="rounded-none shadow-none first:rounded-s-lg last:rounded-e-lg focus-visible:z-10"
              variant="outline"
              size="icon"
              aria-label="Navigate to previous month"
            >
              <ChevronLeftIcon size={16} strokeWidth={2} aria-hidden="true" />
            </Button>
            <Button
              onClick={goToToday}
              className="w-full rounded-none shadow-none first:rounded-s-lg last:rounded-e-lg focus-visible:z-10 md:w-auto"
              variant="outline"
            >
              Today
            </Button>
            <Button
              onClick={nextMonth}
              className="rounded-none shadow-none first:rounded-s-lg last:rounded-e-lg focus-visible:z-10"
              variant="outline"
              size="icon"
              aria-label="Navigate to next month"
            >
              <ChevronRightIcon size={16} strokeWidth={2} aria-hidden="true" />
            </Button>
          </div>

          <Separator orientation="vertical" className="hidden h-6 md:block" />
          <Separator orientation="horizontal" className="block w-full md:hidden" />

          <Button className="w-full gap-2 md:w-auto" onClick={() => onNewEvent?.(selectedDay)}>
            <PlusCircleIcon size={16} strokeWidth={2} aria-hidden="true" />
            <span>New Event</span>
          </Button>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="lg:flex lg:flex-auto lg:flex-col">
        {/* Week Days Header */}
        <div className="grid grid-cols-7 border border-black/[0.08] text-center text-xs font-semibold leading-6 text-ink-secondary lg:flex-none">
          <div className="border-r border-black/[0.08] py-2.5">Sun</div>
          <div className="border-r border-black/[0.08] py-2.5">Mon</div>
          <div className="border-r border-black/[0.08] py-2.5">Tue</div>
          <div className="border-r border-black/[0.08] py-2.5">Wed</div>
          <div className="border-r border-black/[0.08] py-2.5">Thu</div>
          <div className="border-r border-black/[0.08] py-2.5">Fri</div>
          <div className="py-2.5">Sat</div>
        </div>

        {/* Calendar Days */}
        <div className="flex text-xs leading-6 lg:flex-auto">
          <div className="hidden w-full border-x border-black/[0.08] lg:grid lg:grid-cols-7 lg:grid-rows-5">
            {days.map((day, dayIdx) =>
              !isDesktop ? (
                <button
                  onClick={() => {
                    setSelectedDay(day)
                    setArmedEventId(null)
                  }}
                  key={dayIdx}
                  type="button"
                  className={cn(
                    isEqual(day, selectedDay) && 'text-white',
                    !isEqual(day, selectedDay) && !isToday(day) && isSameMonth(day, firstDayCurrentMonth) && 'text-ink-primary',
                    !isEqual(day, selectedDay) &&
                      !isToday(day) &&
                      !isSameMonth(day, firstDayCurrentMonth) &&
                      'text-ink-muted',
                    (isEqual(day, selectedDay) || isToday(day)) && 'font-semibold',
                    'flex h-14 flex-col border-b border-r border-black/[0.08] px-3 py-2 hover:bg-surface-sunken focus:z-10'
                  )}
                >
                  <time
                    dateTime={format(day, 'yyyy-MM-dd')}
                    className={cn(
                      'ml-auto flex size-6 items-center justify-center rounded-full',
                      isEqual(day, selectedDay) && isToday(day) && 'bg-brand-500 text-white',
                      isEqual(day, selectedDay) && !isToday(day) && 'bg-brand-500 text-white'
                    )}
                  >
                    {format(day, 'd')}
                  </time>
                  {data.filter((date) => isSameDay(date.day, day)).length > 0 && (
                    <div>
                      {data
                        .filter((date) => isSameDay(date.day, day))
                        .map((date) => (
                          <div key={date.day.toString()} className="-mx-0.5 mt-auto flex flex-wrap-reverse">
                            {date.events.map((event) => (
                              <span key={event.id} className="mx-0.5 mt-1 h-1.5 w-1.5 rounded-full bg-ink-muted" />
                            ))}
                          </div>
                        ))}
                    </div>
                  )}
                </button>
              ) : (
                <div
                  key={dayIdx}
                  onClick={() => {
                    setSelectedDay(day)
                    setArmedEventId(null)
                  }}
                  className={cn(
                    dayIdx === 0 && colStartClasses[getDay(day)],
                    !isEqual(day, selectedDay) &&
                      !isToday(day) &&
                      !isSameMonth(day, firstDayCurrentMonth) &&
                      'bg-surface-sunken/50 text-ink-muted',
                    'relative flex flex-col border-b border-r border-black/[0.08] hover:bg-surface-sunken',
                    !isEqual(day, selectedDay) && 'hover:bg-surface-sunken/75'
                  )}
                >
                  <header className="flex items-center justify-between p-2.5">
                    <button
                      type="button"
                      className={cn(
                        isEqual(day, selectedDay) && 'text-white',
                        !isEqual(day, selectedDay) &&
                          !isToday(day) &&
                          isSameMonth(day, firstDayCurrentMonth) &&
                          'text-ink-primary',
                        !isEqual(day, selectedDay) &&
                          !isToday(day) &&
                          !isSameMonth(day, firstDayCurrentMonth) &&
                          'text-ink-muted',
                        isEqual(day, selectedDay) && isToday(day) && 'border-none bg-brand-500',
                        isEqual(day, selectedDay) && !isToday(day) && 'bg-ink-primary',
                        (isEqual(day, selectedDay) || isToday(day)) && 'font-semibold',
                        'flex h-7 w-7 items-center justify-center rounded-full text-xs hover:border'
                      )}
                    >
                      <time dateTime={format(day, 'yyyy-MM-dd')}>{format(day, 'd')}</time>
                    </button>
                  </header>
                  <div className="flex-1 p-2.5">
                    {data
                      .filter((event) => isSameDay(event.day, day))
                      .map((day) => (
                        <div key={day.day.toString()} className="space-y-1.5">
                          {day.events.slice(0, 1).map((event) => (
                            <div key={event.id} className="relative">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  setArmedEventId((current) => (current === event.id ? null : event.id))
                                }}
                                onDoubleClick={(e) => {
                                  e.stopPropagation()
                                  setArmedEventId(null)
                                  onOpenNotes?.(event)
                                }}
                                className="flex w-full flex-col items-start gap-1 rounded-lg border border-black/[0.08] bg-surface-sunken/60 p-2 text-left text-xs leading-tight hover:bg-surface-sunken"
                              >
                                <div className="flex w-full items-center gap-1">
                                  <p className="flex-1 truncate font-medium leading-none text-ink-primary">{event.name}</p>
                                  {event.notes && (
                                    <StickyNoteIcon size={11} className="shrink-0 text-ink-muted" aria-label="Has notes" />
                                  )}
                                </div>
                                {event.time && <p className="leading-none text-ink-muted">{event.time}</p>}
                              </button>
                              {armedEventId === event.id && (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    setArmedEventId(null)
                                    onRemoveEvent?.(event)
                                  }}
                                  className="absolute -right-1.5 -top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-status-critical text-white shadow-sm hover:bg-status-critical/90"
                                  aria-label={`Remove ${event.name}`}
                                >
                                  <XIcon size={10} strokeWidth={3} />
                                </button>
                              )}
                            </div>
                          ))}
                          {day.events.length > 1 && (
                            <div className="text-xs text-ink-muted">+ {day.events.length - 1} more</div>
                          )}
                        </div>
                      ))}
                  </div>
                </div>
              )
            )}
          </div>

          <div className="isolate grid w-full grid-cols-7 grid-rows-5 border-x border-black/[0.08] lg:hidden">
            {days.map((day, dayIdx) => (
              <button
                onClick={() => {
                  setSelectedDay(day)
                  setArmedEventId(null)
                }}
                key={dayIdx}
                type="button"
                className={cn(
                  isEqual(day, selectedDay) && 'text-white',
                  !isEqual(day, selectedDay) && !isToday(day) && isSameMonth(day, firstDayCurrentMonth) && 'text-ink-primary',
                  !isEqual(day, selectedDay) &&
                    !isToday(day) &&
                    !isSameMonth(day, firstDayCurrentMonth) &&
                    'text-ink-muted',
                  (isEqual(day, selectedDay) || isToday(day)) && 'font-semibold',
                  'flex h-14 flex-col border-b border-r border-black/[0.08] px-3 py-2 hover:bg-surface-sunken focus:z-10'
                )}
              >
                <time
                  dateTime={format(day, 'yyyy-MM-dd')}
                  className={cn(
                    'ml-auto flex size-6 items-center justify-center rounded-full',
                    isEqual(day, selectedDay) && isToday(day) && 'bg-brand-500 text-white',
                    isEqual(day, selectedDay) && !isToday(day) && 'bg-brand-500 text-white'
                  )}
                >
                  {format(day, 'd')}
                </time>
                {data.filter((date) => isSameDay(date.day, day)).length > 0 && (
                  <div>
                    {data
                      .filter((date) => isSameDay(date.day, day))
                      .map((date) => (
                        <div key={date.day.toString()} className="-mx-0.5 mt-auto flex flex-wrap-reverse">
                          {date.events.map((event) => (
                            <span key={event.id} className="mx-0.5 mt-1 h-1.5 w-1.5 rounded-full bg-ink-muted" />
                          ))}
                        </div>
                      ))}
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
