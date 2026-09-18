import { useState } from 'react'
import type { FormEvent } from 'react'
import { FileSignature, FileText, Plus, Presentation, Receipt, Sparkles } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { useClientOutlet } from '@/lib/useClient'
import { useApp } from '@/context/AppContext'
import Pill from '@/components/Pill'
import Drawer from '@/components/Drawer'
import { DOCUMENT_STATUS_LABEL, DOCUMENT_STATUS_TONE, DOCUMENT_TYPE_LABEL } from '@/lib/labels'
import { formatDate } from '@/lib/format'
import type { DocumentStatus, DocumentType } from '@/types'

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

export default function ClientDocuments() {
  const client = useClientOutlet()
  const { addDocument } = useApp()
  const [showAdd, setShowAdd] = useState(false)
  const [title, setTitle] = useState('')
  const [type, setType] = useState<DocumentType>('other')
  const [status, setStatus] = useState<DocumentStatus>('draft')
  const [meta, setMeta] = useState('')

  const handleAdd = (e: FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return
    addDocument(client.id, {
      id: `doc-${Date.now()}`,
      title: title.trim(),
      type,
      status,
      meta: meta.trim() || undefined,
      updatedAt: new Date().toISOString(),
    })
    setTitle('')
    setMeta('')
    setShowAdd(false)
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-ink-primary">Documents</h1>
        <button
          onClick={() => setShowAdd(true)}
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
            <div key={doc.id} className="rounded-xl border border-black/[0.06] bg-white p-4 shadow-card">
              <div className="flex items-start justify-between">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-surface-sunken text-ink-secondary">
                  <Icon size={16} />
                </div>
                <Pill tone={DOCUMENT_STATUS_TONE[doc.status]}>{DOCUMENT_STATUS_LABEL[doc.status]}</Pill>
              </div>
              <p className="mt-3 text-sm font-medium text-ink-primary">{doc.title}</p>
              <p className="text-xs text-ink-muted">{DOCUMENT_TYPE_LABEL[doc.type]}</p>
              {doc.meta && <p className="mt-1.5 text-xs text-ink-secondary">{doc.meta}</p>}
              <p className="mt-2 text-xs text-ink-muted">Updated {formatDate(doc.updatedAt)}</p>
            </div>
          )
        })}
      </div>

      <Drawer open={showAdd} onClose={() => setShowAdd(false)} title="New document">
        <form onSubmit={handleAdd} className="flex flex-col gap-4">
          <div>
            <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-ink-muted">Title</label>
            <input
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded-lg border border-black/[0.10] px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-ink-muted">Type</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as DocumentType)}
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
                value={status}
                onChange={(e) => setStatus(e.target.value as DocumentStatus)}
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
            <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-ink-muted">Note (optional)</label>
            <input
              value={meta}
              onChange={(e) => setMeta(e.target.value)}
              placeholder="e.g. £4,200 paid in full"
              className="w-full rounded-lg border border-black/[0.10] px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
            />
          </div>
          <button
            type="submit"
            className="mt-2 rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-600"
          >
            Add document
          </button>
        </form>
      </Drawer>
    </div>
  )
}
