import { supabase } from '@/lib/supabase'
import type { ClientTask } from '@/types'

// client_id is nullable: a task with no client is a studio-wide task, same
// dual-scope pattern as `updates` and `events`.
interface TaskRow {
  id: number
  client_id: number | null
  title: string
  done: boolean
  due_date: string
  assignee: string
}

function rowToTask(row: TaskRow): ClientTask {
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

export async function fetchTasks(): Promise<{ byClient: Record<string, ClientTask[]>; studio: ClientTask[] }> {
  const { data, error } = await supabase.from('tasks').select('*').order('id', { ascending: false })
  if (error) throw error
  const byClient: Record<string, ClientTask[]> = {}
  const studio: ClientTask[] = []
  for (const row of data as TaskRow[]) {
    const task = rowToTask(row)
    if (row.client_id === null) {
      studio.push(task)
    } else {
      const key = String(row.client_id)
      ;(byClient[key] ??= []).push(task)
    }
  }
  return { byClient, studio }
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
