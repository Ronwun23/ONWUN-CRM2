import { useEffect, useRef } from 'react'
import type { ReactNode } from 'react'
import { X } from 'lucide-react'

// Centered dialog, built on the native <dialog> element — same approach as
// ConfirmDialogHost, so it gets a real backdrop, focus trap and Escape-to-
// close for free. Use this instead of Drawer when a form reads better as a
// centered card than a side panel.
export default function Modal({
  open,
  onClose,
  title,
  subtitle,
  children,
}: {
  open: boolean
  onClose: () => void
  title: string
  subtitle?: string
  children: ReactNode
}) {
  const dialogRef = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return
    if (open) {
      if (!dialog.open) dialog.showModal()
    } else if (dialog.open) {
      dialog.close()
    }
  }, [open])

  return (
    <dialog
      ref={dialogRef}
      onCancel={(e) => {
        e.preventDefault()
        onClose()
      }}
      onClick={(e) => {
        if (e.target === dialogRef.current) onClose()
      }}
      className="m-auto w-full max-w-xl rounded-xl border border-black/[0.08] bg-white p-0 shadow-pop backdrop:bg-black/40"
    >
      <div className="flex items-start justify-between border-b border-black/[0.06] px-6 py-4">
        <div>
          <h2 className="text-base font-semibold text-ink-primary">{title}</h2>
          {subtitle && <p className="mt-0.5 text-sm text-ink-secondary">{subtitle}</p>}
        </div>
        <button
          onClick={onClose}
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-ink-muted hover:bg-surface-sunken hover:text-ink-primary"
          aria-label="Close"
        >
          <X size={16} />
        </button>
      </div>
      <div className="max-h-[90vh] overflow-y-auto p-6">{children}</div>
    </dialog>
  )
}
