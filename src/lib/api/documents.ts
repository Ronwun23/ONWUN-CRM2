import { supabase } from '@/lib/supabase'
import { storagePathFrom, toStoragePath } from '@/lib/embed'
import type { ClientDocument, DocumentComment } from '@/types'

const DOCUMENTS_BUCKET = 'documents'

export interface DocumentRow {
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

export interface CommentRow {
  id: number
  document_id: number
  author_name: string
  author_type: string
  text: string
  page_label: string | null
  created_at: string
}

export function rowToComment(row: CommentRow): DocumentComment {
  return {
    id: String(row.id),
    authorName: row.author_name,
    authorType: row.author_type as DocumentComment['authorType'],
    text: row.text,
    createdAt: row.created_at,
    pageLabel: row.page_label ?? undefined,
  }
}

export function rowToDocument(row: DocumentRow, comments: DocumentComment[]): ClientDocument {
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

// Fetches one client's documents (and their comments) in two scoped
// queries — called lazily, the first time that client is actually opened,
// rather than loading every client's documents up front.
export async function fetchDocumentsForClient(clientId: string): Promise<ClientDocument[]> {
  const { data: docRows, error: docError } = await supabase
    .from('documents')
    .select('*')
    .eq('client_id', Number(clientId))
    .order('id', { ascending: false })
  if (docError) throw docError
  const docs = docRows as DocumentRow[]
  const docIds = docs.map((d) => d.id)
  if (docIds.length === 0) return []

  const { data: commentRows, error: commentError } = await supabase
    .from('document_comments')
    .select('*')
    .in('document_id', docIds)
    .order('id', { ascending: true })
  if (commentError) throw commentError

  const commentsByDoc = new Map<number, DocumentComment[]>()
  for (const row of commentRows as CommentRow[]) {
    const list = commentsByDoc.get(row.document_id) ?? []
    list.push(rowToComment(row))
    commentsByDoc.set(row.document_id, list)
  }

  return docs.map((row) => rowToDocument(row, commentsByDoc.get(row.id) ?? []))
}

// Uploads a PDF directly to Supabase Storage instead of embedding it as
// base64 in the database — returns a "storage:<path>" marker to store in
// the document's `url` column.
export async function uploadDocumentFile(clientId: string, file: File): Promise<string> {
  const path = `${clientId}/${Date.now()}-${file.name}`
  const { error } = await supabase.storage.from(DOCUMENTS_BUCKET).upload(path, file)
  if (error) throw error
  return toStoragePath(path)
}

// Storage is private — a document's PDF is only ever accessed via a
// short-lived signed URL generated on demand, not a permanent public link.
export async function getSignedDocumentUrl(storageUrl: string): Promise<string> {
  const path = storagePathFrom(storageUrl)
  const { data, error } = await supabase.storage.from(DOCUMENTS_BUCKET).createSignedUrl(path, 3600)
  if (error) throw error
  return data.signedUrl
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
