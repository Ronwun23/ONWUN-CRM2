import { supabase } from '@/lib/supabase'
import type { AcquisitionProfile } from '@/types'

interface AcquisitionProfileRow {
  id: number
  niche: string
  countries: string
  who_exactly: string | null
  what_we_sell: string | null
  price: string | null
  call_days: string | null
  past_work_what: string | null
  past_work_why: string | null
  updated_at: string
}

function rowToProfile(row: AcquisitionProfileRow): AcquisitionProfile {
  return {
    id: String(row.id),
    niche: row.niche,
    countries: row.countries,
    whoExactly: row.who_exactly ?? undefined,
    whatWeSell: row.what_we_sell ?? undefined,
    price: row.price ?? undefined,
    callDays: row.call_days ?? undefined,
    pastWorkWhat: row.past_work_what ?? undefined,
    pastWorkWhy: row.past_work_why ?? undefined,
    updatedAt: row.updated_at,
  }
}

// A singleton — one row for the whole studio. null means nobody has
// filled in the brief yet.
export async function fetchAcquisitionProfile(): Promise<AcquisitionProfile | null> {
  const { data, error } = await supabase.from('acquisition_profile').select('*').order('id', { ascending: true }).limit(1)
  if (error) throw error
  const row = (data as AcquisitionProfileRow[])[0]
  return row ? rowToProfile(row) : null
}

export async function saveAcquisitionProfile(
  existingId: string | undefined,
  input: Omit<AcquisitionProfile, 'id' | 'updatedAt'>
): Promise<AcquisitionProfile> {
  const row = {
    niche: input.niche,
    countries: input.countries,
    who_exactly: input.whoExactly ?? null,
    what_we_sell: input.whatWeSell ?? null,
    price: input.price ?? null,
    call_days: input.callDays ?? null,
    past_work_what: input.pastWorkWhat ?? null,
    past_work_why: input.pastWorkWhy ?? null,
    updated_at: new Date().toISOString(),
  }

  if (existingId) {
    const { data, error } = await supabase
      .from('acquisition_profile')
      .update(row)
      .eq('id', Number(existingId))
      .select()
      .single()
    if (error) throw error
    return rowToProfile(data as AcquisitionProfileRow)
  }

  const { data, error } = await supabase.from('acquisition_profile').insert(row).select().single()
  if (error) throw error
  return rowToProfile(data as AcquisitionProfileRow)
}
