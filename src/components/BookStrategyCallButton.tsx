import { useEffect, useState } from 'react'
import { Calendar } from 'lucide-react'
import { toastManager } from '@/components/ui/toast'

const CALENDLY_URL = 'https://calendly.com/niallpenn19/30min'

declare global {
  interface Window {
    Calendly?: {
      initPopupWidget: (options: { url: string }) => void
    }
  }
}

// Calendly's popup widget script — loaded once, on demand, the first time
// someone actually clicks the button, not up front on every page load.
let widgetPromise: Promise<void> | null = null

function loadCalendlyWidget(): Promise<void> {
  if (window.Calendly) return Promise.resolve()
  if (widgetPromise) return widgetPromise
  widgetPromise = new Promise((resolve, reject) => {
    if (!document.querySelector('link[data-calendly-widget-css]')) {
      const link = document.createElement('link')
      link.rel = 'stylesheet'
      link.href = 'https://assets.calendly.com/assets/external/widget.css'
      link.setAttribute('data-calendly-widget-css', 'true')
      document.head.appendChild(link)
    }
    const script = document.createElement('script')
    script.src = 'https://assets.calendly.com/assets/external/widget.js'
    script.async = true
    script.onload = () => resolve()
    script.onerror = () => {
      widgetPromise = null
      reject(new Error('Could not load Calendly'))
    }
    document.body.appendChild(script)
  })
  return widgetPromise
}

export default function BookStrategyCallButton() {
  const [loading, setLoading] = useState(false)

  // Calendly posts a message to the window the instant someone finishes
  // booking inside the popup — sync right then instead of waiting for the
  // once-a-day automatic check or a manual "Sync now" in Settings.
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.origin !== 'https://calendly.com') return
      if (event.data?.event !== 'calendly.event_scheduled') return
      fetch('/api/calendly-sync', { method: 'POST' })
        .then((res) => {
          if (!res.ok) throw new Error('sync failed')
          toastManager.add({
            type: 'success',
            title: 'Call booked',
            description: 'Added to the studio calendar.',
            timeout: 5000,
          })
        })
        .catch(() => {
          toastManager.add({
            type: 'warning',
            title: 'Call booked',
            description: "Couldn't sync it automatically — use Sync now in Settings.",
            timeout: 6000,
          })
        })
    }
    window.addEventListener('message', handleMessage)
    return () => window.removeEventListener('message', handleMessage)
  }, [])

  const handleClick = async () => {
    setLoading(true)
    try {
      await loadCalendlyWidget()
      window.Calendly?.initPopupWidget({ url: CALENDLY_URL })
    } catch {
      // Widget script failed to load (offline, ad-blocker, etc.) — fall
      // back to the plain link so booking still works either way.
      window.open(CALENDLY_URL, '_blank', 'noopener,noreferrer')
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className="flex items-center gap-1.5 rounded-lg bg-brand-500 px-3.5 py-2 text-sm font-semibold text-white hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-60"
    >
      <Calendar size={14} />
      {loading ? 'Loading…' : 'Book strategy call'}
    </button>
  )
}
