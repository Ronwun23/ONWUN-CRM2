import { DayPicker } from 'react-day-picker'
import type { DayPickerSingleProps, DayPickerRangeProps } from 'react-day-picker'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import clsx from 'clsx'

// UK-based studio — weeks read Monday-first (ISO 8601), matching the
// locale this app is actually used in, rather than the US Sunday-first
// default react-day-picker ships with.
export type CalendarProps = (DayPickerSingleProps | DayPickerRangeProps) & { className?: string }

export function Calendar({ className, classNames, ...props }: CalendarProps) {
  return (
    <DayPicker
      ISOWeek
      showOutsideDays
      className={clsx('p-1', className)}
      classNames={{
        months: 'flex flex-col',
        month: 'space-y-3',
        caption: 'flex items-center justify-between px-1',
        caption_label: 'text-sm font-semibold text-ink-primary',
        nav: 'flex items-center gap-1',
        nav_button:
          'flex h-7 w-7 items-center justify-center rounded-md text-ink-secondary hover:bg-surface-sunken disabled:opacity-30',
        nav_button_previous: '',
        nav_button_next: '',
        table: 'w-full border-collapse',
        head_row: 'flex',
        head_cell: 'w-9 text-center text-[11px] font-medium uppercase text-ink-muted',
        row: 'flex w-full',
        cell: 'relative p-0 text-center',
        day: 'flex h-9 w-9 items-center justify-center rounded-lg text-sm font-medium text-ink-primary transition-colors hover:bg-surface-sunken',
        day_selected: 'bg-brand-500 text-white hover:bg-brand-600',
        day_today: 'font-bold text-brand-600',
        day_outside: 'text-ink-muted/50',
        day_disabled: 'text-ink-muted/40 hover:bg-transparent',
        day_range_start: 'bg-brand-500 text-white hover:bg-brand-600',
        day_range_end: 'bg-brand-500 text-white hover:bg-brand-600',
        day_range_middle: 'bg-brand-50 text-brand-700 rounded-none hover:bg-brand-100',
        day_hidden: 'invisible',
        ...classNames,
      }}
      components={{
        IconLeft: () => <ChevronLeft size={15} />,
        IconRight: () => <ChevronRight size={15} />,
      }}
      {...props}
    />
  )
}
