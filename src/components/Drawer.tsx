import type { ReactNode } from 'react'
import { X } from 'lucide-react'

interface DrawerProps {
  open: boolean
  onClose: () => void
  title: string
  children: ReactNode
}

export default function Drawer({ open, onClose, title, children }: DrawerProps) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="relative flex h-full w-full max-w-md flex-col bg-white shadow-pop">
        <div className="flex items-center justify-between border-b border-black/[0.06] px-5 py-4">
          <h2 className="text-base font-semibold text-ink-primary">{title}</h2>
          <button
            onClick={onClose}
            className="flex h-7 w-7 items-center justify-center rounded-lg text-ink-muted hover:bg-surface-sunken hover:text-ink-primary"
            aria-label="Close"
          >
            <X size={16} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-5 py-4">{children}</div>
      </div>
    </div>
  )
}
