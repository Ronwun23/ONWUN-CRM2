import { createContext, useContext, useMemo, useState } from 'react'
import type { ReactNode } from 'react'

// Lets an agency user preview a client's portal exactly as that client would
// see it — same workshop, same answers, but without agency-only tools like
// the AI strategy generator or the Strategy document. Scoped per client (see
// the `key={clientId}` on the provider in ClientLayout) and resets on reload;
// it's a preview toggle, not persisted client data.
interface ViewModeContextValue {
  isClientView: boolean
  setIsClientView: (value: boolean) => void
}

const ViewModeContext = createContext<ViewModeContextValue | null>(null)

export function ViewModeProvider({ children }: { children: ReactNode }) {
  const [isClientView, setIsClientView] = useState(false)
  const value = useMemo(() => ({ isClientView, setIsClientView }), [isClientView])
  return <ViewModeContext.Provider value={value}>{children}</ViewModeContext.Provider>
}

export function useViewMode() {
  const ctx = useContext(ViewModeContext)
  if (!ctx) throw new Error('useViewMode must be used within a ViewModeProvider')
  return ctx
}
