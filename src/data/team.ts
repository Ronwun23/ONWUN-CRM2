import type { TeamMember } from '@/types'
import { colorFromName, initialsFromName } from '@/lib/names'

export const TEAM: TeamMember[] = [
  { id: 't1', name: 'Maya Chen', initials: 'MC', color: '#6a60f6', email: 'maya@onwun.com' },
  { id: 't2', name: 'Diego Alvarez', initials: 'DA', color: '#eb6834', email: 'diego@onwun.com' },
  { id: 't3', name: 'Priya Nair', initials: 'PN', color: '#1baf7a', email: 'priya@onwun.com' },
  { id: 't4', name: 'Jonah Rees', initials: 'JR', color: '#e87ba4', email: 'jonah@onwun.com' },
]

// The logged-in studio member for this session — drives "waiting on me" everywhere.
export const CURRENT_USER = TEAM[0]

export interface StudioAccount {
  id: string
  name: string
  initials: string
  color: string
  email: string
}

// The real people who actually run this studio dashboard — separate from
// TEAM above, which is the fictional roster tasks/projects get assigned to
// in the demo data. This is "who am I right now" — it drives attribution on
// new comments and updates, and the account switcher in the sidebar.
export const STUDIO_ACCOUNTS: StudioAccount[] = [
  { id: 'ro', name: 'Ro', initials: 'RO', color: '#6a60f6', email: 'ro@onwun.com' },
  { id: 'niall', name: 'Niall', initials: 'NP', color: '#eb6834', email: 'niall@onwun.com' },
]

export function teamMember(id: string): TeamMember | undefined {
  return TEAM.find((t) => t.id === id)
}

/**
 * Resolves an owner/assignee value to a displayable member, whether it's a
 * known TEAM id (seeded data), a known TEAM member's name (typed but
 * matches an existing person), or a completely freeform typed name — in
 * which case a stable initials + color are derived from the name itself so
 * the avatar still renders consistently everywhere that name appears.
 */
export function resolveMember(value: string): Pick<TeamMember, 'name' | 'initials' | 'color'> {
  const known = TEAM.find((m) => m.id === value || m.name === value)
  if (known) return known
  const account = STUDIO_ACCOUNTS.find((a) => a.id === value || a.name === value)
  if (account) return account
  return { name: value, initials: initialsFromName(value), color: colorFromName(value) }
}
