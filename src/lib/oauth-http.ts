/** Respostas JSON das rotas OAuth (CORS aberto: o app do Claude chama de outro domínio). */
export const CORS = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'GET, POST, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type, Authorization, mcp-protocol-version' }

export const json = (corpo: unknown, status = 200) => Response.json(corpo, { status, headers: { ...CORS, 'Cache-Control': 'no-store' } })

export const opcoes = () => new Response(null, { status: 204, headers: CORS })

export const origem = (req: Request) => {
  const u = new URL(req.url)
  const host = req.headers.get('x-forwarded-host') ?? u.host
  const proto = req.headers.get('x-forwarded-proto') ?? u.protocol.replace(':', '')
  return `${proto}://${host}`
}
