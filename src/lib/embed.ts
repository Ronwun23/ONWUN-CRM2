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
