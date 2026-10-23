import 'server-only'
import { totaisAnuncios, type AnuncioAvaliado } from '@/dominio/anuncios-meta'
import { totaisCampanhas, type Campanha } from '@/dominio/google'
import type { PagoPorDia, ResumoInstagram, ResumoPago } from '@/dominio/insights'
import type { PeriodoAnuncios } from '@/dominio/periodo-anuncios'
import type { Cliente } from './clientes-plataforma'
import { campanhasGoogle, pagoPorDiaGoogle } from './google-agencia'
import { instagramDoCliente } from './insights-instagram'
import { anunciosAtivos, pagoPorDiaMeta } from './meta-anuncios'

export type DadosDoCliente = {
  ig: ResumoInstagram | null
  anuncios: AnuncioAvaliado[] | null
  campanhas: { campanhas: Campanha[]; moeda: string } | null
  pago: ResumoPago
  pagoPorDia: PagoPorDia[]
  /** O que não deu para buscar (aparece como aviso). */
  erros: string[]
}

type Ou<T> = T | { erro: string } | null
const ok = <T,>(x: Ou<T>, erros: string[], fonte: string): T | null => {
  if (x && typeof x === 'object' && 'erro' in x) {
    erros.push(`${fonte}: ${x.erro}`)
    return null
  }
  return x as T | null
}

/**
 * Tudo de um cliente no período: Instagram (detalhado), anúncios do Meta e campanhas do Google, e o pago por dia.
 * `partes` limita o que buscar (a aba Anúncios não precisa do Instagram; a aba Insights não precisa do pago).
 */
export async function dadosDoCliente(c: Cliente, periodo: PeriodoAnuncios, googleConectado: boolean, partes: { pago?: boolean; organico?: boolean } = {}): Promise<DadosDoCliente> {
  const pago = partes.pago !== false
  const comGoogle = pago && !!c.googleAdsId && googleConectado
  const comMeta = pago && !!c.metaContaId
  const [igR, anR, metaDiaR, gR, gDiaR] = await Promise.all([
    c.metaPaginaId && partes.organico !== false ? instagramDoCliente(c.metaPaginaId, periodo, true) : null,
    comMeta ? anunciosAtivos(c.metaContaId!, periodo) : null,
    comMeta ? pagoPorDiaMeta(c.metaContaId!, periodo) : null,
    comGoogle ? campanhasGoogle(c.googleAdsId!, periodo) : null,
    comGoogle ? pagoPorDiaGoogle(c.googleAdsId!, periodo) : null,
  ])
  const erros: string[] = []
  const ig = ok(igR, erros, 'Instagram')
  const an = ok(anR, erros, 'Meta')?.anuncios ?? null
  const metaDia = ok(metaDiaR, erros, 'Meta (por dia)') ?? []
  const g = ok(gR, erros, 'Google Ads')
  const gDia = ok(gDiaR, erros, 'Google Ads (por dia)') ?? []

  const porDia = new Map<string, PagoPorDia>()
  for (const d of [...metaDia, ...gDia]) {
    const atual = porDia.get(d.dia) ?? { dia: d.dia, gasto: 0, impressoes: 0, alcance: 0, cliques: 0 }
    porDia.set(d.dia, { dia: d.dia, gasto: atual.gasto + d.gasto, impressoes: atual.impressoes + d.impressoes, alcance: atual.alcance + d.alcance, cliques: atual.cliques + d.cliques })
  }
  // Meta: números da conta inteira no período (inclui anúncios já pausados); avaliação pelos anúncios ativos.
  const somaMeta = (k: 'gasto' | 'impressoes' | 'alcance' | 'cliques') => metaDia.reduce((s, d) => s + d[k], 0)
  const meta: ResumoPago['meta'] = an || metaDia.length
    ? {
        gasto: metaDia.length ? somaMeta('gasto') : totaisAnuncios(an ?? []).gasto,
        impressoes: metaDia.length ? somaMeta('impressoes') : totaisAnuncios(an ?? []).impressoes,
        alcance: somaMeta('alcance'),
        cliques: metaDia.length ? somaMeta('cliques') : totaisAnuncios(an ?? []).cliques,
        ctr: 0,
        anuncios: an?.length ?? 0,
        fracos: an?.filter((a) => a.desempenho === 'fraco').length ?? 0,
        frequenciaAlta: an?.filter((a) => a.frequencia >= 3.5).length ?? 0,
      }
    : null
  if (meta) meta.ctr = meta.impressoes ? (meta.cliques / meta.impressoes) * 100 : 0
  const tg = g ? totaisCampanhas(g.campanhas) : null
  return {
    ig,
    anuncios: an,
    campanhas: g,
    pago: { meta, google: tg && g ? { custo: tg.custo, cliques: tg.cliques, conversoes: tg.conversoes, ctr: tg.ctr, custoPorConversao: tg.custoPorConversao, campanhas: g.campanhas.length } : null },
    pagoPorDia: [...porDia.values()].sort((a, b) => a.dia.localeCompare(b.dia)),
    erros,
  }
}
