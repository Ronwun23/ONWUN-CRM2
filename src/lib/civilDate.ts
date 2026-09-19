// Civil dates (yyyy-mm-dd) represent a calendar day with no attached time zone.
// The classic bug: `new Date("2026-12-15")` parses as UTC midnight, so
// formatting it in any timezone behind UTC (most of the Americas) prints
// "Dec 14". Every conversion here goes through local year/month/day parts —
// never through `.toISOString()` or a bare `new Date(civilString)` — so a
// civil date always means the same calendar day everywhere it's read.

const CIVIL_DATE_RE = /^\d{4}-\d{2}-\d{2}$/

export function isCivilDate(value: string): boolean {
  return CIVIL_DATE_RE.test(value)
}

/** "2026-12-15" -> local Date at midnight on that day. Never UTC-shifted. */
export function parseCivilDate(civil: string): Date {
  const [year, month, day] = civil.split('-').map(Number)
  return new Date(year, month - 1, day)
}

/** Local Date -> "2026-12-15", using local (not UTC) calendar fields. */
export function formatCivilDate(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function todayCivil(): string {
  return formatCivilDate(new Date())
}

/** Accepts either a civil date (yyyy-mm-dd) or a full ISO timestamp; always
 * returns a Date safe to format for display in the local timezone. */
export function toDisplayDate(value: string): Date {
  return isCivilDate(value) ? parseCivilDate(value) : new Date(value)
}
