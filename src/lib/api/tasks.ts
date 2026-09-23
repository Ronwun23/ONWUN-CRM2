import { supabase } from '@/lib/supabase'
import type { ClientTask } from '@/types'

// client_id is nullable: a task with no client is a studio-wide task, same
// dual-scope pattern as `updates` and `events`.
export interface TaskRow {
  id: number
  client_id: number | null
  title: string
  done: boolean
  due_date: string
  assignee: string
}

export function rowToTask(row: TaskRow): ClientTask {
  return {
    id: String(row.id),
    title: row.title,
    done: row.done,
    dueDate: row.due_date,
    assignee: row.assignee,
  }
}

function taskToRow(clientId: string | null, task: ClientTask) {
  return {
    client_id: clientId ? Number(clientId) : null,
    title: task.title,
    done: task.done,
    due_date: task.dueDate,
    assignee: task.assignee,
  }
}

// Fetches one client's tasks — called lazily, the first time that client
// is actually opened, instead of loading every client's tasks up front.
export async function fetchTasksForClient(clientId: string): Promise<ClientTask[]> {
  const { data, error } = await supabase
    .from('tasks')
    .select('*')
    .eq('client_id', Number(clientId))
    .order('id', { ascending: false })
  if (error) throw error
  return (data as TaskRow[]).map(rowToTask)
}

// Studio-wide tasks (client_id null) are loaded up front — this stays
// small regardless of how many clients exist, unlike per-client data.
export async function fetchStudioTasks(): Promise<ClientTask[]> {
  const { data, error } = await supabase.from('tasks').select('*').is('client_id', null).order('id', { ascending: false })
  if (error) throw error
  return (data as TaskRow[]).map(rowToTask)
}

export async function insertTask(clientId: string | null, task: ClientTask): Promise<ClientTask> {
  const { data, error } = await supabase.from('tasks').insert(taskToRow(clientId, task)).select().single()
  if (error) throw error
  return rowToTask(data as TaskRow)
}

export async function updateTaskRow(taskId: string, patch: Record<string, unknown>): Promise<void> {
  const { error } = await supabase.from('tasks').update(patch).eq('id', Number(taskId))
  if (error) throw error
}
