import type { VercelRequest, VercelResponse } from '@vercel/node'

// RFC 9728 — tells an MCP client (that already knows our /mcp endpoint's
// URL but nothing else) which authorization server issues tokens for it.
export default function handler(req: VercelRequest, res: VercelResponse) {
  const origin = `https://${req.headers.host}`
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.status(200).json({
    resource: `${origin}/api/mcp`,
    authorization_servers: [origin],
    bearer_methods_supported: ['header'],
    resource_name: 'Onwun CRM',
  })
}
