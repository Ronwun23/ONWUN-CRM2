import type { VercelRequest, VercelResponse } from '@vercel/node'

// RFC 8414 — how an MCP client discovers where /authorize, /token, and
// /register actually live. Must be reachable at exactly this path off the
// site's root (see the vercel.json rewrite for /.well-known/*).
export default function handler(req: VercelRequest, res: VercelResponse) {
  const origin = `https://${req.headers.host}`
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.status(200).json({
    issuer: origin,
    authorization_endpoint: `${origin}/api/mcp-authorize`,
    token_endpoint: `${origin}/api/mcp-token`,
    registration_endpoint: `${origin}/api/mcp-register`,
    revocation_endpoint: `${origin}/api/mcp-revoke`,
    response_types_supported: ['code'],
    grant_types_supported: ['authorization_code', 'refresh_token'],
    code_challenge_methods_supported: ['S256'],
    token_endpoint_auth_methods_supported: ['none'],
  })
}
