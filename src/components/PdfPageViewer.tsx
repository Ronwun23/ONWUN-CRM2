import { useEffect, useRef, useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import * as pdfjsLib from 'pdfjs-dist'
import type { PDFDocumentProxy, RenderTask } from 'pdfjs-dist'
import PdfWorkerUrl from 'pdfjs-dist/build/pdf.worker.mjs?url'

pdfjsLib.GlobalWorkerOptions.workerSrc = PdfWorkerUrl

export default function PdfPageViewer({
  url,
  onPageChange,
}: {
  url: string
  onPageChange?: (page: number, numPages: number) => void
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const pdfRef = useRef<PDFDocumentProxy | null>(null)
  const renderTaskRef = useRef<RenderTask | null>(null)
  const [numPages, setNumPages] = useState(0)
  const [pageNum, setPageNum] = useState(1)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (numPages > 0) onPageChange?.(pageNum, numPages)
  }, [pageNum, numPages, onPageChange])

  useEffect(() => {
    let cancelled = false
    setError(null)
    setNumPages(0)
    pdfjsLib
      .getDocument(url)
      .promise.then((pdf) => {
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
      pdfRef.current?.destroy()
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
      <div className="flex aspect-video w-full items-center justify-center rounded-xl bg-black text-sm text-white/60">
        {error}
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-xl bg-black">
      <div className="flex min-h-[420px] flex-1 items-center justify-center overflow-auto p-6">
        <canvas ref={canvasRef} className="max-h-full max-w-full shadow-2xl" />
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
