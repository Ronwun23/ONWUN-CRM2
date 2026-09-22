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

export async function fetchEvents(): Promise<{ byClient: Record<string, ClientEvent[]>; studio: ClientEvent[] }> {
  const { data, error } = await supabase.from('events').select('*').order('id', { ascending: true })
  if (error) throw error
  const byClient: Record<string, ClientEvent[]> = {}
  const studio: ClientEvent[] = []
  for (const row of data as EventRow[]) {
    const event = rowToEvent(row)
    if (row.client_id === null) {
      studio.push(event)
    } else {
      const key = String(row.client_id)
      ;(byClient[key] ??= []).push(event)
    }
  }
  return { byClient, studio }
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
