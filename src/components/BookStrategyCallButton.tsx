import { useEffect, useRef, useState } from 'react'
import { Calendar, ExternalLink } from 'lucide-react'

const CALENDLY_URL = 'https://calendly.com/niallpenn19/30min'

export default function BookStrategyCallButton() {
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const handleClickOutside = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [open])

  return (
    <div ref={rootRef} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1.5 rounded-lg bg-brand-500 px-3.5 py-2 text-sm font-semibold text-white hover:bg-brand-600"
      >
        <Calendar size={14} />
        Book strategy call
      </button>
      {open && (
        <div className="absolute right-0 top-full z-10 mt-1.5 w-64 overflow-hidden rounded-lg border border-black/[0.08] bg-white shadow-pop">
          <a
            href={CALENDLY_URL}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => setOpen(false)}
            className="flex items-center justify-between gap-2 px-3.5 py-3 text-sm font-medium text-ink-primary hover:bg-surface-sunken"
          >
            <span className="truncate">calendly.com/niallpenn19/30min</span>
            <ExternalLink size={13} className="shrink-0 text-ink-muted" />
          </a>
        </div>
      )}
    </div>
  )
}
