import type { ReactNode } from 'react'
import { useAuth } from '@/context/AuthContext'
import Login from '@/pages/Login'

export default function AuthGate({ children }: { children: ReactNode }) {
  const { session, loading } = useAuth()

  if (loading) {
    return <div className="flex min-h-screen items-center justify-center bg-surface-page text-sm text-ink-muted">Loading…</div>
  }

  if (!session) {
    return <Login />
  }

  return <>{children}</>
}
