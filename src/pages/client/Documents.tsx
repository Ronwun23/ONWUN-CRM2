import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ExternalLink, FileSignature, FileText, Images, Link2, Palette, Plus, Presentation, Receipt, Sparkles } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { useClientOutlet } from '@/lib/useClient'
import { useViewMode } from '@/context/ViewModeContext'
import Pill from '@/components/Pill'
import Drawer from '@/components/Drawer'
import DocumentForm from '@/components/DocumentForm'
import { DOCUMENT_STATUS_LABEL, DOCUMENT_STATUS_TONE, DOCUMENT_TYPE_LABEL } from '@/lib/labels'
import { formatDate } from '@/lib/format'
import { isFigmaUrl, isPdfDataUrl } from '@/lib/embed'
import type { DocumentType } from '@/types'

const TYPE_ICON: Record<DocumentType, LucideIcon> = {
  proposal: FileText,
  contract: FileSignature,
  invoice: Receipt,
  strategy: FileText,
  presentation: Presentation,
  moodboard: Images,
  identity: Palette,
  guidelines: Sparkles,
  other: FileText,
}

export default function ClientDocuments() {
  const client = useClientOutlet()
  const { isClientView } = useViewMode()
  const [showAdd, setShowAdd] = useState(false)

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-ink-primary">Documents</h1>
        {!isClientView && (
          <button
            onClick={() => setShowAdd(true)}
            className="flex items-center gap-1.5 rounded-lg bg-brand-500 px-3.5 py-2 text-sm font-semibold text-white hover:bg-brand-600"
          >
            <Plus size={16} />
            New document
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {client.documents.length === 0 && <p className="text-sm text-ink-muted">No documents yet.</p>}
        {client.documents.map((doc) => {
          const Icon = TYPE_ICON[doc.type]
          return (
            <Link
              key={doc.id}
              to={`/clients/${client.id}/documents/${doc.id}`}
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
                  <span className="flex items-center gap-1 text-xs font-medium text-brand-600">
                    {isFigmaUrl(doc.url) || isPdfDataUrl(doc.url) ? 'Preview' : 'Linked'}
                    <ExternalLink size={11} />
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-xs text-ink-muted">
                    <Link2 size={11} />
                    {isClientView ? 'No link yet' : 'Add link'}
                  </span>
                )}
              </div>
            </Link>
          )
        })}
      </div>

      <Drawer open={showAdd} onClose={() => setShowAdd(false)} title="New document">
        <DocumentForm clientId={client.id} onDone={() => setShowAdd(false)} />
      </Drawer>
    </div>
  )
}
