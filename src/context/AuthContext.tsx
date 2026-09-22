import { createContext, useContext, useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'

export interface Profile {
  id: string
  role: 'agency' | 'client'
  client_id: number | null
  full_name: string | null
}

interface AuthContextValue {
  session: Session | null
  profile: Profile | null
  loading: boolean
  profileLoading: boolean
  linkError: string | null
  signInWithEmail: (email: string) => Promise<{ error: string | null }>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

// Supabase leaves the magic-link result as a #-fragment in the URL after
// processing it — clean that up so a failed/expired link doesn't sit in
// the address bar, and surface a message instead of silently failing.
function readAndClearUrlError(): string | null {
  const hash = new URLSearchParams(window.location.hash.slice(1))
  const errorDescription = hash.get('error_description')
  if (window.location.hash) {
    window.history.replaceState({}, '', window.location.pathname + window.location.search)
  }
  return errorDescription ? errorDescription.replace(/\+/g, ' ') : null
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [profileLoading, setProfileLoading] = useState(true)
  const [linkError, setLinkError] = useState<string | null>(null)

  useEffect(() => {
    const urlError = readAndClearUrlError()
    if (urlError) setLinkError(urlError)

    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setLoading(false)
    })
    const { data: listener } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession)
    })
    return () => listener.subscription.unsubscribe()
  }, [])

  // Keyed on the user id, not the `session` object itself — Supabase
  // silently issues a new session object (same user) on token refresh,
  // which happens automatically whenever the tab regains focus. Depending
  // on the whole object would re-fetch the profile and flash "Loading…"
  // on every tab switch even though nothing about the user changed.
  const userId = session?.user.id

  useEffect(() => {
    if (!session) {
      setProfile(null)
      setProfileLoading(false)
      return
    }
    setProfileLoading(true)
    supabase
      .from('profiles')
      .select('id, role, client_id, full_name')
      .eq('id', session.user.id)
      .single()
      .then(
        ({ data }) => {
          setProfile(data as Profile | null)
          setProfileLoading(false)
        },
        () => {
          // A network-level failure (not a Supabase error response) would
          // otherwise leave profileLoading stuck true forever — fall back to
          // "no profile" so AuthGate can show a real state instead of hanging.
          setProfile(null)
          setProfileLoading(false)
        }
      )
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId])

  const signInWithEmail = async (email: string) => {
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: window.location.origin },
    })
    return { error: error?.message ?? null }
  }

  const signOut = async () => {
    await supabase.auth.signOut()
  }

  return (
    <AuthContext.Provider value={{ session, profile, loading, profileLoading, linkError, signInWithEmail, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
