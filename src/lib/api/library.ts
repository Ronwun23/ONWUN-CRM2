import { supabase } from '@/lib/supabase'
import type { LibraryFile, LibraryFolder } from '@/types'

interface FolderRow {
  id: number
  client_id: number
  name: string
}

interface FileRow {
  id: number
  folder_id: number
  title: string
  file_type: string
  file_name: string | null
  url: string | null
  updated_at: string
}

function rowToFile(row: FileRow): LibraryFile {
  return {
    id: String(row.id),
    title: row.title,
    fileType: row.file_type as LibraryFile['fileType'],
    fileName: row.file_name ?? undefined,
    url: row.url ?? undefined,
    updatedAt: row.updated_at,
  }
}

function fileToRow(folderId: string, file: LibraryFile) {
  return {
    folder_id: Number(folderId),
    title: file.title,
    file_type: file.fileType,
    file_name: file.fileName ?? null,
    url: file.url ?? null,
    updated_at: file.updatedAt,
  }
}

export async function fetchLibraryByClient(): Promise<Record<string, LibraryFolder[]>> {
  const [{ data: folderRows, error: folderError }, { data: fileRows, error: fileError }] = await Promise.all([
    supabase.from('library_folders').select('*').order('id', { ascending: true }),
    supabase.from('library_files').select('*').order('id', { ascending: false }),
  ])
  if (folderError) throw folderError
  if (fileError) throw fileError

  const filesByFolder = new Map<number, LibraryFile[]>()
  for (const row of fileRows as FileRow[]) {
    const list = filesByFolder.get(row.folder_id) ?? []
    list.push(rowToFile(row))
    filesByFolder.set(row.folder_id, list)
  }

  const byClient: Record<string, LibraryFolder[]> = {}
  for (const row of folderRows as FolderRow[]) {
    const folder: LibraryFolder = { id: String(row.id), name: row.name, files: filesByFolder.get(row.id) ?? [] }
    const clientId = String(row.client_id)
    ;(byClient[clientId] ??= []).push(folder)
  }
  return byClient
}

export async function insertFolder(clientId: string, folder: LibraryFolder): Promise<LibraryFolder> {
  const { data, error } = await supabase
    .from('library_folders')
    .insert({ client_id: Number(clientId), name: folder.name })
    .select()
    .single()
  if (error) throw error
  const row = data as FolderRow
  return { id: String(row.id), name: row.name, files: [] }
}

export async function deleteFolderRow(folderId: string): Promise<void> {
  const { error } = await supabase.from('library_folders').delete().eq('id', Number(folderId))
  if (error) throw error
}

export async function insertFile(folderId: string, file: LibraryFile): Promise<LibraryFile> {
  const { data, error } = await supabase.from('library_files').insert(fileToRow(folderId, file)).select().single()
  if (error) throw error
  return rowToFile(data as FileRow)
}

export async function deleteFileRow(fileId: string): Promise<void> {
  const { error } = await supabase.from('library_files').delete().eq('id', Number(fileId))
  if (error) throw error
}
