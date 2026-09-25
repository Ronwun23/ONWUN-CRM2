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

  // Client Acquisition (cold outreach) tools — same RLS-scoped client as
  // everything above, so these only ever work for a connected agency
  // account (leads/sequence_steps/touches all deny non-agency access).
  server.registerTool(
    'list_leads',
    {
      title: 'List leads',
      description: 'List cold outreach leads — optionally filter by status or owner. Start here to find a leadId for the other tools.',
      inputSchema: {
        status: z.string().optional().describe("e.g. 'new', 'contacted', 'call_booked' — omit for all"),
        owner: z.string().optional().describe("e.g. 'ro' or 'niall' — omit for all"),
      },
    },
    async ({ status, owner }) => {
      let query = supabase
        .from('leads')
        .select('id, company_name, website, platform, contact_name, contact_email, country, status, owner, updated_at')
        .order('updated_at', { ascending: false })
      if (status) query = query.eq('status', status)
      if (owner) query = query.eq('owner', owner)
      const { data, error } = await query
      if (error) return errorResult(error.message)
      return textResult(data)
    }
  )

  server.registerTool(
    'add_lead',
    {
      title: 'Add lead',
      description: 'Manually add a cold outreach lead.',
      inputSchema: {
        companyName: z.string(),
        website: z.string().optional(),
        platform: z.string().optional(),
        contactName: z.string().optional(),
        contactEmail: z.string().optional(),
        country: z.string().optional(),
        noticedNote: z.string().optional().describe('A genuine observation about their brand or website'),
        owner: z.string().describe("e.g. 'ro' or 'niall'"),
      },
    },
    async ({ companyName, website, platform, contactName, contactEmail, country, noticedNote, owner }) => {
      const { data, error } = await supabase
        .from('leads')
        .insert({
          company_name: companyName,
          website: website ?? null,
          platform: platform ?? null,
          contact_name: contactName ?? null,
          contact_email: contactEmail ?? null,
          country: country ?? null,
          noticed_note: noticedNote ?? null,
          status: 'new',
          owner,
        })
        .select()
        .single()
      if (error) return errorResult(error.message)
      return textResult(data)
    }
  )

  server.registerTool(
    'log_outcome',
    {
      title: 'Log lead outcome',
      description:
        "Set a lead's status after an outcome — e.g. 'wants_video', 'video_sent', 'call_booked', 'live_conversation', 'not_now', or 'suppressed' (permanent, never contact again).",
      inputSchema: {
        leadId: z.string().describe('The lead id, from list_leads'),
        outcome: z.string(),
      },
    },
    async ({ leadId, outcome }) => {
      const patch: Record<string, unknown> = { status: outcome, updated_at: new Date().toISOString() }
      if (outcome === 'not_now') {
        const resurface = new Date()
        resurface.setDate(resurface.getDate() + 90)
        patch.not_now_until = resurface.toISOString().slice(0, 10)
      }
      const { data, error } = await supabase.from('leads').update(patch).eq('id', Number(leadId)).select().single()
      if (error) return errorResult(error.message)

      if (outcome === 'suppressed') {
        const lead = data as { contact_email: string | null; company_name: string }
        if (lead.contact_email) {
          await supabase
            .from('suppressed_contacts')
            .upsert({ email: lead.contact_email, company_name: lead.company_name }, { onConflict: 'email' })
        }
      }
      await supabase.from('touches').insert({ lead_id: Number(leadId), kind: 'outcome_set', note: outcome })
      return textResult(data)
    }
  )

  server.registerTool(
    'list_due_today',
    {
      title: 'List due today',
      description: 'List every follow-up sequence step due today or overdue and not yet done, across all leads.',
      inputSchema: { owner: z.string().optional().describe("e.g. 'ro' or 'niall' — omit for everyone") },
    },
    async ({ owner }) => {
      const today = new Date().toISOString().slice(0, 10)
      const { data: steps, error: stepsError } = await supabase
        .from('sequence_steps')
        .select('id, lead_id, step_type, due_date')
        .eq('done', false)
        .lte('due_date', today)
        .order('due_date', { ascending: true })
      if (stepsError) return errorResult(stepsError.message)
      if (!steps.length) return textResult([])

      const leadIds = [...new Set(steps.map((s) => s.lead_id))]
      let leadsQuery = supabase.from('leads').select('id, company_name, owner').in('id', leadIds)
      if (owner) leadsQuery = leadsQuery.eq('owner', owner)
      const { data: leads, error: leadsError } = await leadsQuery
      if (leadsError) return errorResult(leadsError.message)

      const leadById = new Map(leads.map((l) => [l.id, l]))
      const result = steps
        .filter((s) => leadById.has(s.lead_id))
        .map((s) => ({ ...s, lead: leadById.get(s.lead_id) }))
      return textResult(result)
    }
  )
}
