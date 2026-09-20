import clsx from 'clsx'
import { Select } from '@/components/ui/select'

/**
 * Three plain dropdowns (hour / minute / AM-PM) instead of a native
 * <input type="time"> — Safari has a long-standing bug where a controlled
 * time input resets mid-keystroke because React reflects every partial
 * value straight back into the field, making it effectively impossible to
 * type a time. Selects sidestep that entirely, same reasoning as why this
 * app doesn't use a native <select> either (see ui/select.tsx).
 *
 * Value in and out is always a 24h "HH:mm" string, or "" for unset.
 */
const HOURS = Array.from({ length: 12 }, (_, i) => String(i + 1))
const MINUTES = ['00', '05', '10', '15', '20', '25', '30', '35', '40', '45', '50', '55']

function to12h(time24: string): { hour: string; minute: string; period: 'AM' | 'PM' } | null {
  if (!time24) return null
  const [h, m] = time24.split(':').map(Number)
  if (Number.isNaN(h) || Number.isNaN(m)) return null
  const period: 'AM' | 'PM' = h >= 12 ? 'PM' : 'AM'
  const hour12 = h % 12 === 0 ? 12 : h % 12
  return { hour: String(hour12), minute: String(m).padStart(2, '0'), period }
}

function to24h(hour: string, minute: string, period: 'AM' | 'PM'): string {
  let h = Number(hour) % 12
  if (period === 'PM') h += 12
  return `${String(h).padStart(2, '0')}:${minute}`
}

export function TimePicker({
  value,
  onChange,
  className,
}: {
  value: string
  onChange: (value: string) => void
  className?: string
}) {
  const parsed = to12h(value)
  const hour = parsed?.hour ?? ''
  const minute = parsed?.minute ?? ''
  const period = parsed?.period ?? 'AM'

  const update = (nextHour: string, nextMinute: string, nextPeriod: 'AM' | 'PM') => {
    onChange(to24h(nextHour, nextMinute, nextPeriod))
  }

  return (
    <div className={clsx('grid grid-cols-[1fr_1fr_74px] gap-1.5', className)}>
      <Select
        value={hour}
        onChange={(h) => update(h, minute || '00', period)}
        options={HOURS.map((h) => ({ value: h, label: h }))}
        placeholder="HH"
      />
      <Select
        value={minute}
        onChange={(m) => update(hour || '12', m, period)}
        options={MINUTES.map((m) => ({ value: m, label: m }))}
        placeholder="MM"
      />
      <Select
        value={hour && minute ? period : ''}
        onChange={(p) => update(hour || '12', minute || '00', p as 'AM' | 'PM')}
        options={[
          { value: 'AM', label: 'AM' },
          { value: 'PM', label: 'PM' },
        ]}
        placeholder="AM"
      />
    </div>
  )
}
