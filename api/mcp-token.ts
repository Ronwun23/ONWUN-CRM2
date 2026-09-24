import type { VercelRequest, VercelResponse } from '@vercel/node'
import type { Request, Response } from 'express'
import { tokenHandler } from '@modelcontextprotocol/sdk/server/auth/handlers/token.js'
import { oauthProvider } from './_mcp/store.js'
import { rehydrateBody } from './_mcp/rehydrateBody.js'

const handler = tokenHandler({ provider: oauthProvider, rateLimit: false })

export default function mcpToken(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  if (req.method === 'OPTIONS') {
    res.status(204).end()
    return
  }
  handler(rehydrateBody(req) as unknown as Request, res as unknown as Response, (err) => {
    if (err) {
      console.error('mcp-token error:', err)
      res.status(500).json({ error: 'server_error' })
    }
  })
}
