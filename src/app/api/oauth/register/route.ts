import { json, opcoes } from '@/lib/oauth-http'
import { ErroOAuth, registrarCliente } from '@/servicos/oauth'

/** RFC 7591: registro dinâmico (o app do Claude se cadastra sozinho; cliente público, com PKCE). */
export async function POST(req: Request) {
  try {
    return json(await registrarCliente(await req.json()), 201)
  } catch (e) {
    if (e instanceof ErroOAuth) return json({ error: e.codigo, error_description: e.message }, 400)
    console.error(e)
    return json({ error: 'invalid_client_metadata' }, 400)
  }
}
export const OPTIONS = opcoes
