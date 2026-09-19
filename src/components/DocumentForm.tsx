import { useRef, useState } from 'react'
import type { DragEvent, FormEvent } from 'react'
import { FileText, Upload } from 'lucide-react'
import clsx from 'clsx'
import { useApp } from '@/context/AppContext'
import { Select } from '@/components/ui/select'
import { DOCUMENT_STATUS_LABEL, DOCUMENT_TYPE_LABEL } from '@/lib/labels'
import type { ClientDocument, DocumentStatus, DocumentType } from '@/types'

const TYPE_OPTIONS: DocumentType[] = ['proposal', 'contract', 'invoice', 'strategy', 'presentation', 'guidelines', 'other']
const STATUS_OPTIONS: DocumentStatus[] = ['with_client', 'with_you', 'signed', 'paid', 'unpaid', 'draft']
const PDF_DATA_URL_PREFIX = 'data:application/pdf'

type Source = 'figma' | 'pdf'

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
  const [source, setSource] = useState<Source>(existing?.url?.startsWith(PDF_DATA_URL_PREFIX) ? 'pdf' : 'figma')
  const [pdfFileName, setPdfFileName] = useState(
    existing?.url?.startsWith(PDF_DATA_URL_PREFIX) ? `${existing.title}.pdf` : ''
  )
  const [isDraggingOver, setIsDraggingOver] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

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

  const handleSourceChange = (next: Source) => {
    setSource(next)
    setUrl('')
    setPdfFileName('')
  }

  const handleFile = (file: File | undefined) => {
    if (!file || file.type !== 'application/pdf') return
    setPdfFileName(file.name)
    const reader = new FileReader()
    reader.onload = () => setUrl(typeof reader.result === 'string' ? reader.result : '')
    reader.readAsDataURL(file)
  }

  const handleDrop = (e: DragEvent<HTMLLabelElement>) => {
    e.preventDefault()
    setIsDraggingOver(false)
    handleFile(e.dataTransfer.files[0])
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <p className="text-sm text-ink-secondary">
        A Figma file or a PDF, under the name you give it. It reaches the client when you publish.
      </p>

      <div>
        <label className={labelClass}>Name</label>
        <input
          required
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Brand presentation"
          className={inputClass}
          autoComplete="off"
          data-1p-ignore
          data-lpignore="true"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelClass}>Type</label>
          <Select
            value={type}
            onChange={(v) => setType(v as DocumentType)}
            options={TYPE_OPTIONS.map((t) => ({ value: t, label: DOCUMENT_TYPE_LABEL[t] }))}
          />
        </div>
        <div>
          <label className={labelClass}>Status</label>
          <Select
            value={status}
            onChange={(v) => setStatus(v as DocumentStatus)}
            options={STATUS_OPTIONS.map((s) => ({ value: s, label: DOCUMENT_STATUS_LABEL[s] }))}
          />
        </div>
      </div>

      <div>
        <label className={labelClass}>Source</label>
        <div className="grid grid-cols-2 gap-1 rounded-lg bg-surface-sunken p-1">
          <button
            type="button"
            onClick={() => handleSourceChange('figma')}
            className={clsx(
              'rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
              source === 'figma' ? 'bg-white text-ink-primary shadow-card' : 'text-ink-secondary hover:text-ink-primary'
            )}
          >
            Figma link
          </button>
          <button
            type="button"
            onClick={() => handleSourceChange('pdf')}
            className={clsx(
              'rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
              source === 'pdf' ? 'bg-white text-ink-primary shadow-card' : 'text-ink-secondary hover:text-ink-primary'
            )}
          >
            PDF
          </button>
        </div>
      </div>

      {source === 'figma' ? (
        <div>
          <label className={labelClass}>Link</label>
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="Paste a Figma link…"
            className={inputClass}
            autoComplete="off"
            data-1p-ignore
            data-lpignore="true"
          />
          <p className="mt-1 text-xs text-ink-muted">Needs "anyone with the link can view" in Figma.</p>
        </div>
      ) : (
        <div>
          <label className={labelClass}>PDF</label>
          <label
            onDragOver={(e) => {
              e.preventDefault()
              setIsDraggingOver(true)
            }}
            onDragLeave={() => setIsDraggingOver(false)}
            onDrop={handleDrop}
            className={clsx(
              'flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border border-dashed px-4 py-8 text-center transition-colors',
              isDraggingOver ? 'border-brand-500 bg-brand-50' : 'border-black/20 bg-surface-sunken/40 hover:border-brand-500'
            )}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="application/pdf"
              className="hidden"
              onChange={(e) => handleFile(e.target.files?.[0])}
            />
            {pdfFileName ? (
              <>
                <FileText className="text-brand-600" size={20} />
                <p className="max-w-full truncate text-sm font-medium text-ink-primary">{pdfFileName}</p>
                <p className="text-xs text-ink-muted">Click to replace</p>
              </>
            ) : (
              <>
                <Upload className="text-ink-muted" size={20} />
                <p className="text-sm text-ink-secondary">Drag and drop a PDF, or click to upload</p>
              </>
            )}
          </label>
        </div>
      )}

      <div>
        <label className={labelClass}>Note (optional)</label>
        <input
          value={meta}
          onChange={(e) => setMeta(e.target.value)}
          placeholder="e.g. £4,200 paid in full"
          className={inputClass}
          autoComplete="off"
          data-1p-ignore
          data-lpignore="true"
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
