import { WebStandardStreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js'
import { autenticarApi, clienteDoUsuario } from '@/infra/mcp-auth'
import { criarServidorMcp } from '@/mcp/servidor'
import { CORS, origem } from '@/lib/oauth-http'

// Criar campanha com vídeo espera a Meta processar o arquivo.
export const maxDuration = 300

// O WWW-Authenticate aponta os metadados do OAuth: o app do Claude descobre sozinho como pedir o login.
const naoAutorizado = (req: Request) =>
  Response.json({ erro: 'Token inválido, revogado ou expirado.' }, { status: 401, headers: { ...CORS, 'WWW-Authenticate': `Bearer resource_metadata="${origem(req)}/.well-known/oauth-protected-resource"` } })

/** Endpoint MCP (Streamable HTTP, sem sessão). Autenticação: `Authorization: Bearer srv_…` gerado em Configurações. */
export async function POST(req: Request) {
  const sessao = await autenticarApi(req)
  if (!sessao) return naoAutorizado(req)
  let sb
  try {
    sb = await clienteDoUsuario(sessao.userId)
  } catch (e) {
    console.error(e)
    return Response.json({ erro: 'Não foi possível abrir a sessão do usuário do token.' }, { status: 502 })
  }
  const servidor = criarServidorMcp({ sb, userId: sessao.userId, nome: sessao.nome, papel: sessao.papel, escopo: sessao.escopo })
  const transporte = new WebStandardStreamableHTTPServerTransport({ sessionIdGenerator: undefined, enableJsonResponse: true })
  await servidor.connect(transporte)
  return transporte.handleRequest(req)
}

// Sem sessões nem streaming de servidor: só POST.
const metodoNaoPermitido = () => Response.json({ erro: 'Use POST.' }, { status: 405, headers: { Allow: 'POST' } })
export const GET = metodoNaoPermitido
export const DELETE = metodoNaoPermitido
