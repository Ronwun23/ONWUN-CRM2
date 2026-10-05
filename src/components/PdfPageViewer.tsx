import { useEffect, useRef, useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import clsx from 'clsx'
import * as pdfjsLib from 'pdfjs-dist'
import type { OnProgressParameters, PDFDocumentProxy, RenderTask } from 'pdfjs-dist'
import PdfWorkerUrl from 'pdfjs-dist/build/pdf.worker.mjs?url'
import ProgressRing from '@/components/ProgressRing'
import Spinner from '@/components/Spinner'

pdfjsLib.GlobalWorkerOptions.workerSrc = PdfWorkerUrl

export default function PdfPageViewer({
  url,
  onPageChange,
  // Caps the rendered page's height to the viewport so a full A4 page is
  // visible without scrolling, instead of rendering it at full size.
  fitToView,
}: {
  url: string
  onPageChange?: (page: number, numPages: number) => void
  fitToView?: boolean
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const pdfRef = useRef<PDFDocumentProxy | null>(null)
  const renderTaskRef = useRef<RenderTask | null>(null)
  const [numPages, setNumPages] = useState(0)
  const [pageNum, setPageNum] = useState(1)
  const [error, setError] = useState<string | null>(null)
  // null = total byte size not yet known (server didn't send a
  // content-length) — fall back to an indeterminate spinner until it is.
  const [downloadPercent, setDownloadPercent] = useState<number | null>(null)

  useEffect(() => {
    if (numPages > 0) onPageChange?.(pageNum, numPages)
  }, [pageNum, numPages, onPageChange])

  useEffect(() => {
    let cancelled = false
    setError(null)
    setNumPages(0)
    setDownloadPercent(null)
    const loadingTask = pdfjsLib.getDocument(url)
    loadingTask.onProgress = ({ loaded, total }: OnProgressParameters) => {
      if (cancelled) return
      setDownloadPercent(total ? Math.min(100, (loaded / total) * 100) : null)
    }
    loadingTask.promise
      .then((pdf) => {
        if (cancelled) return
        pdfRef.current = pdf
        setNumPages(pdf.numPages)
        setPageNum(1)
      })
      .catch(() => {
        if (!cancelled) setError("Couldn't load this PDF.")
      })
    return () => {
      cancelled = true
      loadingTask.destroy()
    }
  }, [url])

  useEffect(() => {
    const pdf = pdfRef.current
    const canvas = canvasRef.current
    if (!pdf || !canvas) return
    let cancelled = false

    pdf.getPage(pageNum).then((page) => {
      if (cancelled) return
      renderTaskRef.current?.cancel()
      const viewport = page.getViewport({ scale: 1.6 })
      canvas.width = viewport.width
      canvas.height = viewport.height
      const context = canvas.getContext('2d')
      if (!context) return
      const task = page.render({ canvasContext: context, viewport })
      renderTaskRef.current = task
      task.promise.catch(() => {})
    })

    return () => {
      cancelled = true
    }
  }, [pageNum, numPages])

  if (error) {
    return (
      <div
        className={clsx(
          'flex items-center justify-center rounded-xl bg-black text-sm text-white/60',
          fitToView ? 'aspect-[595/842] h-[100vh]' : 'aspect-video w-full'
        )}
      >
        {error}
      </div>
    )
  }

  if (numPages === 0) {
    return (
      <div
        className={clsx(
          'flex flex-col items-center justify-center gap-2 rounded-xl bg-black text-white/60',
          fitToView ? 'aspect-[595/842] h-[100vh]' : 'aspect-video w-full'
        )}
      >
        {downloadPercent !== null ? (
          <ProgressRing value={downloadPercent} label="Downloading PDF" />
        ) : (
          <>
            <Spinner size={24} label="Downloading PDF" />
            <span className="text-xs">Downloading…</span>
          </>
        )}
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-xl bg-black">
      <div className={clsx('flex flex-1 items-center justify-center overflow-auto p-6', fitToView ? 'min-h-0' : 'min-h-[420px]')}>
        <canvas
          ref={canvasRef}
          className={clsx('max-w-full shadow-2xl', fitToView ? 'max-h-[100vh]' : 'max-h-full')}
        />
      </div>
      {numPages > 1 && (
        <div className="flex items-center justify-center gap-4 border-t border-white/10 py-3">
          <button
            onClick={() => setPageNum((p) => Math.max(1, p - 1))}
            disabled={pageNum <= 1}
            className="flex h-8 w-8 items-center justify-center rounded-full text-white/70 hover:bg-white/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-30"
            aria-label="Previous page"
          >
            <ChevronLeft size={16} />
          </button>
          <p className="text-xs font-medium tabular-nums text-white/70">
            {pageNum} / {numPages}
          </p>
          <button
            onClick={() => setPageNum((p) => Math.min(numPages, p + 1))}
            disabled={pageNum >= numPages}
            className="flex h-8 w-8 items-center justify-center rounded-full text-white/70 hover:bg-white/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-30"
            aria-label="Next page"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      )}
    </div>
  )
}
