import { WebStandardStreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js'
import { autenticarApi, clienteDoUsuario } from '@/infra/mcp-auth'
import { criarServidorMcp } from '@/mcp/servidor'

export const maxDuration = 60

const naoAutorizado = () =>
  Response.json({ erro: 'Token inválido, revogado ou expirado.' }, { status: 401, headers: { 'WWW-Authenticate': 'Bearer' } })

/** Endpoint MCP (Streamable HTTP, sem sessão). Autenticação: `Authorization: Bearer srv_…` gerado em Configurações. */
export async function POST(req: Request) {
  const sessao = await autenticarApi(req)
  if (!sessao) return naoAutorizado()
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
