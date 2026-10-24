import { json, opcoes } from '@/lib/oauth-http'
import { ErroOAuth, renovar, trocarCodigo } from '@/servicos/oauth'

/** Troca o código (com PKCE) pelo token, ou renova com o refresh token. */
export async function POST(req: Request) {
  const tipo = req.headers.get('content-type') ?? ''
  const f = tipo.includes('application/json') ? new Map(Object.entries((await req.json()) as Record<string, string>)) : new Map((await req.formData()).entries())
  const v = (k: string) => String(f.get(k) ?? '')
  try {
    if (v('grant_type') === 'authorization_code') return json(await trocarCodigo({ codigo: v('code'), clientId: v('client_id'), retorno: v('redirect_uri'), verifier: v('code_verifier') }))
    if (v('grant_type') === 'refresh_token') return json(await renovar({ renovacao: v('refresh_token'), clientId: v('client_id') }))
    return json({ error: 'unsupported_grant_type' }, 400)
  } catch (e) {
    if (e instanceof ErroOAuth) return json({ error: e.codigo, error_description: e.message }, 400)
    console.error(e)
    return json({ error: 'server_error' }, 500)
  }
}
export const OPTIONS = opcoes
