import { Readable } from 'node:stream'
import type { VercelRequest } from '@vercel/node'

// Vercel's Node runtime already reads the raw request body to populate
// req.body for us. The MCP SDK's register/token/revoke handlers are
// Express Routers that use express.json()/express.urlencoded() internally
// — which try to read that same underlying stream again. Since it's
// already fully drained by Vercel, those middlewares hang forever waiting
// for 'data'/'end' events that already fired before they attached. This
// rebuilds a fresh, in-memory readable stream from the body Vercel already
// parsed, so Express's body-parser has something real left to read.
export function rehydrateBody(req: VercelRequest): VercelRequest {
  const contentType = req.headers['content-type'] ?? ''
  let raw: Buffer
  if (contentType.includes('application/json')) {
    raw = Buffer.from(JSON.stringify(req.body ?? {}))
  } else if (contentType.includes('application/x-www-form-urlencoded')) {
    raw = Buffer.from(new URLSearchParams((req.body ?? {}) as Record<string, string>).toString())
  } else {
    raw = Buffer.isBuffer(req.body) ? req.body : Buffer.from('')
  }

  // Push the whole (small) body up front rather than inside _read — _read
  // can be called more than once, which would push the same bytes twice.
  const stream = new Readable()
  stream.push(raw)
  stream.push(null)

  return Object.assign(stream, req, {
    headers: { ...req.headers, 'content-length': String(raw.length) },
  }) as unknown as VercelRequest
}
