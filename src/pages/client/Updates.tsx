import { useState } from 'react'
import { Link } from 'react-router-dom'
import { FileText, Send, Trash2 } from 'lucide-react'
import { useClientOutlet } from '@/lib/useClient'
import { useApp } from '@/context/AppContext'
import { useViewMode } from '@/context/ViewModeContext'
import Pill from '@/components/Pill'
import { ClientAvatar, MemberAvatar } from '@/components/Avatar'
import { formatRelativeDate } from '@/lib/format'
import { confirmAction } from '@/lib/confirm'

export default function ClientUpdates() {
  const client = useClientOutlet()
  const { addUpdate, removeUpdate, activeAccount } = useApp()
  const { isClientView } = useViewMode()
  const [text, setText] = useState('')

  const handlePost = () => {
    if (!text.trim()) return
    addUpdate(client.id, {
      id: `update-${Date.now()}`,
      text: text.trim(),
      date: new Date().toISOString(),
      author: isClientView ? client.name : activeAccount.name,
      authorType: isClientView ? 'client' : 'agency',
    })
    setText('')
  }

  const sorted = [...client.updates].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-lg font-semibold text-ink-primary">Updates</h1>

      <div className="rounded-xl border border-black/[0.06] bg-white p-3.5 shadow-card">
        <div className="flex gap-2">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={isClientView ? 'Post an update for the team…' : 'Post an update for this project…'}
            rows={2}
            className="flex-1 resize-none rounded-lg border border-black/[0.10] px-3 py-2 text-sm focus:border-black focus:outline-none focus:ring-1 focus:ring-black"
          />
          <button
            onClick={handlePost}
            className="flex h-8 w-8 shrink-0 items-center justify-center self-end rounded-lg bg-black text-white hover:bg-black/85"
            aria-label="Post update"
          >
            <Send size={14} />
          </button>
        </div>
      </div>

      <ul className="flex flex-col gap-2.5">
        {sorted.length === 0 && <p className="text-sm text-ink-muted">No updates yet.</p>}
        {sorted.map((update) => {
          const fromClient = update.authorType === 'client'
          return (
            <li key={update.id} className="flex gap-3 rounded-xl border border-black/[0.06] bg-white p-3.5 shadow-card">
              {fromClient ? (
                <ClientAvatar initials={client.initials} color={client.color} avatarUrl={client.avatarUrl} size={26} />
              ) : (
                <MemberAvatar memberId={update.author} size={26} />
              )}
              <div className="min-w-0 flex-1">
                {update.docId && update.docTitle && (
                  <Link
                    to={`/clients/${client.id}/documents/${update.docId}`}
                    className="mb-1 flex w-fit items-center gap-1 rounded bg-surface-sunken px-1.5 py-0.5 text-[11px] font-medium text-ink-secondary hover:bg-black/[0.06]"
                  >
                    <FileText size={11} />
                    Commented on {update.docTitle}
                  </Link>
                )}
                <p className="text-sm text-ink-primary">{update.text}</p>
                <div className="mt-1.5 flex items-center gap-1.5 text-xs text-ink-muted">
                  <span className="font-medium text-ink-secondary">{update.author}</span>
                  {fromClient && <Pill tone="neutral">Client</Pill>}
                  <span>· {formatRelativeDate(update.date)}</span>
                </div>
              </div>
              {!isClientView && (
                <button
                  onClick={async () => {
                    if (!(await confirmAction('Delete this update?', { confirmLabel: 'Delete', destructive: true }))) return
                    removeUpdate(client.id, update.id)
                  }}
                  className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-ink-muted hover:bg-[#fbecec] hover:text-status-critical"
                  aria-label="Delete update"
                >
                  <Trash2 size={14} />
                </button>
              )}
            </li>
          )
        })}
      </ul>
    </div>
  )
}
