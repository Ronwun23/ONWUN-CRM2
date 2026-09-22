import { supabase } from '@/lib/supabase'
import { blankPhases, emptyWorkshop } from '@/data/clients'
import { PHASES } from '@/types'
import type { Client, ProjectPhase, WorkshopState } from '@/types'

// Guards against a client row saved with missing/incomplete phases (e.g.
// inserted by hand, or from before this field existed) — every client is
// expected to have all four phases, so anything short of that gets
// backfilled rather than crashing whatever renders the phase stepper.
function normalizePhases(phases: ProjectPhase[] | null): ProjectPhase[] {
  if (!phases || phases.length !== PHASES.length || PHASES.some((key) => !phases.some((p) => p.key === key))) {
    return blankPhases()
  }
  return phases
}

// The `clients` table on Supabase only holds a client's core profile plus
// `phases` and `workshop` (both stored as jsonb, since they're one cohesive
// block of data per client rather than an independently-queried list).
// Documents, tasks, updates, library files, brand assets and events aren't
// migrated yet — they're filled in as empty here and still live purely in
// local state until their own migration passes.
interface ClientRow {
  id: number
  name: string
  project_name: string
  initials: string
  color: string
  avatar_url: string | null
  email: string | null
  phone: string | null
  status: string
  owner: string
  start_date: string
  due_date: string
  phases: ProjectPhase[] | null
  workshop: WorkshopState | null
}

function rowToClient(row: ClientRow): Client {
  return {
    id: String(row.id),
    name: row.name,
    projectName: row.project_name,
    initials: row.initials,
    color: row.color,
    avatarUrl: row.avatar_url ?? undefined,
    email: row.email ?? undefined,
    phone: row.phone ?? undefined,
    status: row.status as Client['status'],
    owner: row.owner,
    startDate: row.start_date,
    dueDate: row.due_date,
    phases: normalizePhases(row.phases),
    documents: [],
    tasks: [],
    updates: [],
    library: [],
    brandHub: [],
    events: [],
    workshop: row.workshop ?? emptyWorkshop(),
  }
}

function clientToRow(client: Client) {
  return {
    name: client.name,
    project_name: client.projectName,
    initials: client.initials,
    color: client.color,
    avatar_url: client.avatarUrl ?? null,
    email: client.email ?? null,
    phone: client.phone ?? null,
    status: client.status,
    owner: client.owner,
    start_date: client.startDate,
    due_date: client.dueDate,
    phases: client.phases,
    workshop: client.workshop,
  }
}

export async function fetchClients(): Promise<Client[]> {
  const { data, error } = await supabase.from('clients').select('*').order('id', { ascending: false })
  if (error) throw error
  return (data as ClientRow[]).map(rowToClient)
}

export async function insertClient(client: Client): Promise<Client> {
  const { data, error } = await supabase.from('clients').insert(clientToRow(client)).select().single()
  if (error) throw error
  // Take the id and persisted fields from the new row, but keep the
  // locally-seeded (not-yet-migrated) parts — documents, library, etc.
  return {
    ...rowToClient(data as ClientRow),
    documents: client.documents,
    tasks: client.tasks,
    updates: client.updates,
    library: client.library,
    brandHub: client.brandHub,
    events: client.events,
  }
}

export async function deleteClientRow(clientId: string): Promise<void> {
  const { error } = await supabase.from('clients').delete().eq('id', Number(clientId))
  if (error) throw error
}

export async function updateClientRow(clientId: string, patch: Record<string, unknown>): Promise<void> {
  const { error } = await supabase.from('clients').update(patch).eq('id', Number(clientId))
  if (error) throw error
}
