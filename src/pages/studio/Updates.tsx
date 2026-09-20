import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Send, Trash2 } from 'lucide-react'
import { useApp } from '@/context/AppContext'
import Card from '@/components/Card'
import Pill from '@/components/Pill'
import { ClientAvatar, MemberAvatar } from '@/components/Avatar'
import { formatRelativeDate } from '@/lib/format'
import type { Client, UpdateEntry } from '@/types'

type FeedEntry = UpdateEntry & { client?: Client }

export default function StudioUpdates() {
  const { clients, studio, addStudioUpdate, removeStudioUpdate, removeUpdate, activeAccount } = useApp()
  const navigate = useNavigate()
  const [text, setText] = useState('')

  const handlePost = () => {
    if (!text.trim()) return
    addStudioUpdate({
      id: `studio-update-${Date.now()}`,
      text: text.trim(),
      date: new Date().toISOString(),
      author: activeAccount.name,
      authorType: 'agency',
    })
    setText('')
  }

  // Every client update — whether posted by us on their portal or by the
  // client themselves — plus our own internal studio notes, in one feed.
  const feed = useMemo<FeedEntry[]>(() => {
    const clientUpdates = clients.flatMap((c) => c.updates.map((u) => ({ ...u, client: c })))
    return [...studio.updates, ...clientUpdates].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  }, [clients, studio.updates])

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-xl font-semibold text-ink-primary">Updates</h1>
        <p className="text-sm text-ink-secondary">Internal notes, plus every update posted across your clients' portals</p>
      </div>

      <Card>
        <div className="flex gap-2">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Post an update for the team…"
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

      <ul className="flex flex-col gap-3">
        {feed.length === 0 && <p className="text-sm text-ink-muted">No updates yet.</p>}
        {feed.map((update) => {
          const fromClient = update.authorType === 'client'
          const content = (
            <>
              {update.client ? (
                fromClient ? (
                  <ClientAvatar
                    initials={update.client.initials}
                    color={update.client.color}
                    avatarUrl={update.client.avatarUrl}
                    size={28}
                  />
                ) : (
                  <MemberAvatar memberId={update.author} size={28} />
                )
              ) : (
                <MemberAvatar memberId={update.author} size={28} />
              )}
              <div className="min-w-0 flex-1">
                <p className="text-sm text-ink-primary">{update.text}</p>
                <div className="mt-1.5 flex flex-wrap items-center gap-1.5 text-xs text-ink-muted">
                  <span className="font-medium text-ink-secondary">{update.author}</span>
                  {fromClient && <Pill tone="brand">Client</Pill>}
                  {update.client && <span className="text-ink-muted">· {update.client.name}</span>}
                  <span>· {formatRelativeDate(update.date)}</span>
                </div>
              </div>
            </>
          )
          const handleDelete = () => {
            if (!window.confirm('Delete this update?')) return
            if (update.client) {
              removeUpdate(update.client.id, update.id)
            } else {
              removeStudioUpdate(update.id)
            }
          }
          return (
            <li key={update.id} className="flex items-start gap-2 rounded-xl border border-black/[0.06] bg-white shadow-card">
              {update.client ? (
                <button
                  onClick={() => navigate(`/clients/${update.client!.id}/updates`)}
                  className="flex min-w-0 flex-1 items-start gap-3 p-4 text-left hover:bg-surface-sunken/40"
                >
                  {content}
                </button>
              ) : (
                <div className="flex min-w-0 flex-1 items-start gap-3 p-4">{content}</div>
              )}
              <button
                onClick={handleDelete}
                className="mr-3 mt-3 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-ink-muted hover:bg-[#fbecec] hover:text-status-critical"
                aria-label="Delete update"
              >
                <Trash2 size={14} />
              </button>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
