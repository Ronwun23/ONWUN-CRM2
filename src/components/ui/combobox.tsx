import { useState } from 'react'
import clsx from 'clsx'
import { Popover, PopoverAnchor, PopoverContent } from '@/components/ui/popover'

/**
 * A free-text field with optional suggestions — you can type anything, or
 * pick one of the suggestions to fill it in. Unlike Select, the value is
 * never constrained to the suggestion list.
 */
export function Combobox({
  value,
  onChange,
  suggestions,
  placeholder,
  className,
}: {
  value: string
  onChange: (value: string) => void
  suggestions: string[]
  placeholder?: string
  className?: string
}) {
  const [open, setOpen] = useState(false)
  const filtered = suggestions.filter((s) => s.toLowerCase().includes(value.trim().toLowerCase()))

  return (
    <Popover open={open && filtered.length > 0}>
      <PopoverAnchor asChild>
        <input
          value={value}
          onChange={(e) => {
            onChange(e.target.value)
            setOpen(true)
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 120)}
          placeholder={placeholder}
          autoComplete="off"
          data-1p-ignore
          data-lpignore="true"
          className={clsx(
            'w-full rounded-lg border border-black/[0.10] px-3 py-2 text-sm',
            'focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500',
            className
          )}
        />
      </PopoverAnchor>
      <PopoverContent
        onOpenAutoFocus={(e) => e.preventDefault()}
        className="w-[var(--radix-popover-trigger-width)] p-1"
      >
        {filtered.map((s) => (
          <button
            key={s}
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => {
              onChange(s)
              setOpen(false)
            }}
            className="flex w-full items-center rounded-lg px-3 py-2 text-left text-sm text-ink-primary hover:bg-surface-sunken"
          >
            {s}
          </button>
        ))}
      </PopoverContent>
    </Popover>
  )
}
