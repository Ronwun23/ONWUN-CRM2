import { useState } from 'react'
import type { FormEvent } from 'react'
import { useApp } from '@/context/AppContext'
import { DOCUMENT_STATUS_LABEL, DOCUMENT_TYPE_LABEL } from '@/lib/labels'
import type { ClientDocument, DocumentStatus, DocumentType } from '@/types'

const TYPE_OPTIONS: DocumentType[] = ['proposal', 'contract', 'invoice', 'strategy', 'presentation', 'guidelines', 'other']
const STATUS_OPTIONS: DocumentStatus[] = ['with_client', 'with_you', 'signed', 'paid', 'unpaid', 'draft']

const inputClass =
  'w-full rounded-lg border border-black/[0.10] px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500'
const labelClass = 'mb-1.5 block text-xs font-medium uppercase tracking-wide text-ink-muted'

export default function DocumentForm({
  clientId,
  existing,
  onDone,
}: {
  clientId: string
  existing?: ClientDocument
  onDone: () => void
}) {
  const { addDocument, updateDocument } = useApp()
  const [title, setTitle] = useState(existing?.title ?? '')
  const [type, setType] = useState<DocumentType>(existing?.type ?? 'other')
  const [status, setStatus] = useState<DocumentStatus>(existing?.status ?? 'draft')
  const [meta, setMeta] = useState(existing?.meta ?? '')
  const [url, setUrl] = useState(existing?.url ?? '')

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return

    const payload = {
      title: title.trim(),
      type,
      status,
      meta: meta.trim() || undefined,
      url: url.trim() || undefined,
    }

    if (existing) {
      updateDocument(clientId, existing.id, payload)
    } else {
      addDocument(clientId, { id: `doc-${Date.now()}`, updatedAt: new Date().toISOString(), ...payload })
    }
    onDone()
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div>
        <label className={labelClass}>Title</label>
        <input required value={title} onChange={(e) => setTitle(e.target.value)} className={inputClass} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelClass}>Type</label>
          <select value={type} onChange={(e) => setType(e.target.value as DocumentType)} className={inputClass}>
            {TYPE_OPTIONS.map((t) => (
              <option key={t} value={t}>
                {DOCUMENT_TYPE_LABEL[t]}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelClass}>Status</label>
          <select value={status} onChange={(e) => setStatus(e.target.value as DocumentStatus)} className={inputClass}>
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>
                {DOCUMENT_STATUS_LABEL[s]}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div>
        <label className={labelClass}>Link (Figma, Google Doc, etc.)</label>
        <input
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://www.figma.com/file/…"
          className={inputClass}
        />
        <p className="mt-1 text-xs text-ink-muted">
          Figma links preview automatically — set sharing to "anyone with the link can view" first.
        </p>
      </div>
      <div>
        <label className={labelClass}>Note (optional)</label>
        <input
          value={meta}
          onChange={(e) => setMeta(e.target.value)}
          placeholder="e.g. £4,200 paid in full"
          className={inputClass}
        />
      </div>
      <button
        type="submit"
        className="mt-2 rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-600"
      >
        {existing ? 'Save changes' : 'Add document'}
      </button>
    </form>
  )
}
