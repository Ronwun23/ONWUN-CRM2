import type { VercelRequest, VercelResponse } from '@vercel/node'
import { createClient } from '@supabase/supabase-js'
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js'
import { oauthProvider, getFreshSupabaseAccessToken } from './_mcp/store.js'
import { registerTools } from './_mcp/tools.js'
import { supabaseUrl, supabaseAnonKey } from './_mcp/supabaseAdmin.js'

// The actual MCP endpoint — every request here is a single, independent
// JSON-RPC call (stateless mode: no sessionIdGenerator), which matches how
// Vercel serverless functions work — there's no guarantee two requests
// land on the same warm instance, so a fresh McpServer + transport pair is
// built per request rather than kept alive across calls.
export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type, Mcp-Session-Id')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  if (req.method === 'OPTIONS') {
    res.status(204).end()
    return
  }

  const authHeader = req.headers.authorization
  const origin = `https://${req.headers.host}`
  if (!authHeader?.startsWith('Bearer ')) {
    res.setHeader('WWW-Authenticate', `Bearer resource_metadata="${origin}/.well-known/oauth-protected-resource/api/mcp"`)
    res.status(401).json({ error: 'unauthorized', error_description: 'Missing bearer token' })
    return
  }

  let userAccessToken: string
  try {
    const authInfo = await oauthProvider.verifyAccessToken(authHeader.slice('Bearer '.length))
    const connectionId = authInfo.extra?.connectionId as string
    userAccessToken = await getFreshSupabaseAccessToken(connectionId)
  } catch {
    res.setHeader('WWW-Authenticate', `Bearer resource_metadata="${origin}/.well-known/oauth-protected-resource/api/mcp"`)
    res.status(401).json({ error: 'unauthorized', error_description: 'Invalid or expired token' })
    return
  }

  const userSupabase = createClient(supabaseUrl(), supabaseAnonKey(), {
    global: { headers: { Authorization: `Bearer ${userAccessToken}` } },
  })

  const server = new McpServer({ name: 'onwun-crm', version: '1.0.0' })
  registerTools(server, userSupabase)

  const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: undefined })
  res.on('close', () => {
    transport.close()
    server.close()
  })

  await server.connect(transport)
  await transport.handleRequest(req, res, req.body)
}
