import { useRef, useState } from 'react'
import type { PointerEvent } from 'react'

const WIDTH = 480
const HEIGHT = 180

export default function SignaturePad({
  onSign,
  onCancel,
}: {
  onSign: (signatureDataUrl: string) => void
  onCancel: () => void
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const drawing = useRef(false)
  const [hasSignature, setHasSignature] = useState(false)

  // Maps a pointer event to canvas drawing-buffer coordinates, not CSS
  // pixels — the two differ whenever the canvas is scaled by layout (e.g.
  // shrunk to fit a narrow screen via max-w-full), and drawing in raw CSS
  // coordinates there would put the line well off from the cursor.
  const getPos = (e: PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current!
    const rect = canvas.getBoundingClientRect()
    const scaleX = canvas.width / rect.width
    const scaleY = canvas.height / rect.height
    return { x: (e.clientX - rect.left) * scaleX, y: (e.clientY - rect.top) * scaleY }
  }

  const start = (e: PointerEvent<HTMLCanvasElement>) => {
    drawing.current = true
    const ctx = canvasRef.current!.getContext('2d')!
    const { x, y } = getPos(e)
    ctx.beginPath()
    ctx.moveTo(x, y)
  }

  const move = (e: PointerEvent<HTMLCanvasElement>) => {
    if (!drawing.current) return
    const ctx = canvasRef.current!.getContext('2d')!
    const { x, y } = getPos(e)
    ctx.strokeStyle = '#1a1a1a'
    ctx.lineWidth = 2
    ctx.lineCap = 'round'
    ctx.lineTo(x, y)
    ctx.stroke()
    setHasSignature(true)
  }

  const stop = () => {
    drawing.current = false
  }

  const clear = () => {
    const canvas = canvasRef.current!
    canvas.getContext('2d')!.clearRect(0, 0, canvas.width, canvas.height)
    setHasSignature(false)
  }

  const confirm = () => {
    onSign(canvasRef.current!.toDataURL('image/png'))
  }

  return (
    <div className="flex flex-col gap-3">
      <canvas
        ref={canvasRef}
        width={WIDTH}
        height={HEIGHT}
        className="h-[180px] w-[480px] max-w-full touch-none rounded-lg border border-black/[0.10] bg-surface-sunken"
        onPointerDown={start}
        onPointerMove={move}
        onPointerUp={stop}
        onPointerLeave={stop}
      />
      <div className="flex items-center justify-between">
        <button onClick={clear} className="text-xs font-medium text-ink-muted hover:text-ink-primary">
          Clear
        </button>
        <div className="flex items-center gap-2">
          <button
            onClick={onCancel}
            className="rounded-lg border border-black/[0.10] bg-white px-3.5 py-2 text-sm font-medium text-ink-secondary hover:bg-surface-sunken"
          >
            Cancel
          </button>
          <button
            onClick={confirm}
            disabled={!hasSignature}
            className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Sign
          </button>
        </div>
      </div>
    </div>
  )
}
