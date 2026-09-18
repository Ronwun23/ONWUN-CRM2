import { useState } from 'react'
import type { FormEvent } from 'react'
import { ExternalLink, FileSignature, FileText, Link2, Plus, Presentation, Receipt, Sparkles } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { useClientOutlet } from '@/lib/useClient'
import { useApp } from '@/context/AppContext'
import Pill from '@/components/Pill'
import Drawer from '@/components/Drawer'
import { DOCUMENT_STATUS_LABEL, DOCUMENT_STATUS_TONE, DOCUMENT_TYPE_LABEL } from '@/lib/labels'
import { formatDate } from '@/lib/format'
import type { ClientDocument, DocumentStatus, DocumentType } from '@/types'

const TYPE_ICON: Record<DocumentType, LucideIcon> = {
  proposal: FileText,
  contract: FileSignature,
  invoice: Receipt,
  strategy: FileText,
  presentation: Presentation,
  guidelines: Sparkles,
  other: FileText,
}

const TYPE_OPTIONS: DocumentType[] = ['proposal', 'contract', 'invoice', 'strategy', 'presentation', 'guidelines', 'other']
const STATUS_OPTIONS: DocumentStatus[] = ['with_client', 'with_you', 'signed', 'paid', 'unpaid', 'draft']

interface DraftState {
  title: string
  type: DocumentType
  status: DocumentStatus
  meta: string
  url: string
}

const BLANK_DRAFT: DraftState = { title: '', type: 'other', status: 'draft', meta: '', url: '' }

function draftFromDoc(doc: ClientDocument): DraftState {
  return { title: doc.title, type: doc.type, status: doc.status, meta: doc.meta ?? '', url: doc.url ?? '' }
}

export default function ClientDocuments() {
  const client = useClientOutlet()
  const { addDocument, updateDocument } = useApp()
  const [editingId, setEditingId] = useState<string | null>(null)
  const [showAdd, setShowAdd] = useState(false)
  const [draft, setDraft] = useState<DraftState>(BLANK_DRAFT)

  const openAdd = () => {
    setDraft(BLANK_DRAFT)
    setEditingId(null)
    setShowAdd(true)
  }

  const openEdit = (doc: ClientDocument) => {
    setDraft(draftFromDoc(doc))
    setEditingId(doc.id)
    setShowAdd(true)
  }

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    if (!draft.title.trim()) return

    const payload = {
      title: draft.title.trim(),
      type: draft.type,
      status: draft.status,
      meta: draft.meta.trim() || undefined,
      url: draft.url.trim() || undefined,
    }

    if (editingId) {
      updateDocument(client.id, editingId, payload)
    } else {
      addDocument(client.id, { id: `doc-${Date.now()}`, updatedAt: new Date().toISOString(), ...payload })
    }
    setShowAdd(false)
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-ink-primary">Documents</h1>
        <button
          onClick={openAdd}
          className="flex items-center gap-1.5 rounded-lg bg-brand-500 px-3.5 py-2 text-sm font-semibold text-white hover:bg-brand-600"
        >
          <Plus size={16} />
          New document
        </button>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {client.documents.length === 0 && <p className="text-sm text-ink-muted">No documents yet.</p>}
        {client.documents.map((doc) => {
          const Icon = TYPE_ICON[doc.type]
          return (
            <button
              key={doc.id}
              onClick={() => openEdit(doc)}
              className="rounded-xl border border-black/[0.06] bg-white p-4 text-left shadow-card transition-shadow hover:shadow-pop"
            >
              <div className="flex items-start justify-between">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-surface-sunken text-ink-secondary">
                  <Icon size={16} />
                </div>
                <Pill tone={DOCUMENT_STATUS_TONE[doc.status]}>{DOCUMENT_STATUS_LABEL[doc.status]}</Pill>
              </div>
              <p className="mt-3 text-sm font-medium text-ink-primary">{doc.title}</p>
              <p className="text-xs text-ink-muted">{DOCUMENT_TYPE_LABEL[doc.type]}</p>
              {doc.meta && <p className="mt-1.5 text-xs text-ink-secondary">{doc.meta}</p>}
              <div className="mt-2 flex items-center justify-between">
                <p className="text-xs text-ink-muted">Updated {formatDate(doc.updatedAt)}</p>
                {doc.url ? (
                  <a
                    href={doc.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="flex items-center gap-1 text-xs font-medium text-brand-600 hover:text-brand-700 hover:underline"
                  >
                    Open
                    <ExternalLink size={11} />
                  </a>
                ) : (
                  <span className="flex items-center gap-1 text-xs text-ink-muted">
                    <Link2 size={11} />
                    Add link
                  </span>
                )}
              </div>
            </button>
          )
        })}
      </div>

      <Drawer open={showAdd} onClose={() => setShowAdd(false)} title={editingId ? 'Edit document' : 'New document'}>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-ink-muted">Title</label>
            <input
              required
              value={draft.title}
              onChange={(e) => setDraft((d) => ({ ...d, title: e.target.value }))}
              className="w-full rounded-lg border border-black/[0.10] px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-ink-muted">Type</label>
              <select
                value={draft.type}
                onChange={(e) => setDraft((d) => ({ ...d, type: e.target.value as DocumentType }))}
                className="w-full rounded-lg border border-black/[0.10] px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
              >
                {TYPE_OPTIONS.map((t) => (
                  <option key={t} value={t}>
                    {DOCUMENT_TYPE_LABEL[t]}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-ink-muted">Status</label>
              <select
                value={draft.status}
                onChange={(e) => setDraft((d) => ({ ...d, status: e.target.value as DocumentStatus }))}
                className="w-full rounded-lg border border-black/[0.10] px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
              >
                {STATUS_OPTIONS.map((s) => (
                  <option key={s} value={s}>
                    {DOCUMENT_STATUS_LABEL[s]}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-ink-muted">
              Link (Figma, Google Doc, etc.)
            </label>
            <input
              type="url"
              value={draft.url}
              onChange={(e) => setDraft((d) => ({ ...d, url: e.target.value }))}
              placeholder="https://www.figma.com/file/…"
              className="w-full rounded-lg border border-black/[0.10] px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-ink-muted">Note (optional)</label>
            <input
              value={draft.meta}
              onChange={(e) => setDraft((d) => ({ ...d, meta: e.target.value }))}
              placeholder="e.g. £4,200 paid in full"
              className="w-full rounded-lg border border-black/[0.10] px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
            />
          </div>
          <button
            type="submit"
            className="mt-2 rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-600"
          >
            {editingId ? 'Save changes' : 'Add document'}
          </button>
        </form>
      </Drawer>
    </div>
  )
}
