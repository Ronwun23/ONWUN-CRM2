import * as RadixSelect from '@radix-ui/react-select'
import { Check, ChevronDown } from 'lucide-react'
import clsx from 'clsx'

/**
 * A custom-rendered select (Radix UI), not the OS-native <select> — avoids
 * the native picker's inconsistent behavior inside scrollable containers
 * (notably Safari, where a <select> nested in an overflow-auto drawer can
 * fail to commit the chosen option).
 */
export interface SelectOption {
  value: string
  label: string
}

export function Select({
  value,
  onChange,
  options,
  placeholder = 'Select…',
  className,
}: {
  value: string
  onChange: (value: string) => void
  options: SelectOption[]
  placeholder?: string
  className?: string
}) {
  const selected = options.find((o) => o.value === value)

  return (
    <RadixSelect.Root value={value} onValueChange={onChange}>
      <RadixSelect.Trigger
        className={clsx(
          'flex w-full items-center justify-between gap-2 rounded-lg border border-black/[0.10] px-3 py-2 text-left text-sm',
          'focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 data-[placeholder]:text-ink-muted',
          className
        )}
      >
        <RadixSelect.Value placeholder={placeholder}>{selected?.label}</RadixSelect.Value>
        <RadixSelect.Icon>
          <ChevronDown size={14} className="shrink-0 text-ink-muted" />
        </RadixSelect.Icon>
      </RadixSelect.Trigger>
      <RadixSelect.Portal>
        <RadixSelect.Content
          position="popper"
          sideOffset={6}
          className="z-50 max-h-64 w-[var(--radix-select-trigger-width)] overflow-hidden rounded-xl border border-black/[0.08] bg-white p-1 shadow-pop"
        >
          <RadixSelect.Viewport>
            {options.map((o) => (
              <RadixSelect.Item
                key={o.value}
                value={o.value}
                className="flex cursor-pointer items-center justify-between rounded-lg px-3 py-2 text-sm text-ink-primary outline-none data-[highlighted]:bg-surface-sunken data-[state=checked]:font-medium"
              >
                <RadixSelect.ItemText>{o.label}</RadixSelect.ItemText>
                <RadixSelect.ItemIndicator>
                  <Check size={14} className="text-brand-600" />
                </RadixSelect.ItemIndicator>
              </RadixSelect.Item>
            ))}
          </RadixSelect.Viewport>
        </RadixSelect.Content>
      </RadixSelect.Portal>
    </RadixSelect.Root>
  )
}
