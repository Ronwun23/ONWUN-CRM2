import { useEffect, useRef, useState } from 'react'
import type { MouseEvent } from 'react'
import { Check } from 'lucide-react'
import clsx from 'clsx'
import * as pdfjsLib from 'pdfjs-dist'
import PdfWorkerUrl from 'pdfjs-dist/build/pdf.worker.mjs?url'
import { useApp } from '@/context/AppContext'
import { getSignedDocumentUrl } from '@/lib/api/documents'
import { isStoragePath } from '@/lib/embed'
import type { Client, ClientDocument, ContractStampLayout, StampPosition } from '@/types'

pdfjsLib.GlobalWorkerOptions.workerSrc = PdfWorkerUrl

type FieldKey = 'designerSignature' | 'designerDate' | 'clientSignature' | 'clientDate'

const FIELDS: { key: FieldKey; label: string; color: string }[] = [
  { key: 'designerSignature', label: 'Your signature', color: '#1a1a1a' },
  { key: 'designerDate', label: 'Your date', color: '#1a1a1a' },
  { key: 'clientSignature', label: 'Client signature', color: '#1a3fa0' },
  { key: 'clientDate', label: 'Client date', color: '#1a3fa0' },
]

export default function ContractStampPositioner({
  client,
  doc,
  onDone,
}: {
  client: Client
  doc: ClientDocument
  onDone?: () => void
}) {
  const { setContractStampLayout } = useApp()
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [pageIndex, setPageIndex] = useState(0)
  const [markers, setMarkers] = useState<Partial<Record<FieldKey, StampPosition>>>(doc.stampLayout ?? {})
  const [activeField, setActiveField] = useState<FieldKey | null>(null)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)
    ;(async () => {
      try {
        if (!doc.url) throw new Error('No PDF')
        const src = isStoragePath(doc.url) ? await getSignedDocumentUrl(doc.url) : doc.url
        const pdf = await pdfjsLib.getDocument(src).promise
        if (cancelled) return
        const lastPageIndex = pdf.numPages - 1
        setPageIndex(lastPageIndex)
        const page = await pdf.getPage(lastPageIndex + 1)
        if (cancelled) return
        const viewport = page.getViewport({ scale: 1.1 })
        const canvas = canvasRef.current
        if (!canvas) return
        canvas.width = viewport.width
        canvas.height = viewport.height
        const context = canvas.getContext('2d')
        if (!context) return
        await page.render({ canvasContext: context, viewport }).promise
        if (!cancelled) setLoading(false)
      } catch {
        if (!cancelled) {
          setError("Couldn't load this PDF.")
          setLoading(false)
        }
      }
    })()
    return () => {
      cancelled = true
    }
  }, [doc.url])

  const handleCanvasClick = (e: MouseEvent<HTMLCanvasElement>) => {
    if (!activeField) return
    const canvas = canvasRef.current
    if (!canvas) return
    const rect = canvas.getBoundingClientRect()
    const x = (e.clientX - rect.left) / rect.width
    const y = (e.clientY - rect.top) / rect.height
    setMarkers((prev) => ({ ...prev, [activeField]: { page: pageIndex, x, y } }))
    setActiveField(null)
  }

  const handleSave = () => {
    setContractStampLayout(client.id, doc.id, markers as ContractStampLayout)
    onDone?.()
  }

  const allSet = FIELDS.every((f) => markers[f.key])

  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm text-ink-secondary">
        Click a field below, then click where it belongs on the contract's last page — same as where the printed
        line for it already sits.
      </p>
      <div className="flex flex-wrap gap-2">
        {FIELDS.map((f) => (
          <button
            key={f.key}
            onClick={() => setActiveField(f.key)}
            className={clsx(
              'flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium',
              activeField === f.key
                ? 'border-brand-500 bg-brand-50 text-brand-700'
                : markers[f.key]
                  ? 'border-black/[0.10] bg-surface-sunken text-ink-primary'
                  : 'border-black/[0.10] bg-white text-ink-secondary hover:bg-surface-sunken'
            )}
          >
            <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: f.color }} />
            {f.label}
            {markers[f.key] && <Check size={12} />}
          </button>
        ))}
      </div>
      <div className="relative inline-block max-h-[500px] max-w-full overflow-auto rounded-lg border border-black/[0.08]">
        {loading && (
          <div className="flex h-96 w-full items-center justify-center text-sm text-ink-muted">Loading…</div>
        )}
        {error && (
          <div className="flex h-96 w-full items-center justify-center text-sm text-status-critical">{error}</div>
        )}
        <canvas
          ref={canvasRef}
          onClick={handleCanvasClick}
          className={clsx('block max-w-full', activeField && 'cursor-crosshair')}
        />
        {FIELDS.map((f) => {
          const pos = markers[f.key]
          if (!pos) return null
          return (
            <div
              key={f.key}
              className="pointer-events-none absolute -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow"
              style={{
                left: `${pos.x * 100}%`,
                top: `${pos.y * 100}%`,
                width: 16,
                height: 16,
                backgroundColor: f.color,
              }}
              title={f.label}
            />
          )
        })}
      </div>
      <div className="flex items-center justify-end gap-2">
        <button
          onClick={handleSave}
          disabled={!allSet}
          className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Save positions
        </button>
      </div>
    </div>
  )
}
