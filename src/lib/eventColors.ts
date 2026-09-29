// Shared with the studio Calendar (src/pages/studio/Calendar.tsx) and Home's
// Today/Upcoming events — one color list so an event picked orange on the
// Calendar shows the same orange everywhere else it appears.
export const EVENT_COLORS = [
  { name: 'Blue', value: 'blue', swatch: 'bg-series-blue', tint: 'bg-series-blue/[0.12]', text: 'text-series-blue' },
  { name: 'Aqua', value: 'aqua', swatch: 'bg-series-aqua', tint: 'bg-series-aqua/[0.12]', text: 'text-series-aqua' },
  { name: 'Violet', value: 'violet', swatch: 'bg-series-violet', tint: 'bg-series-violet/[0.12]', text: 'text-series-violet' },
  { name: 'Orange', value: 'orange', swatch: 'bg-series-orange', tint: 'bg-series-orange/[0.12]', text: 'text-series-orange' },
  { name: 'Magenta', value: 'magenta', swatch: 'bg-series-magenta', tint: 'bg-series-magenta/[0.12]', text: 'text-series-magenta' },
  { name: 'Red', value: 'red', swatch: 'bg-series-red', tint: 'bg-series-red/[0.12]', text: 'text-series-red' },
]

export function colorFor(value: string | undefined) {
  return (
    EVENT_COLORS.find((c) => c.value === value) ?? {
      name: 'Grey',
      value: '',
      swatch: 'bg-ink-muted',
      tint: 'bg-black/[0.05]',
      text: 'text-ink-secondary',
    }
  )
}
