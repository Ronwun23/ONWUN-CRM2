import type { ReactNode } from 'react'
import { useAuth } from '@/context/AuthContext'
import Login from '@/pages/Login'

function NoAccess() {
  const { signOut } = useAuth()
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-surface-page px-4 text-center">
      <p className="text-sm text-ink-primary">This account isn't set up for access yet.</p>
      <p className="max-w-xs text-xs text-ink-muted">Ask Onwun to invite this email, or sign in with a different one.</p>
      <button
        onClick={() => signOut()}
        className="mt-1 rounded-lg bg-brand-500 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-600"
      >
        Sign out
      </button>
    </div>
  )
}

export default function AuthGate({ children }: { children: ReactNode }) {
  const { session, loading, profile, profileLoading } = useAuth()

  if (loading || (session && profileLoading)) {
    return <div className="flex min-h-screen items-center justify-center bg-surface-page text-sm text-ink-muted">Loading…</div>
  }

  if (!session) {
    return <Login />
  }

  if (!profile) {
    return <NoAccess />
  }

  return <>{children}</>
}
