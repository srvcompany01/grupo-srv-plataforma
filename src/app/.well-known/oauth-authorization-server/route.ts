import { json, opcoes, origem } from '@/lib/oauth-http'

/** RFC 8414: onde o app do Claude se registra, pede autorização e troca o código pelo token. */
export function GET(req: Request) {
  const base = origem(req)
  return json({
    issuer: base,
    authorization_endpoint: `${base}/oauth/autorizar`,
    token_endpoint: `${base}/api/oauth/token`,
    registration_endpoint: `${base}/api/oauth/register`,
    response_types_supported: ['code'],
    grant_types_supported: ['authorization_code', 'refresh_token'],
    code_challenge_methods_supported: ['S256'],
    token_endpoint_auth_methods_supported: ['none'],
    scopes_supported: ['mcp', 'read', 'write'],
  })
}
export const OPTIONS = opcoes
