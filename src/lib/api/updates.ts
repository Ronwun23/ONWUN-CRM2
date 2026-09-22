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

export async function fetchUpdates(): Promise<{ byClient: Record<string, UpdateEntry[]>; studio: UpdateEntry[] }> {
  const { data, error } = await supabase.from('updates').select('*').order('id', { ascending: false })
  if (error) throw error
  const byClient: Record<string, UpdateEntry[]> = {}
  const studio: UpdateEntry[] = []
  for (const row of data as UpdateRow[]) {
    const entry = rowToUpdate(row)
    if (row.client_id === null) {
      studio.push(entry)
    } else {
      const key = String(row.client_id)
      ;(byClient[key] ??= []).push(entry)
    }
  }
  return { byClient, studio }
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
