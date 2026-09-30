import { createContext, useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import { X } from 'lucide-react'

// A native <dialog> opened with showModal() makes everything outside it
// inert, including anything a Radix Portal (e.g. <Select>) renders into
// document.body by default — the dropdown opens but nothing inside it is
// clickable. Anything portalling needs to target this dialog node instead.
export const ModalContainerContext = createContext<HTMLElement | null>(null)

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
  maxWidthClassName = 'max-w-xl',
}: {
  open: boolean
  onClose: () => void
  title: string
  subtitle?: string
  children: ReactNode
  maxWidthClassName?: string
}) {
  const [dialogNode, setDialogNode] = useState<HTMLDialogElement | null>(null)

  useEffect(() => {
    if (!dialogNode) return
    if (open) {
      if (!dialogNode.open) dialogNode.showModal()
    } else if (dialogNode.open) {
      dialogNode.close()
    }
  }, [open, dialogNode])

  return (
    <dialog
      ref={setDialogNode}
      onCancel={(e) => {
        e.preventDefault()
        onClose()
      }}
      onClick={(e) => {
        if (e.target === dialogNode) onClose()
      }}
      className={`m-auto w-full ${maxWidthClassName} rounded-xl border border-black/[0.08] bg-white p-0 shadow-pop`}
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
      <div className="max-h-[90vh] overflow-y-auto p-6">
        <ModalContainerContext.Provider value={dialogNode}>{children}</ModalContainerContext.Provider>
      </div>
    </dialog>
  )
}
