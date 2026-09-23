import clsx from 'clsx'

// Determinate progress indicator — a circular arc that fills from empty to
// complete around a stable track, for waits where remaining work IS known
// (bytes downloaded so far vs. total). Custom indicator per WAI-ARIA: the
// visible percentage and the accessible value (aria-valuenow) are the same
// number, never out of sync.
export default function ProgressRing({
  value,
  size = 40,
  strokeWidth = 3,
  label = 'Loading',
  showValue = true,
  className,
}: {
  value: number
  size?: number
  strokeWidth?: number
  label?: string
  showValue?: boolean
  className?: string
}) {
  const clamped = Math.max(0, Math.min(100, value))
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference * (1 - clamped / 100)

  return (
    <div
      role="progressbar"
      aria-valuenow={Math.round(clamped)}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={label}
      className={clsx('inline-flex flex-col items-center gap-1.5', className)}
    >
      <svg width={size} height={size} className="-rotate-90" aria-hidden="true">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="currentColor" strokeWidth={strokeWidth} className="opacity-20" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-[stroke-dashoffset] duration-150 ease-out"
        />
      </svg>
      {showValue && (
        <span className="text-xs font-medium tabular-nums" aria-hidden="true">
          {Math.round(clamped)}%
        </span>
      )}
    </div>
  )
}
