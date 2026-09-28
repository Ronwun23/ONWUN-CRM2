import { supabase } from '@/lib/supabase'
import type { Deal, DealPriority, DealStage } from '@/types'

interface DealRow {
  id: number
  title: string
  value: number | null
  currency: string
  stage: string
  priority: string
  contact_id: number | null
  contact_name: string | null
  contact_country: string | null
  created_at: string
  updated_at: string
}

function rowToDeal(row: DealRow): Deal {
  return {
    id: String(row.id),
    title: row.title,
    value: row.value ?? undefined,
    currency: row.currency,
    stage: row.stage as DealStage,
    priority: row.priority as DealPriority,
    contactId: row.contact_id ? String(row.contact_id) : undefined,
    contactName: row.contact_name ?? undefined,
    contactCountry: row.contact_country ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

export async function fetchDeals(): Promise<Deal[]> {
  const { data, error } = await supabase.from('deals').select('*').order('id', { ascending: false })
  if (error) throw error
  return (data as DealRow[]).map(rowToDeal)
}

export async function insertDeal(deal: {
  title: string
  value?: number
  currency: string
  stage: DealStage
  priority: DealPriority
  contactId?: string
  contactName?: string
  contactCountry?: string
}): Promise<Deal> {
  const { data, error } = await supabase
    .from('deals')
    .insert({
      title: deal.title,
      value: deal.value ?? null,
      currency: deal.currency,
      stage: deal.stage,
      priority: deal.priority,
      contact_id: deal.contactId ? Number(deal.contactId) : null,
      contact_name: deal.contactName ?? null,
      contact_country: deal.contactCountry ?? null,
    })
    .select()
    .single()
  if (error) throw error
  return rowToDeal(data as DealRow)
}

export async function updateDealRow(dealId: string, patch: Record<string, unknown>): Promise<void> {
  const { error } = await supabase
    .from('deals')
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq('id', Number(dealId))
  if (error) throw error
}

export async function deleteDealRow(dealId: string): Promise<void> {
  const { error } = await supabase.from('deals').delete().eq('id', Number(dealId))
  if (error) throw error
}
