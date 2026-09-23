export interface ConfirmOptions {
  title?: string
  confirmLabel?: string
  cancelLabel?: string
  /** Red confirm button, for a destructive action (delete, remove). */
  destructive?: boolean
}

export interface ConfirmRequest {
  message: string
  options?: ConfirmOptions
  resolve: (confirmed: boolean) => void
}

let requestHandler: ((request: ConfirmRequest) => void) | null = null

// Set once by <ConfirmDialogHost>, mounted at the app root — every confirm()
// call below routes through whichever instance is currently registered.
export function registerConfirmHandler(handler: ((request: ConfirmRequest) => void) | null) {
  requestHandler = handler
}

// Promise-based replacement for window.confirm() — resolves true/false
// instead of blocking the main thread, and renders as a real <dialog>
// (native focus trap, Escape-to-cancel, ::backdrop) instead of the
// browser's own unstyled confirm() popup.
export function confirmAction(message: string, options?: ConfirmOptions): Promise<boolean> {
  return new Promise((resolve) => {
    if (!requestHandler) {
      // ConfirmDialogHost should always be mounted — this is just a safety
      // net in case confirmAction is ever called before it is.
      resolve(window.confirm(message))
      return
    }
    requestHandler({ message, options, resolve })
  })
}
