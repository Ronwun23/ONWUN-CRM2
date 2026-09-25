import { z } from 'zod'
import type { SupabaseClient } from '@supabase/supabase-js'
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'

function textResult(data: unknown) {
  return { content: [{ type: 'text' as const, text: JSON.stringify(data, null, 2) }] }
}

function errorResult(message: string) {
  return { content: [{ type: 'text' as const, text: message }], isError: true }
}

// Read-only, first cut — list/get only, nothing that changes data yet.
// Every query runs through a Supabase client scoped to the connected
// person's own session, so RLS applies exactly as it does in the browser:
// a real client account (if one were ever connected) would only ever see
// its own data, same as today.
export function registerTools(server: McpServer, supabase: SupabaseClient) {
  server.registerTool(
    'list_clients',
    {
      title: 'List clients',
      description: "List every client in the studio — name, project, status, owner and due date. Start here to find a client's id for the other tools.",
      inputSchema: {},
    },
    async () => {
      const { data, error } = await supabase
        .from('clients')
        .select('id, name, project_name, status, owner, due_date')
        .order('id', { ascending: false })
      if (error) return errorResult(error.message)
      return textResult(data)
    }
  )

  server.registerTool(
    'get_client',
    {
      title: 'Get client',
      description: 'Get one client\'s full profile — contact info, project phases/progress, and their discovery workshop status.',
      inputSchema: { clientId: z.string().describe('The client id, from list_clients') },
    },
    async ({ clientId }) => {
      const { data, error } = await supabase.from('clients').select('*').eq('id', Number(clientId)).maybeSingle()
      if (error) return errorResult(error.message)
      if (!data) return errorResult(`No client with id ${clientId}`)
      return textResult(data)
    }
  )

  server.registerTool(
    'list_tasks',
    {
      title: 'List tasks',
      description: 'List tasks — pass a clientId for that client\'s tasks, or omit it for studio-wide (internal) tasks.',
      inputSchema: { clientId: z.string().optional().describe('Omit for studio-wide tasks') },
    },
    async ({ clientId }) => {
      let query = supabase.from('tasks').select('id, title, done, due_date, assignee, client_id').order('id', { ascending: false })
      query = clientId ? query.eq('client_id', Number(clientId)) : query.is('client_id', null)
      const { data, error } = await query
      if (error) return errorResult(error.message)
      return textResult(data)
    }
  )

  server.registerTool(
    'list_updates',
    {
      title: 'List updates',
      description: "List the update feed — pass a clientId for that client's updates (including their own posts from the client portal), or omit it for studio-wide updates.",
      inputSchema: { clientId: z.string().optional().describe('Omit for studio-wide updates') },
    },
    async ({ clientId }) => {
      let query = supabase
        .from('updates')
        .select('id, text, date, author, author_type, doc_title, client_id')
        .order('id', { ascending: false })
        .limit(50)
      query = clientId ? query.eq('client_id', Number(clientId)) : query.is('client_id', null)
      const { data, error } = await query
      if (error) return errorResult(error.message)
      return textResult(data)
    }
  )

  server.registerTool(
    'list_documents',
    {
      title: 'List documents',
      description: "List a client's documents — proposals, contracts, presentations, brand guidelines, etc. — with status and type.",
      inputSchema: { clientId: z.string().describe('The client id, from list_clients') },
    },
    async ({ clientId }) => {
      const { data, error } = await supabase
        .from('documents')
        .select('id, title, type, status, meta, updated_at')
        .eq('client_id', Number(clientId))
        .order('id', { ascending: false })
      if (error) return errorResult(error.message)
      return textResult(data)
    }
  )
}
