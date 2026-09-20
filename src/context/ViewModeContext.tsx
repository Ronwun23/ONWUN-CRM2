import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { useLocation } from 'react-router-dom'

// Lets an agency user preview a client's portal exactly as that client would
// see it — same workshop, same answers, but without agency-only tools like
// the AI strategy generator, the Strategy document, or the sidebar's route
// back to every other client. It lives above Layout (see main.tsx/App.tsx)
// so both the sidebar and the client pages can read it, and it auto-resets
// whenever you navigate to a different client or out of a client entirely.
// It's a preview toggle, not persisted client data, so it also resets on reload.
interface ViewModeContextValue {
  isClientView: boolean
  setIsClientView: (value: boolean) => void
}

const ViewModeContext = createContext<ViewModeContextValue | null>(null)

export function ViewModeProvider({ children }: { children: ReactNode }) {
  const [isClientView, setIsClientView] = useState(false)
  const location = useLocation()
  const clientId = location.pathname.match(/^\/clients\/([^/]+)/)?.[1] ?? null

  useEffect(() => {
    setIsClientView(false)
  }, [clientId])

  const value = useMemo(() => ({ isClientView, setIsClientView }), [isClientView])
  return <ViewModeContext.Provider value={value}>{children}</ViewModeContext.Provider>
}

export function useViewMode() {
  const ctx = useContext(ViewModeContext)
  if (!ctx) throw new Error('useViewMode must be used within a ViewModeProvider')
  return ctx
}
