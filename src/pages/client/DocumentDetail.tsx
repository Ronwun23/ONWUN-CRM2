import { lazy, Suspense, useCallback, useEffect, useState } from 'react'
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, ExternalLink, Link2, Pencil, Trash2 } from 'lucide-react'
import { useClientOutlet } from '@/lib/useClient'
import { useApp } from '@/context/AppContext'
import { useViewMode } from '@/context/ViewModeContext'
import Pill from '@/components/Pill'
import Drawer from '@/components/Drawer'
import DocumentForm from '@/components/DocumentForm'
import DocumentComments from '@/components/DocumentComments'
import DocumentTestimonial from '@/components/DocumentTestimonial'
import ErrorBoundary from '@/components/ErrorBoundary'
import FullscreenViewer from '@/components/FullscreenViewer'
import Spinner from '@/components/Spinner'
import { getSignedDocumentUrl } from '@/lib/api/documents'
import { DOCUMENT_STATUS_LABEL, DOCUMENT_STATUS_TONE, DOCUMENT_TYPE_LABEL } from '@/lib/labels'
import { formatDate } from '@/lib/format'
import { figmaEmbedSrc, isFigmaUrl, isPdfDataUrl, isStoragePath } from '@/lib/embed'

// pdfjs-dist is a large dependency — only fetch it when a document is
// actually a PDF, not on every page load.
const PdfPageViewer = lazy(() => import('@/components/PdfPageViewer'))

export default function DocumentDetail() {
  const client = useClientOutlet()
  const { docId } = useParams<{ docId: string }>()
  const { removeDocument } = useApp()
  const { isClientView } = useViewMode()
  const navigate = useNavigate()
  const [showEdit, setShowEdit] = useState(false)

  const doc = client.documents.find((d) => d.id === docId)
  const [pageLabel, setPageLabel] = useState<string | undefined>()
  const [resolvedPdfUrl, setResolvedPdfUrl] = useState<string | null>(null)
  const [resolveError, setResolveError] = useState(false)

  // Reset the tracked page whenever the viewer switches to a different
  // document, so a stale page label from the last doc never leaks in.
  useEffect(() => {
    setPageLabel(undefined)
  }, [docId])

  // A PDF stored in Supabase Storage is only ever a "storage:<path>"
  // marker — resolve it to a short-lived signed URL before it can be
  // previewed or downloaded, rather than exposing a permanent public link.
  useEffect(() => {
    setResolvedPdfUrl(null)
    setResolveError(false)
    if (!doc?.url || !isStoragePath(doc.url)) return
    let cancelled = false
    getSignedDocumentUrl(doc.url)
      .then((url) => {
        if (!cancelled) setResolvedPdfUrl(url)
      })
      .catch(() => {
        if (!cancelled) setResolveError(true)
      })
    return () => {
      cancelled = true
    }
  }, [doc?.url])

  useEffect(() => {
    if (!doc?.url || !isFigmaUrl(doc.url)) return
    const handler = (event: MessageEvent) => {
      if (event.origin !== 'https://www.figma.com') return
      const data = event.data
      if (data?.type === 'NEW_PAGE' && data.data?.name) {
        setPageLabel(data.data.name)
      }
    }
    window.addEventListener('message', handler)
    return () => window.removeEventListener('message', handler)
  }, [doc?.url])

  const handlePdfPageChange = useCallback((page: number) => {
    setPageLabel(`Page ${page}`)
  }, [])

  if (!doc) return <Navigate to={`/clients/${client.id}/documents`} replace />

  const isPdf = !!doc.url && (isPdfDataUrl(doc.url) || isStoragePath(doc.url))
  const pdfSrc = doc.url && isStoragePath(doc.url) ? resolvedPdfUrl : doc.url

  const isOffboarding = doc.type === 'offboarding'
  const sidePanel = isOffboarding ? (
    <DocumentTestimonial client={client} doc={doc} />
  ) : (
    <DocumentComments client={client} doc={doc} pageLabel={pageLabel} />
  )

  const handleRemove = () => {
    if (!window.confirm(`Remove "${doc.title}"? This can't be undone.`)) return
    removeDocument(client.id, doc.id)
    navigate(`/clients/${client.id}/documents`)
  }

  return (
    <div className="flex flex-col gap-4">
      <Link
        to={`/clients/${client.id}/documents`}
        className="flex w-fit items-center gap-1.5 text-xs font-medium text-ink-muted hover:text-ink-primary"
      >
        <ArrowLeft size={13} />
        Documents
      </Link>

      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl font-semibold text-ink-primary">{doc.title}</h1>
            <Pill tone={DOCUMENT_STATUS_TONE[doc.status]}>{DOCUMENT_STATUS_LABEL[doc.status]}</Pill>
          </div>
          <p className="text-sm text-ink-secondary">
            {DOCUMENT_TYPE_LABEL[doc.type]}
            {doc.meta ? ` · ${doc.meta}` : ''}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {doc.url && (!isStoragePath(doc.url) || resolvedPdfUrl) && (
            <a
              href={isStoragePath(doc.url) ? resolvedPdfUrl! : doc.url}
              target="_blank"
              rel="noopener noreferrer"
              download={isPdf ? `${doc.title}.pdf` : undefined}
              className="flex items-center gap-1.5 rounded-lg border border-black/[0.10] bg-white px-3 py-2 text-sm font-medium text-ink-secondary hover:bg-surface-sunken"
            >
              {isFigmaUrl(doc.url) ? 'Open in Figma' : isPdf ? 'Download PDF' : 'Open link'}
              <ExternalLink size={13} />
            </a>
          )}
          {!isClientView && (
            <>
              <button
                onClick={() => setShowEdit(true)}
                className="flex items-center gap-1.5 rounded-lg border border-black/[0.10] bg-white px-3 py-2 text-sm font-medium text-ink-secondary hover:bg-surface-sunken"
              >
                <Pencil size={13} />
                Edit
              </button>
              <button
                onClick={handleRemove}
                className="flex items-center justify-center rounded-lg border border-black/[0.10] bg-white p-2 text-status-critical hover:bg-[#fbecec]"
                aria-label="Remove document"
              >
                <Trash2 size={15} />
              </button>
            </>
          )}
        </div>
      </div>

      {doc.url ? (
        isFigmaUrl(doc.url) ? (
          <div className="flex flex-col gap-4 lg:flex-row">
            <FullscreenViewer className="min-w-0 flex-1 rounded-xl shadow-card">
              <iframe
                key={doc.url}
                src={figmaEmbedSrc(doc.url)}
                title={doc.title}
                className="aspect-video w-full"
                loading="lazy"
              />
              <p className="border-t border-white/10 px-4 py-2 text-xs text-white/50">
                Needs "anyone with the link can view" set in Figma, or your client's own login instead.
              </p>
            </FullscreenViewer>
            {sidePanel}
          </div>
        ) : isPdf ? (
          <div className="flex flex-col gap-4 lg:flex-row">
            <FullscreenViewer className="min-w-0 flex-1 rounded-xl shadow-card">
              {resolveError ? (
                <div className="flex min-h-[420px] items-center justify-center rounded-xl bg-black text-sm text-white/60">
                  Couldn't load this PDF.
                </div>
              ) : !pdfSrc ? (
                <div className="flex min-h-[420px] items-center justify-center gap-2 rounded-xl bg-black text-sm text-white/50">
                  <Spinner className="text-white/50" />
                  Loading PDF viewer…
                </div>
              ) : (
                <ErrorBoundary
                  fallback={
                    <div className="flex min-h-[420px] flex-col items-center justify-center gap-3 rounded-xl bg-black text-center text-sm text-white/60">
                      <p>Couldn't preview this PDF here.</p>
                      <a
                        href={pdfSrc}
                        download={`${doc.title}.pdf`}
                        className="rounded-lg bg-white px-3.5 py-2 text-sm font-semibold text-black hover:bg-white/90"
                      >
                        Download it instead
                      </a>
                    </div>
                  }
                >
                  <Suspense
                    fallback={
                      <div className="flex min-h-[420px] items-center justify-center gap-2 rounded-xl bg-black text-sm text-white/50">
                        <Spinner className="text-white/50" />
                        Loading PDF viewer…
                      </div>
                    }
                  >
                    <PdfPageViewer url={pdfSrc} onPageChange={handlePdfPageChange} />
                  </Suspense>
                </ErrorBoundary>
              )}
            </FullscreenViewer>
            {sidePanel}
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3 rounded-xl border border-black/[0.06] bg-white p-12 text-center shadow-card">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-surface-sunken text-ink-secondary">
              <Link2 size={18} />
            </div>
            <p className="max-w-xs truncate text-sm text-ink-secondary">{doc.url}</p>
            <a
              href={doc.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 rounded-lg bg-brand-500 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-600"
            >
              Open link
              <ExternalLink size={13} />
            </a>
          </div>
        )
      ) : (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-black/[0.12] bg-white/60 p-12 text-center">
          <Link2 className="text-ink-muted" size={20} />
          <p className="text-sm text-ink-secondary">No link on this document yet.</p>
          {!isClientView && (
            <button
              onClick={() => setShowEdit(true)}
              className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-600"
            >
              Add a link
            </button>
          )}
        </div>
      )}

      <p className="text-xs text-ink-muted">Updated {formatDate(doc.updatedAt)}</p>

      <Drawer open={showEdit} onClose={() => setShowEdit(false)} title="Edit document">
        <DocumentForm clientId={client.id} existing={doc} onDone={() => setShowEdit(false)} />
      </Drawer>
    </div>
  )
}
