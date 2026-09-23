import { supabase } from '@/lib/supabase'
import type { Client } from '@/types'

// Sends a real Supabase magic link. For a brand-new user this also creates
// their auth.users row immediately with this metadata attached — a Postgres
// trigger (`handle_new_user`, set up in Supabase) reads it to create the
// matching `profiles` row (role: 'client', linked client_id) as soon as the
// account exists, before they've even clicked the link.
//
// Supabase only applies that metadata the FIRST time an email signs up —
// re-inviting an email that already has an account (e.g. re-linking them to
// a different client) silently does nothing to their metadata. The
// `link_client_invite` RPC (a SECURITY DEFINER function, agency-only) always
// correctly (re)links the account regardless of whether it's brand new or
// already existed, so it's called every time as the source of truth.
export async function inviteClientUser(rawEmail: string, client: Client): Promise<{ error: string | null }> {
  const email = rawEmail.trim().toLowerCase()
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
  if (error) return { error: error.message }

  const { error: linkError } = await supabase.rpc('link_client_invite', {
    target_email: email,
    target_role: 'client',
    target_client_id: Number(client.id),
    target_full_name: client.name,
  })
  return { error: linkError?.message ?? null }
}
