import { NextResponse } from 'next/server'
import { slugify } from '@/dominio/blog'
import { planilhaDoRelatorio, planilhaMensal } from '@/dominio/exportar'
import { dataDeHoje } from '@/dominio/filtros'
import { lerPeriodo } from '@/dominio/periodo-anuncios'
import { lerMes, rotuloMesLongo } from '@/dominio/performance'
import { gerarXlsx } from '@/dominio/xlsx'
import { usuarioAtual } from '@/infra/supabase/sessao'
import { criarClienteServidor } from '@/infra/supabase/servidor'
import { buscarCliente, listarClientes } from '@/servicos/clientes-plataforma'
import { situacaoGoogle } from '@/servicos/google-agencia'
import { historicoDoCliente } from '@/servicos/performance'
import { calcularRelatorio } from '@/servicos/relatorio-compartilhado'

export const maxDuration = 120

const XLSX = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'

/**
 * Planilha (.xlsx) da Performance, só para a equipe:
 *  - ?cliente=<id>&de=&ate= (ou dias=7|30): todos os canais do cliente no período (os mesmos números do panorama e do relatório);
 *  - sem cliente, ?mes=AAAA-MM: a tabela de todos os clientes no mês.
 */
export async function GET(req: Request) {
  const eu = await usuarioAtual()
  if (!eu || !eu.ativo || eu.papel === 'cliente') return NextResponse.json({ erro: 'Só a equipe.' }, { status: 403 })
  const u = new URL(req.url).searchParams
  const hoje = dataDeHoje(new Date())
  const sb = await criarClienteServidor()
  try {
    const clienteId = u.get('cliente')
    if (clienteId) {
      const c = await buscarCliente(sb, clienteId)
      if (!c) return NextResponse.json({ erro: 'Cliente não encontrado.' }, { status: 404 })
      const periodo = lerPeriodo({ de: u.get('de') ?? undefined, ate: u.get('ate') ?? undefined, dias: u.get('dias') ?? '30' }, hoje)
      const { dados, avisos } = await calcularRelatorio(sb, c, periodo, { mostrarInvestimento: true })
      return arquivo(gerarXlsx(planilhaDoRelatorio(dados, avisos)), `performance-${slugify(c.nome, 40)}-${periodo.de}_${periodo.ate}`)
    }
    const mes = lerMes(u.get('mes') ?? undefined, hoje)
    const clientes = (await listarClientes(sb)).filter((c) => !c.interno && c.status !== 'encerrado')
    const google = await situacaoGoogle()
    const linhas = await Promise.all(clientes.map(async (c) => ({ rotulo: c.nome, m: (await historicoDoCliente(sb, c, [mes], hoje, google.conectado)).meses[0] })))
    return arquivo(gerarXlsx(planilhaMensal(rotuloMesLongo(mes), linhas)), `performance-todos-${mes}`)
  } catch (e) {
    console.error('exportar performance', e)
    return NextResponse.json({ erro: 'Não foi possível gerar a planilha agora. Tente de novo.' }, { status: 500 })
  }
}

function arquivo(bytes: Uint8Array, nome: string) {
  return new Response(bytes as BodyInit, { headers: { 'Content-Type': XLSX, 'Content-Disposition': `attachment; filename="${nome}.xlsx"`, 'Cache-Control': 'no-store' } })
}
