import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { revalidatePath } from 'next/cache'
import { mensagemErro } from '@/dominio/erros-banco'
import { FERRAMENTAS, type Contexto } from './ferramentas'

/** Um servidor por requisição (stateless). Tokens de leitura nem veem as ferramentas de escrita. */
export function criarServidorMcp(ctx: Contexto): McpServer {
  const servidor = new McpServer({ name: 'grupo-srv-plataforma', version: '1.0.0' })
  for (const f of FERRAMENTAS) {
    if (f.escrita && ctx.escopo !== 'write') continue
    servidor.registerTool(
      f.nome,
      { description: f.descricao, inputSchema: f.entrada, annotations: { readOnlyHint: !f.escrita, destructiveHint: false, openWorldHint: false } },
      async (args: unknown) => {
        try {
          const resultado = await f.executar(ctx, args as never)
          if (f.escrita) revalidatePath('/', 'layout')
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

