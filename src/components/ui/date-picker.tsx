import { useState } from 'react'
import { CalendarDays } from 'lucide-react'
import clsx from 'clsx'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Calendar } from '@/components/ui/calendar'
import { formatCivilDate, parseCivilDate } from '@/lib/civilDate'
import { formatDate } from '@/lib/format'

/**
 * A single-date field: button trigger + calendar popover, values in and out
 * are always civil "yyyy-mm-dd" strings (see lib/civilDate) so callers never
 * touch a Date object or risk the UTC-parse day-shift bug.
 */
export function DatePicker({
  value,
  onChange,
  placeholder = 'Pick a date',
  className,
}: {
  value?: string
  onChange: (value: string | undefined) => void
  placeholder?: string
  className?: string
}) {
  const [open, setOpen] = useState(false)
  const selected = value ? parseCivilDate(value) : undefined

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={clsx(
            'flex w-full items-center gap-2 rounded-lg border border-black/[0.10] px-3 py-2 text-left text-sm transition-colors',
            'focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500',
            value ? 'text-ink-primary' : 'text-ink-muted',
            className
          )}
        >
          <CalendarDays size={15} className="shrink-0 text-ink-muted" />
          {value ? formatDate(value) : placeholder}
        </button>
      </PopoverTrigger>
      <PopoverContent>
        <Calendar
          mode="single"
          selected={selected}
          defaultMonth={selected}
          onSelect={(date) => {
            onChange(date ? formatCivilDate(date) : undefined)
            setOpen(false)
          }}
        />
      </PopoverContent>
    </Popover>
  )
}
