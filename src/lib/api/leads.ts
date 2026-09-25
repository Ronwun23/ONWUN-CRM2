import { supabase } from '@/lib/supabase'
import type { Lead, LeadStatus, SequenceStep, SequenceStepType, Touch, TouchKind } from '@/types'
import { SEQUENCE_STEP_ORDER, type SequenceStepPlan } from '@/lib/leadOutcomes'

// Postgres/PostgREST doesn't guarantee a bulk insert's returned rows are in
// the same order as the array that was sent — always re-sort by the
// canonical step order rather than trusting array position.
function sortSteps(steps: SequenceStep[]): SequenceStep[] {
  return [...steps].sort((a, b) => SEQUENCE_STEP_ORDER.indexOf(a.stepType) - SEQUENCE_STEP_ORDER.indexOf(b.stepType))
}

interface LeadRow {
  id: number
  company_name: string
  website: string | null
  platform: string | null
  contact_name: string | null
  contact_email: string | null
  country: string | null
  why_fits: string | null
  noticed_note: string | null
  status: string
  owner: string
  not_now_until: string | null
  converted_client_id: number | null
  created_at: string
  updated_at: string
}

interface SequenceStepRow {
  id: number
  lead_id: number
  step_type: string
  due_date: string
  done: boolean
  done_at: string | null
  order_index: number
}

interface TouchRow {
  id: number
  lead_id: number
  kind: string
  note: string | null
  created_at: string
}

function rowToLead(row: LeadRow): Omit<Lead, 'steps' | 'touches'> {
  return {
    id: String(row.id),
    companyName: row.company_name,
    website: row.website ?? undefined,
    platform: row.platform ?? undefined,
    contactName: row.contact_name ?? undefined,
    contactEmail: row.contact_email ?? undefined,
    country: row.country ?? undefined,
    whyFits: row.why_fits ?? undefined,
    noticedNote: row.noticed_note ?? undefined,
    status: row.status as LeadStatus,
    owner: row.owner,
    notNowUntil: row.not_now_until ?? undefined,
    convertedClientId: row.converted_client_id ? String(row.converted_client_id) : undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

function rowToStep(row: SequenceStepRow): SequenceStep {
  return {
    id: String(row.id),
    stepType: row.step_type as SequenceStepType,
    dueDate: row.due_date,
    done: row.done,
    doneAt: row.done_at ?? undefined,
  }
}

function rowToTouch(row: TouchRow): Touch {
  return {
    id: String(row.id),
    kind: row.kind as TouchKind,
    note: row.note ?? undefined,
    createdAt: row.created_at,
  }
}

export async function fetchLeads(): Promise<Lead[]> {
  const [leadsRes, stepsRes, touchesRes] = await Promise.all([
    supabase.from('leads').select('*').order('id', { ascending: false }),
    supabase.from('sequence_steps').select('*').order('order_index', { ascending: true }),
    supabase.from('touches').select('*').order('created_at', { ascending: false }),
  ])
  if (leadsRes.error) throw leadsRes.error
  if (stepsRes.error) throw stepsRes.error
  if (touchesRes.error) throw touchesRes.error

  const stepsByLead = new Map<string, SequenceStep[]>()
  for (const row of stepsRes.data as SequenceStepRow[]) {
    const leadId = String(row.lead_id)
    if (!stepsByLead.has(leadId)) stepsByLead.set(leadId, [])
    stepsByLead.get(leadId)!.push(rowToStep(row))
  }
  const touchesByLead = new Map<string, Touch[]>()
  for (const row of touchesRes.data as TouchRow[]) {
    const leadId = String(row.lead_id)
    if (!touchesByLead.has(leadId)) touchesByLead.set(leadId, [])
    touchesByLead.get(leadId)!.push(rowToTouch(row))
  }

  return (leadsRes.data as LeadRow[]).map((row) => {
    const id = String(row.id)
    return { ...rowToLead(row), steps: sortSteps(stepsByLead.get(id) ?? []), touches: touchesByLead.get(id) ?? [] }
  })
}

export async function insertLead(lead: {
  companyName: string
  website?: string
  platform?: string
  contactName?: string
  contactEmail?: string
  country?: string
  whyFits?: string
  noticedNote?: string
  owner: string
}): Promise<Lead> {
  const { data, error } = await supabase
    .from('leads')
    .insert({
      company_name: lead.companyName,
      website: lead.website ?? null,
      platform: lead.platform ?? null,
      contact_name: lead.contactName ?? null,
      contact_email: lead.contactEmail ?? null,
      country: lead.country ?? null,
      why_fits: lead.whyFits ?? null,
      noticed_note: lead.noticedNote ?? null,
      status: 'new',
      owner: lead.owner,
    })
    .select()
    .single()
  if (error) throw error
  return { ...rowToLead(data as LeadRow), steps: [], touches: [] }
}

export async function updateLeadRow(leadId: string, patch: Record<string, unknown>): Promise<void> {
  const { error } = await supabase
    .from('leads')
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq('id', Number(leadId))
  if (error) throw error
}

export async function insertSequenceSteps(leadId: string, steps: SequenceStepPlan[]): Promise<SequenceStep[]> {
  const { data, error } = await supabase
    .from('sequence_steps')
    .insert(
      steps.map((s) => ({
        lead_id: Number(leadId),
        step_type: s.stepType,
        due_date: s.dueDate,
        order_index: s.orderIndex,
      }))
    )
    .select()
  if (error) throw error
  return sortSteps((data as SequenceStepRow[]).map(rowToStep))
}

export async function updateSequenceStepRow(stepId: string, patch: Record<string, unknown>): Promise<void> {
  const { error } = await supabase.from('sequence_steps').update(patch).eq('id', Number(stepId))
  if (error) throw error
}

export async function insertTouch(leadId: string, kind: TouchKind, note?: string): Promise<Touch> {
  const { data, error } = await supabase
    .from('touches')
    .insert({ lead_id: Number(leadId), kind, note: note ?? null })
    .select()
    .single()
  if (error) throw error
  return rowToTouch(data as TouchRow)
}

export async function insertSuppressedContact(email: string, companyName?: string): Promise<void> {
  const { error } = await supabase
    .from('suppressed_contacts')
    .upsert({ email, company_name: companyName ?? null }, { onConflict: 'email' })
  if (error) throw error
}
