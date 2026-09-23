import type { Dispatch, SetStateAction } from 'react'
import { supabase } from '@/lib/supabase'
import type { RealtimeChannel, RealtimePostgresChangesPayload } from '@supabase/supabase-js'
import { rowToDocument, rowToComment } from '@/lib/api/documents'
import type { DocumentRow, CommentRow } from '@/lib/api/documents'
import { rowToTask } from '@/lib/api/tasks'
import type { TaskRow } from '@/lib/api/tasks'
import { rowToUpdate } from '@/lib/api/updates'
import type { UpdateRow } from '@/lib/api/updates'
import type { Client } from '@/types'
import type { StudioState } from '@/context/AppContext'

type SetClients = Dispatch<SetStateAction<Client[]>>
type SetStudio = Dispatch<SetStateAction<StudioState>>

// Replaces an item by id, or adds it to the front if it isn't there yet —
// the same event can arrive twice (once from our own optimistic write,
// once echoed back over the websocket), so this stays a no-op the second
// time instead of duplicating the row.
function upsert<T extends { id: string }>(list: T[], item: T): T[] {
  return list.some((x) => x.id === item.id) ? list.map((x) => (x.id === item.id ? item : x)) : [item, ...list]
}

interface RealtimeHandlers {
  setClients: SetClients
  setStudio: SetStudio
  isClientLoaded: (clientId: string) => boolean
}

// Pushes changes to documents (+ their comments), tasks and updates to
// every open tab the moment someone else saves — no more "you have to
// refresh to see what the client just posted." Requires those four tables
// to be added to Supabase's `supabase_realtime` publication (SQL Editor):
//
//   alter publication supabase_realtime add table documents;
//   alter publication supabase_realtime add table document_comments;
//   alter publication supabase_realtime add table tasks;
//   alter publication supabase_realtime add table updates;
//
// Realtime enforces the same RLS SELECT policies already in place for
// these tables, so a client account only ever receives rows it could
// already query directly — no extra policies needed.
//
// A delete only ever carries the deleted row's id reliably (Postgres only
// publishes full old-row data with REPLICA IDENTITY FULL, which isn't set
// here) — so deletes are applied by id across every list that could hold
// it, rather than by looking up which client/document it belonged to.
export function subscribeToRealtimeUpdates({ setClients, setStudio, isClientLoaded }: RealtimeHandlers): RealtimeChannel {
  const handleDocumentChange = (payload: RealtimePostgresChangesPayload<DocumentRow>) => {
    if (payload.eventType === 'DELETE') {
      const id = String(payload.old.id)
      setClients((prev) => prev.map((c) => ({ ...c, documents: c.documents.filter((d) => d.id !== id) })))
      return
    }
    const row = payload.new
    const clientId = String(row.client_id)
    if (!isClientLoaded(clientId)) return
    setClients((prev) =>
      prev.map((c) => {
        if (c.id !== clientId) return c
        const existing = c.documents.find((d) => d.id === String(row.id))
        const doc = rowToDocument(row, existing?.comments ?? [])
        return { ...c, documents: upsert(c.documents, doc) }
      })
    )
  }

  const handleCommentChange = (payload: RealtimePostgresChangesPayload<CommentRow>) => {
    if (payload.eventType === 'DELETE') {
      const id = String(payload.old.id)
      setClients((prev) =>
        prev.map((c) => ({
          ...c,
          documents: c.documents.map((d) => ({ ...d, comments: d.comments.filter((cm) => cm.id !== id) })),
        }))
      )
      return
    }
    const row = payload.new
    const docId = String(row.document_id)
    const comment = rowToComment(row)
    setClients((prev) =>
      prev.map((c) => ({
        ...c,
        documents: c.documents.map((d) => (d.id === docId ? { ...d, comments: upsert(d.comments, comment) } : d)),
      }))
    )
  }

  const handleTaskChange = (payload: RealtimePostgresChangesPayload<TaskRow>) => {
    if (payload.eventType === 'DELETE') {
      const id = String(payload.old.id)
      setStudio((prev) => ({ ...prev, tasks: prev.tasks.filter((t) => t.id !== id) }))
      setClients((prev) => prev.map((c) => ({ ...c, tasks: c.tasks.filter((t) => t.id !== id) })))
      return
    }
    const row = payload.new
    const task = rowToTask(row)
    if (row.client_id === null) {
      setStudio((prev) => ({ ...prev, tasks: upsert(prev.tasks, task) }))
      return
    }
    const clientId = String(row.client_id)
    if (!isClientLoaded(clientId)) return
    setClients((prev) => prev.map((c) => (c.id === clientId ? { ...c, tasks: upsert(c.tasks, task) } : c)))
  }

  const handleUpdateChange = (payload: RealtimePostgresChangesPayload<UpdateRow>) => {
    if (payload.eventType === 'DELETE') {
      const id = String(payload.old.id)
      setStudio((prev) => ({ ...prev, updates: prev.updates.filter((u) => u.id !== id) }))
      setClients((prev) => prev.map((c) => ({ ...c, updates: c.updates.filter((u) => u.id !== id) })))
      return
    }
    const row = payload.new
    const entry = rowToUpdate(row)
    if (row.client_id === null) {
      setStudio((prev) => ({ ...prev, updates: upsert(prev.updates, entry) }))
      return
    }
    const clientId = String(row.client_id)
    if (!isClientLoaded(clientId)) return
    setClients((prev) => prev.map((c) => (c.id === clientId ? { ...c, updates: upsert(c.updates, entry) } : c)))
  }

  return supabase
    .channel('app-live-updates')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'documents' }, handleDocumentChange)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'document_comments' }, handleCommentChange)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks' }, handleTaskChange)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'updates' }, handleUpdateChange)
    .subscribe()
}
