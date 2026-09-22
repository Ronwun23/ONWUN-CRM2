import { useState } from 'react'
import type { KeyboardEvent } from 'react'
import { Quote, Send, Trash2 } from 'lucide-react'
import { useApp } from '@/context/AppContext'
import { useViewMode } from '@/context/ViewModeContext'
import type { Client, ClientDocument } from '@/types'

function formatTestimonialDate(iso: string): string {
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(iso))
}

export default function DocumentTestimonial({ client, doc }: { client: Client; doc: ClientDocument }) {
  const { setDocumentTestimonial, removeDocumentTestimonial, activeAccount } = useApp()
  const { isClientView } = useViewMode()
  const [draft, setDraft] = useState('')

  const authorName = isClientView ? client.name : activeAccount.name

  const send = () => {
    const text = draft.trim()
    if (!text) return
    setDocumentTestimonial(client.id, doc.id, {
      text,
      authorName,
      authorType: isClientView ? 'client' : 'agency',
      createdAt: new Date().toISOString(),
    })
    setDraft('')
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      send()
    }
  }

  const handleRemove = () => {
    if (!window.confirm('Remove this testimonial?')) return
    removeDocumentTestimonial(client.id, doc.id)
  }

  return (
    <div className="flex h-full min-h-[420px] w-72 shrink-0 flex-col rounded-xl border border-black/[0.06] bg-white">
      <p className="border-b border-black/[0.06] px-4 py-3 text-xs font-semibold uppercase tracking-wide text-ink-muted">
        Testimonial
      </p>

      <div className="flex-1 overflow-y-auto px-4 py-3">
        {doc.testimonial ? (
          <div className="flex flex-col gap-3">
            <Quote className="text-brand-200" size={22} strokeWidth={2.5} />
            <p className="whitespace-pre-wrap text-sm italic leading-relaxed text-ink-primary">
              "{doc.testimonial.text}"
            </p>
            <div className="flex items-center justify-between gap-2">
              <div>
                <p className="text-sm font-semibold text-ink-primary">{doc.testimonial.authorName}</p>
                <p className="text-[11px] text-ink-muted">{formatTestimonialDate(doc.testimonial.createdAt)}</p>
              </div>
              {!isClientView && (
                <button
                  onClick={handleRemove}
                  className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-ink-muted hover:bg-[#fbecec] hover:text-status-critical"
                  aria-label="Remove testimonial"
                >
                  <Trash2 size={14} />
                </button>
              )}
            </div>
          </div>
        ) : (
          <p className="text-sm text-ink-muted">
            Nothing shared yet. A few words about working together, from {isClientView ? 'you' : client.name}.
          </p>
        )}
      </div>

      {!doc.testimonial && (
        <div className="border-t border-black/[0.06]">
          <p className="px-3 pt-3 text-xs leading-relaxed text-ink-muted">
            Your words mean the world to us — a short testimonial helps us keep improving and shows other brands
            what working with Onwun is really like. Thank you for taking a moment to share it.
          </p>
          <div className="flex items-end gap-2 p-3">
            <textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={handleKeyDown}
              rows={2}
              placeholder="Share a few words…"
              className="max-h-24 flex-1 resize-none rounded-lg border border-black/[0.10] px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
            />
            <button
              onClick={send}
              disabled={!draft.trim()}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-500 text-white hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-40"
              aria-label="Share testimonial"
            >
              <Send size={15} />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
