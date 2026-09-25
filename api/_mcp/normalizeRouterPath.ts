import type { VercelRequest } from '@vercel/node'

// The MCP SDK's register/authorize/token/revoke handlers are Express
// Routers whose internal routes are defined relative to wherever they get
// mounted (router.post('/', ...), router.all('/', ...)) — a real Express
// app strips the mount prefix from req.url automatically via app.use(),
// so those routes see req.url === '/'. Since these are invoked directly
// here with the real incoming path (e.g. /api/mcp-register), that strict
// '/' match never fires; the router falls through with no match, nothing
// else responds, and the request hangs until Vercel kills the function.
// Rewriting req.url to just the query string makes it look, to the
// router, exactly like it would if mounted at this path.
export function normalizeRouterPath(req: VercelRequest): void {
  const queryIndex = req.url?.indexOf('?') ?? -1
  req.url = queryIndex >= 0 ? `/${req.url!.slice(queryIndex)}` : '/'
}
