import { supabase } from '@/lib/supabase'
import type { ClientDocument, DocumentComment } from '@/types'

interface DocumentRow {
  id: number
  client_id: number
  title: string
  type: string
  status: string
  meta: string | null
  url: string | null
  updated_at: string
  testimonial_text: string | null
  testimonial_author_name: string | null
  testimonial_author_type: string | null
  testimonial_created_at: string | null
}

interface CommentRow {
  id: number
  document_id: number
  author_name: string
  author_type: string
  text: string
  page_label: string | null
  created_at: string
}

function rowToComment(row: CommentRow): DocumentComment {
  return {
    id: String(row.id),
    authorName: row.author_name,
    authorType: row.author_type as DocumentComment['authorType'],
    text: row.text,
    createdAt: row.created_at,
    pageLabel: row.page_label ?? undefined,
  }
}

function rowToDocument(row: DocumentRow, comments: DocumentComment[]): ClientDocument {
  return {
    id: String(row.id),
    title: row.title,
    type: row.type as ClientDocument['type'],
    status: row.status as ClientDocument['status'],
    meta: row.meta ?? undefined,
    url: row.url ?? undefined,
    updatedAt: row.updated_at,
    comments,
    testimonial: row.testimonial_text
      ? {
          text: row.testimonial_text,
          authorName: row.testimonial_author_name ?? '',
          authorType: (row.testimonial_author_type ?? 'agency') as DocumentComment['authorType'],
          createdAt: row.testimonial_created_at ?? row.updated_at,
        }
      : undefined,
  }
}

function documentToRow(clientId: string, doc: ClientDocument) {
  return {
    client_id: Number(clientId),
    title: doc.title,
    type: doc.type,
    status: doc.status,
    meta: doc.meta ?? null,
    url: doc.url ?? null,
    updated_at: doc.updatedAt,
    testimonial_text: doc.testimonial?.text ?? null,
    testimonial_author_name: doc.testimonial?.authorName ?? null,
    testimonial_author_type: doc.testimonial?.authorType ?? null,
    testimonial_created_at: doc.testimonial?.createdAt ?? null,
  }
}

// Fetches every document and comment across all clients in two queries and
// groups them by client_id, so each client's `documents` array can be
// populated right alongside the client list itself.
export async function fetchDocumentsByClient(): Promise<Record<string, ClientDocument[]>> {
  const [{ data: docRows, error: docError }, { data: commentRows, error: commentError }] = await Promise.all([
    supabase.from('documents').select('*').order('id', { ascending: false }),
    supabase.from('document_comments').select('*').order('id', { ascending: true }),
  ])
  if (docError) throw docError
  if (commentError) throw commentError

  const commentsByDoc = new Map<number, DocumentComment[]>()
  for (const row of commentRows as CommentRow[]) {
    const list = commentsByDoc.get(row.document_id) ?? []
    list.push(rowToComment(row))
    commentsByDoc.set(row.document_id, list)
  }

  const byClient: Record<string, ClientDocument[]> = {}
  for (const row of docRows as DocumentRow[]) {
    const doc = rowToDocument(row, commentsByDoc.get(row.id) ?? [])
    const clientId = String(row.client_id)
    ;(byClient[clientId] ??= []).push(doc)
  }
  return byClient
}

export async function insertDocument(clientId: string, doc: ClientDocument): Promise<ClientDocument> {
  const { data, error } = await supabase.from('documents').insert(documentToRow(clientId, doc)).select().single()
  if (error) throw error
  return rowToDocument(data as DocumentRow, [])
}

export async function updateDocumentRow(docId: string, patch: Record<string, unknown>): Promise<void> {
  const { error } = await supabase.from('documents').update(patch).eq('id', Number(docId))
  if (error) throw error
}

export async function deleteDocumentRow(docId: string): Promise<void> {
  const { error } = await supabase.from('documents').delete().eq('id', Number(docId))
  if (error) throw error
}

export async function insertComment(docId: string, comment: DocumentComment): Promise<void> {
  const { error } = await supabase.from('document_comments').insert({
    document_id: Number(docId),
    author_name: comment.authorName,
    author_type: comment.authorType,
    text: comment.text,
    page_label: comment.pageLabel ?? null,
    created_at: comment.createdAt,
  })
  if (error) throw error
}
