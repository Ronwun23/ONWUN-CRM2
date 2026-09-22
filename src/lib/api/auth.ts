import { supabase } from '@/lib/supabase'
import type { Client } from '@/types'

// Sends a real Supabase magic link. For a brand-new user this also creates
// their auth.users row immediately with this metadata attached — a Postgres
// trigger (`handle_new_user`, set up in Supabase) reads it to create the
// matching `profiles` row (role: 'client', linked client_id) as soon as the
// account exists, before they've even clicked the link.
export async function inviteClientUser(email: string, client: Client): Promise<{ error: string | null }> {
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: window.location.origin,
      data: {
        role: 'client',
        client_id: Number(client.id),
        full_name: client.name,
      },
    },
  })
  return { error: error?.message ?? null }
}
