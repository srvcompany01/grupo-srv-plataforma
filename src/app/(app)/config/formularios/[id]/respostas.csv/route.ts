import { valorCsv } from '@/dominio/formularios'
import { exigirAdmin } from '@/infra/supabase/sessao'
import { criarClienteServidor } from '@/infra/supabase/servidor'
import { respostasFormulario } from '@/servicos/formularios'

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  await exigirAdmin()
  const { id } = await params
  if (!/^[0-9a-f-]{36}$/i.test(id)) return new Response('Identificador inválido.', { status: 400 })
  const sb = await criarClienteServidor()
  const corte = new Date().toISOString()
  const codificador = new TextEncoder()
  let pagina = 0, iniciou = false
  const stream = new ReadableStream<Uint8Array>({
    async pull(controller) {
      try {
        if (!iniciou) { controller.enqueue(codificador.encode('\uFEFF' + ['ID do envio','Recebido em','Pergunta','Valor','Pontuação','Tarefa','Origem'].map(valorCsv).join(';') + '\r\n')); iniciou = true }
        const { itens, total } = await respostasFormulario(sb, id, pagina, corte)
        const linhas = itens.flatMap((r) => r.perguntas.filter((c) => r.respostas[c.key] !== undefined).map((c) => [r.id, r.criadaEm, c.label, r.respostas[c.key], r.pontuacao, r.tarefaId, Object.entries(r.origem).map(([k,v]) => `${k}=${v}`).join('&')].map(valorCsv).join(';')))
        if (linhas.length) controller.enqueue(codificador.encode(linhas.join('\r\n') + '\r\n'))
        pagina++
        if (pagina * 50 >= total || !itens.length) controller.close()
      } catch { controller.error(new Error('Não foi possível concluir a exportação.')) }
    },
  })
  return new Response(stream, { headers: { 'Content-Type': 'text/csv; charset=utf-8', 'Content-Disposition': `attachment; filename="formulario-${id}.csv"`, 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' } })
}
