import type { Client } from '@/types'
import { blankLibraryFolders } from '@/data/clients'

/**
 * Clients saved to localStorage before a schema change (new fields on
 * documents, the folder-based library, etc.) don't magically gain those
 * fields — they just crash the first component that assumes they exist.
 * This backfills sane defaults for anything a client loaded from an older
 * session might be missing, so old and new clients always behave the same.
 */
export function normalizeClient(client: Client): Client {
  const documents = (client.documents ?? []).map((doc) => ({
    ...doc,
    comments: doc.comments ?? [],
  }))

  const libraryLooksCurrent =
    Array.isArray(client.library) && client.library.every((folder) => Array.isArray(folder?.files))
  const library = libraryLooksCurrent ? client.library : blankLibraryFolders()

  return { ...client, documents, library }
}
