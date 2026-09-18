import type { TeamMember } from '@/types'

export const TEAM: TeamMember[] = [
  { id: 't1', name: 'Maya Chen', initials: 'MC', color: '#6a60f6', email: 'maya@onwun.com' },
  { id: 't2', name: 'Diego Alvarez', initials: 'DA', color: '#eb6834', email: 'diego@onwun.com' },
  { id: 't3', name: 'Priya Nair', initials: 'PN', color: '#1baf7a', email: 'priya@onwun.com' },
  { id: 't4', name: 'Jonah Rees', initials: 'JR', color: '#e87ba4', email: 'jonah@onwun.com' },
]

// The logged-in studio member for this session — drives "waiting on me" everywhere.
export const CURRENT_USER = TEAM[0]

export function teamMember(id: string): TeamMember | undefined {
  return TEAM.find((t) => t.id === id)
}
