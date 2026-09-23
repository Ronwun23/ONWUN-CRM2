import { useEffect, useRef, useState } from 'react'
import clsx from 'clsx'
import { registerConfirmHandler } from '@/lib/confirm'
import type { ConfirmRequest } from '@/lib/confirm'

// Single <dialog>, mounted once at the app root, that every confirmAction()
// call reuses — see src/lib/confirm.ts. Built on the native <dialog>
// element rather than a styled <div> overlay: showModal() puts it in the
// browser's top layer, makes the rest of the page inert, traps focus,
// closes on Escape (the 'cancel' event below) and gives a real ::backdrop
// for free, none of which a manually-built modal gets without extra work.
export default function ConfirmDialogHost() {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const [pending, setPending] = useState<ConfirmRequest | null>(null)

  useEffect(() => {
    registerConfirmHandler(setPending)
    return () => registerConfirmHandler(null)
  }, [])

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return
    if (pending) {
      if (!dialog.open) dialog.showModal()
    } else if (dialog.open) {
      dialog.close()
    }
  }, [pending])

  const settle = (confirmed: boolean) => {
    pending?.resolve(confirmed)
    setPending(null)
  }

  return (
    <dialog
      ref={dialogRef}
      onCancel={(e) => {
        // Escape fires 'cancel' before 'close' — treat it the same as
        // clicking Cancel instead of leaving the promise unresolved.
        e.preventDefault()
        settle(false)
      }}
      onClick={(e) => {
        // A click that lands on the <dialog> element itself (not a child)
        // is a click on ::backdrop — native <dialog> doesn't close on that
        // by default.
        if (e.target === dialogRef.current) settle(false)
      }}
      className="m-auto max-w-sm rounded-xl border border-black/[0.08] bg-white p-0 shadow-pop backdrop:bg-black/40"
    >
      {pending && (
        <div className="p-5">
          {pending.options?.title && (
            <h2 className="mb-1.5 text-base font-semibold text-ink-primary">{pending.options.title}</h2>
          )}
          <p className="text-sm text-ink-secondary">{pending.message}</p>
          <div className="mt-5 flex justify-end gap-2">
            <button
              autoFocus
              onClick={() => settle(false)}
              className="rounded-lg border border-black/[0.10] bg-white px-3.5 py-2 text-sm font-medium text-ink-secondary hover:bg-surface-sunken"
            >
              {pending.options?.cancelLabel ?? 'Cancel'}
            </button>
            <button
              onClick={() => settle(true)}
              className={clsx(
                'rounded-lg px-3.5 py-2 text-sm font-semibold text-white',
                pending.options?.destructive ? 'bg-status-critical hover:bg-status-critical/90' : 'bg-brand-500 hover:bg-brand-600'
              )}
            >
              {pending.options?.confirmLabel ?? 'Confirm'}
            </button>
          </div>
        </div>
      )}
    </dialog>
  )
}
