import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { useLocation } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'

// Lets an agency user preview a client's portal exactly as that client would
// see it — same workshop, same answers, but without agency-only tools like
// the AI strategy generator, the Strategy document, or the sidebar's route
// back to every other client. It lives above Layout (see main.tsx/App.tsx)
// so both the sidebar and the client pages can read it, and it auto-resets
// whenever you navigate to a different client or out of a client entirely.
// It's a preview toggle, not persisted client data, so it also resets on reload.
//
// A real client account (profile.role === 'client') is always in this mode —
// it isn't a toggle for them, it's just what their account is. Reusing the
// same flag means every page that already hides agency-only controls behind
// `isClientView` works correctly for a real client for free.
interface ViewModeContextValue {
  isClientView: boolean
  setIsClientView: (value: boolean) => void
}

const ViewModeContext = createContext<ViewModeContextValue | null>(null)

export function ViewModeProvider({ children }: { children: ReactNode }) {
  const { profile } = useAuth()
  const isRealClient = profile?.role === 'client'
  const [previewAsClient, setPreviewAsClient] = useState(false)
  const location = useLocation()
  const clientId = location.pathname.match(/^\/clients\/([^/]+)/)?.[1] ?? null

  useEffect(() => {
    setPreviewAsClient(false)
  }, [clientId])

  const isClientView = isRealClient || previewAsClient
  const setIsClientView = useCallback(
    (value: boolean) => {
      if (!isRealClient) setPreviewAsClient(value)
    },
    [isRealClient]
  )

  const value = useMemo(() => ({ isClientView, setIsClientView }), [isClientView, setIsClientView])
  return <ViewModeContext.Provider value={value}>{children}</ViewModeContext.Provider>
}

export function useViewMode() {
  const ctx = useContext(ViewModeContext)
  if (!ctx) throw new Error('useViewMode must be used within a ViewModeProvider')
  return ctx
}
