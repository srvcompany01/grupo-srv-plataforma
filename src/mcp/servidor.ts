import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { revalidatePath } from 'next/cache'
import { mensagemErro } from '@/dominio/erros-banco'
import { FERRAMENTAS, VERSAO, type Contexto } from './ferramentas'

/** Um servidor por requisição (stateless). Tokens de leitura nem veem as ferramentas de escrita. */
export function criarServidorMcp(ctx: Contexto): McpServer {
  // A versão é o commit em produção: o cliente da IA mostra qual definição das ferramentas está usando.
  const servidor = new McpServer({ name: 'grupo-srv-plataforma', version: `1.0.0+${VERSAO}` })
  for (const f of FERRAMENTAS) {
    if (f.escrita && ctx.escopo !== 'write') continue
    servidor.registerTool(
      f.nome,
      { description: f.descricao, inputSchema: f.entrada, annotations: { readOnlyHint: !f.escrita, destructiveHint: false, openWorldHint: false } },
      async (args: unknown) => {
        try {
          const resultado = await f.executar(ctx, args as never)
          if (f.escrita) revalidatePath('/', 'layout')
          // Ferramentas que devolvem mídia (áudio) mandam os blocos prontos em `__mcp`.
          if (resultado && typeof resultado === 'object' && '__mcp' in resultado) return { content: (resultado as { __mcp: never[] }).__mcp }
          return { content: [{ type: 'text' as const, text: JSON.stringify(resultado) }] }
        } catch (e) {
          const msg = e instanceof Error && !('code' in e) ? e.message : mensagemErro(e)
          if (!(e instanceof Error)) console.error(e)
          return { isError: true, content: [{ type: 'text' as const, text: msg }] }
        }
      },
    )
  }
  return servidor
}

