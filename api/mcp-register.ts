import type { VercelRequest, VercelResponse } from '@vercel/node'
import type { Request, Response } from 'express'
import { clientRegistrationHandler } from '@modelcontextprotocol/sdk/server/auth/handlers/register.js'
import { clientsStore } from './_mcp/store.js'

// Dynamic Client Registration (RFC 7591) — the first thing Claude's side
// does when you paste in the server URL: it registers itself and gets
// back a client_id, no manual setup on our end. The MCP SDK's handler
// does the actual RFC-compliant validation; this file just bridges
// Vercel's (req, res) into the Express-shaped handler it expects — the
// two are runtime-compatible (both build on Node's http primitives), just
// not the same TypeScript type.
const handler = clientRegistrationHandler({ clientsStore, rateLimit: false })

export default function mcpRegister(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  if (req.method === 'OPTIONS') {
    res.status(204).end()
    return
  }
  handler(req as unknown as Request, res as unknown as Response, (err) => {
    if (err) {
      console.error('mcp-register error:', err)
      res.status(500).json({ error: 'server_error' })
    }
  })
}
