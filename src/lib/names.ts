export function initialsFromName(name: string): string {
  return name
    .split(' ')
    .map((part) => part.match(/[a-z0-9]/i)?.[0] ?? '')
    .filter(Boolean)
    .join('')
    .slice(0, 2)
    .toUpperCase()
}

const NAME_COLOR_PALETTE = ['#6a60f6', '#eb6834', '#1baf7a', '#e87ba4', '#eda100', '#4a3aa7', '#2a78d6', '#008300']

/** Deterministic color for a freeform name — same name always gets the same color. */
export function colorFromName(name: string): string {
  let hash = 0
  for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) >>> 0
  return NAME_COLOR_PALETTE[hash % NAME_COLOR_PALETTE.length]
}
