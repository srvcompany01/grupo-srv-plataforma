import { dataDeHoje } from '@/dominio/filtros'
import { gerarCsvTempo, lerFiltrosTempo, nomeArquivoCsvTempo } from '@/dominio/tempo-faturavel'
import { usuarioAtual } from '@/infra/supabase/sessao'
import { criarClienteServidor } from '@/infra/supabase/servidor'
import { registrosDoPeriodo } from '@/servicos/tempo'

/** CSV do período com os mesmos filtros da tela e a mesma checagem de papel (admin e gestor). */
export async function GET(req: Request) {
  const eu = await usuarioAtual()
  if (!eu || !eu.ativo || (eu.papel !== 'admin' && eu.papel !== 'gestor')) return new Response('Não encontrado', { status: 404 })
  const filtros = lerFiltrosTempo(Object.fromEntries(new URL(req.url).searchParams), dataDeHoje(new Date()))
  let registros
  try {
    registros = await registrosDoPeriodo(await criarClienteServidor(), filtros)
  } catch (e) {
    console.error(e)
    return new Response('Não foi possível gerar o arquivo.', { status: 500 })
  }
  const csv = gerarCsvTempo(
    registros.map((r) => ({ dia: r.dia, clienteNome: r.clienteNome, listaNome: r.listaNome, tarefaTitulo: r.tarefaTitulo, pessoaNome: r.pessoaNome, nota: r.nota, segundos: r.segundos, faturavel: r.faturavel })),
  )
  return new Response(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${nomeArquivoCsvTempo(filtros.de, filtros.ate)}"`,
      'Cache-Control': 'private, no-store',
      'X-Registros': String(registros.length),
    },
  })
}
