export function isFigmaUrl(url: string): boolean {
  try {
    return new URL(url).hostname.replace('www.', '') === 'figma.com'
  } catch {
    return false
  }
}

export function figmaEmbedSrc(url: string): string {
  return `https://www.figma.com/embed?embed_host=onwun&url=${encodeURIComponent(url)}`
}

export function isPdfDataUrl(url: string): boolean {
  return url.startsWith('data:application/pdf')
}

// A PDF uploaded to Supabase Storage (the `documents` bucket) is stored as
// a "storage:<path>" marker rather than the file itself — the actual file
// is only ever fetched as a short-lived signed URL when a document is
// opened, instead of embedding the whole file as base64 in the database
// (which doesn't scale past a few MB and was blowing through egress).
const STORAGE_PATH_PREFIX = 'storage:'

export function isStoragePath(url: string): boolean {
  return url.startsWith(STORAGE_PATH_PREFIX)
}

export function storagePathFrom(url: string): string {
  return url.slice(STORAGE_PATH_PREFIX.length)
}

export function toStoragePath(path: string): string {
  return `${STORAGE_PATH_PREFIX}${path}`
}
