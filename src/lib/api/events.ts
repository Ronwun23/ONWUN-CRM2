import { supabase } from '@/lib/supabase'
import type { ClientEvent } from '@/types'

// client_id is nullable: an event with no client is a studio-wide event,
// same dual-scope pattern as `tasks` and `updates`.
interface EventRow {
  id: number
  client_id: number | null
  title: string
  date: string
  time: string | null
  notes: string | null
}

function rowToEvent(row: EventRow): ClientEvent {
  return {
    id: String(row.id),
    title: row.title,
    date: row.date,
    time: row.time ?? undefined,
    notes: row.notes ?? undefined,
  }
}

function eventToRow(clientId: string | null, event: ClientEvent) {
  return {
    client_id: clientId ? Number(clientId) : null,
    title: event.title,
    date: event.date,
    time: event.time ?? null,
    notes: event.notes ?? null,
  }
}

// Fetches one client's events — called lazily, the first time that client
// is actually opened, instead of loading every client's events up front.
export async function fetchEventsForClient(clientId: string): Promise<ClientEvent[]> {
  const { data, error } = await supabase
    .from('events')
    .select('*')
    .eq('client_id', Number(clientId))
    .order('id', { ascending: true })
  if (error) throw error
  return (data as EventRow[]).map(rowToEvent)
}

// Studio-wide events (client_id null) are loaded up front — the Calendar
// page only ever shows these, never per-client events.
export async function fetchStudioEvents(): Promise<ClientEvent[]> {
  const { data, error } = await supabase.from('events').select('*').is('client_id', null).order('id', { ascending: true })
  if (error) throw error
  return (data as EventRow[]).map(rowToEvent)
}

export async function insertEvent(clientId: string | null, event: ClientEvent): Promise<ClientEvent> {
  const { data, error } = await supabase.from('events').insert(eventToRow(clientId, event)).select().single()
  if (error) throw error
  return rowToEvent(data as EventRow)
}

export async function deleteEventRow(eventId: string): Promise<void> {
  const { error } = await supabase.from('events').delete().eq('id', Number(eventId))
  if (error) throw error
}

export async function updateEventRow(eventId: string, patch: Record<string, unknown>): Promise<void> {
  const { error } = await supabase.from('events').update(patch).eq('id', Number(eventId))
  if (error) throw error
}
