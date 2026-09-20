import { useState } from 'react'
import { Send } from 'lucide-react'
import { useClientOutlet } from '@/lib/useClient'
import { useApp } from '@/context/AppContext'
import { useViewMode } from '@/context/ViewModeContext'
import { CURRENT_USER } from '@/data/team'
import Card from '@/components/Card'
import { formatRelativeDate } from '@/lib/format'

export default function ClientUpdates() {
  const client = useClientOutlet()
  const { addUpdate } = useApp()
  const { isClientView } = useViewMode()
  const [text, setText] = useState('')

  const handlePost = () => {
    if (!text.trim()) return
    addUpdate(client.id, {
      id: `update-${Date.now()}`,
      text: text.trim(),
      date: new Date().toISOString(),
      author: CURRENT_USER.name,
    })
    setText('')
  }

  const sorted = [...client.updates].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-semibold text-ink-primary">Updates</h1>

      {!isClientView && (
        <Card>
          <div className="flex gap-2">
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Post an update for this project…"
              rows={2}
              className="flex-1 resize-none rounded-lg border border-black/[0.10] px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
            />
            <button
              onClick={handlePost}
              className="flex h-9 w-9 shrink-0 items-center justify-center self-end rounded-lg bg-brand-500 text-white hover:bg-brand-600"
              aria-label="Post update"
            >
              <Send size={15} />
            </button>
          </div>
        </Card>
      )}

      <ul className="flex flex-col gap-3">
        {sorted.length === 0 && <p className="text-sm text-ink-muted">No updates yet.</p>}
        {sorted.map((update) => (
          <li key={update.id} className="rounded-xl border border-black/[0.06] bg-white p-4 shadow-card">
            <p className="text-sm text-ink-primary">{update.text}</p>
            <p className="mt-1.5 text-xs text-ink-muted">
              {update.author} · {formatRelativeDate(update.date)}
            </p>
          </li>
        ))}
      </ul>
    </div>
  )
}
