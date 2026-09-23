import { supabase } from '@/lib/supabase'
import type { UpdateEntry } from '@/types'

// client_id is nullable: an update with no client is a studio-wide note,
// same dual-scope pattern as `tasks` and `events`.
interface UpdateRow {
  id: number
  client_id: number | null
  text: string
  date: string
  author: string
  author_type: string | null
  doc_id: number | null
  doc_title: string | null
}

function rowToUpdate(row: UpdateRow): UpdateEntry {
  return {
    id: String(row.id),
    text: row.text,
    date: row.date,
    author: row.author,
    authorType: (row.author_type as UpdateEntry['authorType']) ?? undefined,
    docId: row.doc_id !== null ? String(row.doc_id) : undefined,
    docTitle: row.doc_title ?? undefined,
  }
}

function updateToRow(clientId: string | null, entry: UpdateEntry) {
  return {
    client_id: clientId ? Number(clientId) : null,
    text: entry.text,
    date: entry.date,
    author: entry.author,
    author_type: entry.authorType ?? null,
    doc_id: entry.docId ? Number(entry.docId) : null,
    doc_title: entry.docTitle ?? null,
  }
}

// Fetches one client's updates — called lazily, the first time that client
// is actually opened, instead of loading every client's updates up front.
export async function fetchUpdatesForClient(clientId: string): Promise<UpdateEntry[]> {
  const { data, error } = await supabase
    .from('updates')
    .select('*')
    .eq('client_id', Number(clientId))
    .order('id', { ascending: false })
  if (error) throw error
  return (data as UpdateRow[]).map(rowToUpdate)
}

// Studio-wide updates (client_id null) are loaded up front — this stays
// small regardless of how many clients exist, unlike per-client data. The
// combined feed on the Studio Updates page also needs every client's
// updates, which it loads by opening each client the normal (lazy) way.
export async function fetchStudioUpdates(): Promise<UpdateEntry[]> {
  const { data, error } = await supabase.from('updates').select('*').is('client_id', null).order('id', { ascending: false })
  if (error) throw error
  return (data as UpdateRow[]).map(rowToUpdate)
}

export async function insertUpdate(clientId: string | null, entry: UpdateEntry): Promise<UpdateEntry> {
  const { data, error } = await supabase.from('updates').insert(updateToRow(clientId, entry)).select().single()
  if (error) throw error
  return rowToUpdate(data as UpdateRow)
}

export async function deleteUpdateRow(updateId: string): Promise<void> {
  const { error } = await supabase.from('updates').delete().eq('id', Number(updateId))
  if (error) throw error
}
