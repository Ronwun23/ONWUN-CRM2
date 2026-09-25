import { useEffect, useRef, useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import * as pdfjsLib from 'pdfjs-dist'
import type { OnProgressParameters, PDFDocumentProxy, RenderTask } from 'pdfjs-dist'
import PdfWorkerUrl from 'pdfjs-dist/build/pdf.worker.mjs?url'
import ProgressRing from '@/components/ProgressRing'
import Spinner from '@/components/Spinner'

pdfjsLib.GlobalWorkerOptions.workerSrc = PdfWorkerUrl

export default function PdfPageViewer({
  url,
  onPageChange,
}: {
  url: string
  onPageChange?: (page: number, numPages: number) => void
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const pdfRef = useRef<PDFDocumentProxy | null>(null)
  const renderTaskRef = useRef<RenderTask | null>(null)
  const [numPages, setNumPages] = useState(0)
  const [pageNum, setPageNum] = useState(1)
  const [error, setError] = useState<string | null>(null)
  // Re-render at the sharpest scale for however big the viewer currently is
  // (fills the width fullscreen resizes to, and accounts for Retina/HiDPI
  // screens) instead of a fixed scale that goes soft when stretched bigger.
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 })
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
    const container = containerRef.current
    if (!container) return
    const observer = new ResizeObserver((entries) => {
      const { width, height } = entries[0].contentRect
      setContainerSize({ width, height })
    })
    observer.observe(container)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    const pdf = pdfRef.current
    const canvas = canvasRef.current
    if (!pdf || !canvas || !containerSize.width || !containerSize.height) return
    let cancelled = false

    pdf.getPage(pageNum).then((page) => {
      if (cancelled) return
      renderTaskRef.current?.cancel()

      // Fit the page inside the current viewer size, then render at that
      // many device pixels (capped) so it stays crisp on Retina/HiDPI
      // screens and when the viewer grows (e.g. fullscreen) — instead of a
      // fixed scale that's just CSS-stretched bigger and looks worse.
      const unscaled = page.getViewport({ scale: 1 })
      const fitScale = Math.min(containerSize.width / unscaled.width, containerSize.height / unscaled.height)
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      const renderScale = fitScale * dpr
      const viewport = page.getViewport({ scale: renderScale })

      canvas.width = viewport.width
      canvas.height = viewport.height
      canvas.style.width = `${unscaled.width * fitScale}px`
      canvas.style.height = `${unscaled.height * fitScale}px`

      const context = canvas.getContext('2d')
      if (!context) return
      const task = page.render({ canvasContext: context, viewport })
      renderTaskRef.current = task
      task.promise.catch(() => {})
    })

    return () => {
      cancelled = true
    }
  }, [pageNum, numPages, containerSize.width, containerSize.height])

  if (error) {
    return (
      <div className="flex aspect-video w-full items-center justify-center rounded-xl bg-black text-sm text-white/60">
        {error}
      </div>
    )
  }

  if (numPages === 0) {
    return (
      <div className="flex aspect-video w-full flex-col items-center justify-center gap-2 rounded-xl bg-black text-white/60">
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
      <div ref={containerRef} className="flex min-h-[420px] flex-1 items-center justify-center overflow-auto p-6">
        <canvas ref={canvasRef} className="shadow-2xl" />
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
