import { useState } from 'react'
import type { KeyboardEvent } from 'react'
import { Send } from 'lucide-react'
import { useApp } from '@/context/AppContext'
import { useViewMode } from '@/context/ViewModeContext'
import type { Client, ClientDocument } from '@/types'

function formatCommentTime(iso: string): string {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(iso))
}

export default function DocumentComments({
  client,
  doc,
  pageLabel,
}: {
  client: Client
  doc: ClientDocument
  pageLabel?: string
}) {
  const { addDocumentComment, activeAccount } = useApp()
  const { isClientView } = useViewMode()
  const [draft, setDraft] = useState('')
  // Defensive: documents created before comment threads existed (still
  // sitting in a browser's localStorage from an earlier session) won't have
  // a `comments` array at all.
  const comments = doc.comments ?? []

  const authorName = isClientView ? client.name : activeAccount.name
  const otherPartyName = isClientView ? 'Onwun' : client.name

  const send = () => {
    const text = draft.trim()
    if (!text) return
    addDocumentComment(client.id, doc.id, {
      id: `comment-${Date.now()}`,
      authorName,
      authorType: isClientView ? 'client' : 'agency',
      text,
      createdAt: new Date().toISOString(),
      pageLabel,
    })
    setDraft('')
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      send()
    }
  }

  return (
    <div className="flex h-full min-h-[420px] w-72 shrink-0 flex-col rounded-xl border border-black/[0.06] bg-white">
      <p className="border-b border-black/[0.06] px-4 py-3 text-xs font-semibold uppercase tracking-wide text-ink-muted">
        Comments
      </p>

      <div className="flex-1 overflow-y-auto px-4 py-3">
        {comments.length === 0 ? (
          <p className="text-sm text-ink-muted">
            Nothing from {otherPartyName} yet. Comments left here are visible to both of you.
          </p>
        ) : (
          <ul className="flex flex-col gap-4">
            {comments.map((comment) => (
              <li key={comment.id}>
                <div className="flex flex-wrap items-baseline gap-1.5">
                  <span className="text-sm font-semibold text-ink-primary">{comment.authorName}</span>
                  <span className="text-[11px] text-ink-muted">{formatCommentTime(comment.createdAt)}</span>
                  {comment.pageLabel && (
                    <span className="rounded bg-surface-sunken px-1.5 py-0.5 text-[10px] font-medium text-ink-muted">
                      {comment.pageLabel}
                    </span>
                  )}
                </div>
                <p className="mt-0.5 whitespace-pre-wrap text-sm leading-relaxed text-ink-secondary">{comment.text}</p>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="border-t border-black/[0.06]">
        {pageLabel && (
          <p className="px-3 pt-2 text-[11px] text-ink-muted">
            Commenting on <span className="font-medium text-ink-secondary">{pageLabel}</span>
          </p>
        )}
        <div className="flex items-end gap-2 p-3">
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={handleKeyDown}
            rows={1}
            placeholder={`Write to ${otherPartyName}…`}
            className="max-h-24 flex-1 resize-none rounded-lg border border-black/[0.10] px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
          />
          <button
            onClick={send}
            disabled={!draft.trim()}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-500 text-white hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-40"
            aria-label="Send comment"
          >
            <Send size={15} />
          </button>
        </div>
      </div>
    </div>
  )
}
