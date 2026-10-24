import { json, opcoes, origem } from '@/lib/oauth-http'

/** RFC 9728: o MCP (/api/mcp) é protegido pelo OAuth desta mesma plataforma. */
export function GET(req: Request) {
  const base = origem(req)
  return json({ resource: `${base}/api/mcp`, authorization_servers: [base], bearer_methods_supported: ['header'], scopes_supported: ['mcp', 'read', 'write'], resource_name: 'Plataforma Grupo SRV' })
}
export const OPTIONS = opcoes
