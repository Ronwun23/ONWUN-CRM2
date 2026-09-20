import { useEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { Maximize2, Minimize2 } from 'lucide-react'
import clsx from 'clsx'

export default function FullscreenViewer({ children, className }: { children: ReactNode; className?: string }) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [isFullscreen, setIsFullscreen] = useState(false)

  useEffect(() => {
    const handleChange = () => setIsFullscreen(document.fullscreenElement === containerRef.current)
    document.addEventListener('fullscreenchange', handleChange)
    return () => document.removeEventListener('fullscreenchange', handleChange)
  }, [])

  const toggle = () => {
    if (document.fullscreenElement) {
      document.exitFullscreen()
    } else {
      containerRef.current?.requestFullscreen()
    }
  }

  return (
    <div
      ref={containerRef}
      className={clsx('relative flex flex-col overflow-hidden bg-black', isFullscreen && 'items-center justify-center', className)}
    >
      {children}
      <button
        onClick={toggle}
        className="absolute right-3 top-3 z-10 flex h-8 w-8 items-center justify-center rounded-lg bg-black/50 text-white hover:bg-black/70"
        aria-label={isFullscreen ? 'Exit fullscreen' : 'View fullscreen'}
        title={isFullscreen ? 'Exit fullscreen' : 'View fullscreen'}
      >
        {isFullscreen ? <Minimize2 size={15} /> : <Maximize2 size={15} />}
      </button>
    </div>
  )
}
