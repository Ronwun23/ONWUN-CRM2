import clsx from 'clsx'

// Indeterminate progress indicator — for waits with no measurable remaining
// work (an auth check, a network round trip with no byte-length to track).
// role="status" + a visually-hidden label, per the same pattern as a native
// spinner: the spin itself is decorative, the accessible name is the text.
export default function Spinner({
  size = 16,
  label = 'Loading',
  className,
}: {
  size?: number
  label?: string
  className?: string
}) {
  return (
    <span role="status" className={clsx('inline-flex shrink-0', className)}>
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className="animate-spin" aria-hidden="true">
        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" className="opacity-20" />
        <path d="M22 12a10 10 0 0 0-10-10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
      </svg>
      <span className="sr-only">{label}</span>
    </span>
  )
}
