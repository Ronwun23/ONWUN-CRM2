import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { FileText, Search } from 'lucide-react'
import { useApp } from '@/context/AppContext'
import { ClientAvatar } from '@/components/Avatar'
import { DOCUMENT_TYPE_LABEL } from '@/lib/labels'

/** Cmd/Ctrl+K style search — jumps straight to a client or a specific
 * document instead of making you click through the sidebar to find one. */
export default function SearchPalette({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { clients } = useApp()
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!open) return
    setQuery('')
    const id = requestAnimationFrame(() => inputRef.current?.focus())
    return () => cancelAnimationFrame(id)
  }, [open])

  const { clientResults, docResults } = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return { clientResults: [], docResults: [] }

    return {
      clientResults: clients
        .filter((c) => c.name.toLowerCase().includes(q) || c.projectName.toLowerCase().includes(q))
        .slice(0, 6),
      docResults: clients
        .flatMap((c) => c.documents.map((doc) => ({ doc, client: c })))
        .filter(({ doc }) => doc.title.toLowerCase().includes(q))
        .slice(0, 6),
    }
  }, [clients, query])

  if (!open) return null

  const hasResults = clientResults.length > 0 || docResults.length > 0

  const go = (path: string) => {
    navigate(path)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center px-4 pt-[12vh]">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative w-full max-w-lg overflow-hidden rounded-xl border border-black/[0.08] bg-white shadow-pop">
        <div className="flex items-center gap-3 border-b border-black/[0.06] px-4">
          <Search size={16} className="shrink-0 text-ink-muted" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Escape' && onClose()}
            placeholder="Search clients or documents…"
            className="flex-1 bg-transparent py-3.5 text-sm text-ink-primary placeholder:text-ink-muted focus:outline-none"
            autoComplete="off"
            data-1p-ignore
            data-lpignore="true"
          />
          <kbd className="hidden shrink-0 rounded-md border border-black/[0.08] px-1.5 py-0.5 text-[10px] font-medium text-ink-muted sm:inline-block">
            ESC
          </kbd>
        </div>

        <div className="max-h-80 overflow-y-auto p-2">
          {!query.trim() && (
            <p className="px-3 py-6 text-center text-sm text-ink-muted">Type to search clients and documents…</p>
          )}

          {query.trim() && !hasResults && (
            <p className="px-3 py-6 text-center text-sm text-ink-muted">No matches for &ldquo;{query}&rdquo;</p>
          )}

          {clientResults.length > 0 && (
            <div className="mb-1">
              <p className="px-3 pb-1 pt-2 text-[11px] font-semibold uppercase tracking-wide text-ink-muted">Clients</p>
              {clientResults.map((c) => (
                <button
                  key={c.id}
                  onClick={() => go(`/clients/${c.id}/dashboard`)}
                  className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left hover:bg-surface-sunken"
                >
                  <ClientAvatar initials={c.initials} color={c.color} avatarUrl={c.avatarUrl} size={26} />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-ink-primary">{c.name}</p>
                    <p className="truncate text-xs text-ink-muted">{c.projectName}</p>
                  </div>
                </button>
              ))}
            </div>
          )}

          {docResults.length > 0 && (
            <div>
              <p className="px-3 pb-1 pt-2 text-[11px] font-semibold uppercase tracking-wide text-ink-muted">Documents</p>
              {docResults.map(({ doc, client }) => (
                <button
                  key={doc.id}
                  onClick={() => go(`/clients/${client.id}/documents/${doc.id}`)}
                  className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left hover:bg-surface-sunken"
                >
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-surface-sunken text-ink-secondary">
                    <FileText size={14} />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-ink-primary">{doc.title}</p>
                    <p className="truncate text-xs text-ink-muted">
                      {client.name} · {DOCUMENT_TYPE_LABEL[doc.type]}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
