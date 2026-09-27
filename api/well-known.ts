import type { VercelRequest, VercelResponse } from '@vercel/node'

// Both MCP discovery documents in one function — Vercel's Hobby plan
// caps a deployment at 12 serverless functions, so these two (each a
// handful of static lines, previously separate files) share one, routed
// by the `type` query param each vercel.json rewrite appends.

// RFC 8414 — how an MCP client discovers where /authorize, /token, and
// /register actually live.
function authorizationServerMetadata(origin: string) {
  return {
    issuer: origin,
    authorization_endpoint: `${origin}/api/mcp-authorize`,
    token_endpoint: `${origin}/api/mcp-token`,
    registration_endpoint: `${origin}/api/mcp-register`,
    revocation_endpoint: `${origin}/api/mcp-revoke`,
    response_types_supported: ['code'],
    grant_types_supported: ['authorization_code', 'refresh_token'],
    code_challenge_methods_supported: ['S256'],
    token_endpoint_auth_methods_supported: ['none'],
  }
}

// RFC 9728 — tells an MCP client (that already knows our /mcp endpoint's
// URL but nothing else) which authorization server issues tokens for it.
function protectedResourceMetadata(origin: string) {
  return {
    resource: `${origin}/api/mcp`,
    authorization_servers: [origin],
    bearer_methods_supported: ['header'],
    resource_name: 'Onwun CRM',
  }
}

export default function handler(req: VercelRequest, res: VercelResponse) {
  const origin = `https://${req.headers.host}`
  res.setHeader('Access-Control-Allow-Origin', '*')
  const type = req.query.type
  res.status(200).json(type === 'resource' ? protectedResourceMetadata(origin) : authorizationServerMetadata(origin))
}
