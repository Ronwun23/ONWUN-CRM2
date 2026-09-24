import type { VercelRequest, VercelResponse } from '@vercel/node'
import type { Request, Response } from 'express'
import { authorizationHandler } from '@modelcontextprotocol/sdk/server/auth/handlers/authorize.js'
import { oauthProvider, setCurrentRequestOrigin } from './_mcp/store.js'

// Validates the incoming OAuth params (redirect_uri matches what was
// registered, response_type is "code", PKCE challenge present, etc.) then
// hands off to oauthProvider.authorize(), which redirects to our own
// /mcp-connect login page — see _mcp/store.ts.
const handler = authorizationHandler({ provider: oauthProvider, rateLimit: false })

export default function mcpAuthorize(req: VercelRequest, res: VercelResponse) {
  setCurrentRequestOrigin(`https://${req.headers.host}`)
  handler(req as unknown as Request, res as unknown as Response, (err) => {
    if (err) {
      console.error('mcp-authorize error:', err)
      res.status(500).send('Something went wrong starting the Claude connection.')
    }
  })
}
