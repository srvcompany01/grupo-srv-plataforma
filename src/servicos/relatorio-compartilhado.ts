import 'server-only'
import { analisarSaude, fraseGeogrid, liderDaGrade, pctPrimeiro, telefoneDivergente } from '@/dominio/gmn'
import { avisosGoogle, totaisCampanhas } from '@/dominio/google'
import { analisarOrganico, analisarPago, engajamentoOrganico } from '@/dominio/insights'
import type { PeriodoAnuncios } from '@/dominio/periodo-anuncios'
import { anunciosGoogle, anunciosMeta, avisosInternos, campanhaGoogleRelatorio, campanhaMetaRelatorio, leadsDoRelatorio, linkWhatsapp, textoWhatsapp, TOKEN_RELATORIO, VERSAO_RELATORIO, type RelatorioCompartilhado } from '@/dominio/relatorio-compartilhado'
import { gerarToken } from '@/dominio/token'
import { criarClienteAdmin } from '@/infra/supabase/admin'
import type { Supabase } from '@/infra/supabase/servidor'
import type { Json } from '@/infra/supabase/tipos'
import type { Cliente } from './clientes-plataforma'
import { campanhasGoogle, estruturaGoogle, metricasDoNegocio, situacaoGoogle } from './google-agencia'
import { lerWhatsapp } from './clientes-plataforma'
import { instagramDoCliente } from './insights-instagram'
import { campanhasDoPeriodoMeta, totaisDoPeriodoMeta } from './meta-anuncios'
import { detalhesDoLugar, placesConfigurado, resumoDosLugares, varreduras } from './places'

const BASE = () => process.env.NEXT_PUBLIC_URL_BASE ?? 'https://app.gruposrv.com.br'
export const urlDoRelatorio = (token: string) => `${BASE()}/r/${token}`

/** Junta os números do período (o que der: cada fonte que falhar fica de fora) e guarda a foto. */
export async function gerarRelatorio(sb: Supabase, c: Cliente, periodo: Pick<PeriodoAnuncios, 'de' | 'ate'>, opcoes: { mostrarInvestimento: boolean; automatico?: boolean }): Promise<{ id: string; url: string; texto: string; whatsapp: string | null; whatsappTelefone: string | null; avisos: string[]; dados: RelatorioCompartilhado }> {
  const google = c.googleAdsId ? await situacaoGoogle() : null
  const [meta, goog, ig, lugar, scans, campsMeta, campsGoogle, negocio] = await Promise.all([
    c.metaContaId ? totaisDoPeriodoMeta(c.metaContaId, periodo) : null,
    c.googleAdsId && google?.conectado ? campanhasGoogle(c.googleAdsId, periodo) : null,
    c.metaPaginaId ? instagramDoCliente(c.metaPaginaId, periodo, true) : null,
    c.googlePlaceId && placesConfigurado() ? detalhesDoLugar(sb, c.googlePlaceId).catch(() => null) : null,
    c.googlePlaceId ? varreduras(sb, c.id, 1) : [],
    c.metaContaId ? campanhasDoPeriodoMeta(c.metaContaId, periodo) : null,
    c.googleAdsId && google?.conectado ? estruturaGoogle(c.googleAdsId, periodo) : null,
    c.googlePerfil ? metricasDoNegocio(c.googlePerfil, periodo.de, periodo.ate) : null,
  ])
  const cm = campsMeta && !('erro' in campsMeta) ? campsMeta : null
  const cg = campsGoogle && !('erro' in campsGoogle) ? campsGoogle : null
  const telefoneComoWhatsapp = !c.whatsapp && c.telefone ? lerWhatsapp(c.telefone) ?? null : null
  const divergente = lugar ? telefoneDivergente(lugar.telefone, [c.telefone, c.whatsapp]) : null
  const avisos = avisosInternos({
    whatsapp: c.whatsapp,
    telefoneComoWhatsapp,
    meuNegocioLigado: !!c.googlePerfil,
    erroMeuNegocio: negocio && 'erro' in negocio ? negocio.erro : null,
    ativasSemEntrega: [...(cm?.ativasSemGasto.map((n) => `${n} (Meta)`) ?? []), ...(cg?.filter((x) => x.status === 'ENABLED' && x.custo === 0).map((x) => `${x.nome} (Google)`) ?? [])],
    pausadasComGasto: [...(cm?.campanhas.filter((x) => x.status === 'PAUSED').map((x) => `${x.nome} (Meta)`) ?? []), ...(cg?.filter((x) => x.status === 'PAUSED' && x.custo > 0).map((x) => `${x.nome} (Google)`) ?? [])],
    avisosGoogle: [...(goog && !('erro' in goog) ? avisosGoogle(totaisCampanhas(goog.campanhas)) : []), ...(divergente ? [divergente] : [])],
  })
  const m = meta && !('erro' in meta) ? meta : null
  const g = goog && !('erro' in goog) ? totaisCampanhas(goog.campanhas) : null
  const i = ig && !('erro' in ig) ? ig : null
  const investido = (m?.gasto ?? 0) + (g?.custo ?? 0)
  const anuncios: RelatorioCompartilhado['anuncios'] = m || g ? {
    investido: opcoes.mostrarInvestimento ? Math.round(investido * 100) / 100 : null,
    conversas: m?.conversas ?? 0,
    formularios: m?.formularios ?? 0,
    leadsSite: m?.site ?? 0,
    conversoesGoogle: g?.conversoes ?? 0,
    cliques: (m?.cliques ?? 0) + (g?.cliques ?? 0),
    impressoes: (m?.impressoes ?? 0) + (g?.impressoes ?? 0),
    custoPorLead: null,
    meta: m ? anunciosMeta(m, opcoes.mostrarInvestimento) : null,
    google: g ? anunciosGoogle(g, opcoes.mostrarInvestimento) : null,
  } : null
  if (anuncios) {
    const leads = leadsDoRelatorio(anuncios)
    anuncios.custoPorLead = leads && investido ? Math.round((investido / leads) * 100) / 100 : null
  }
  const dias = Math.round((Date.parse(periodo.ate) - Date.parse(periodo.de)) / 86_400_000) + 1
  const melhor = i ? [...i.posts].sort((a, b) => b.interacoes - a.interacoes)[0] : undefined
  const scan = scans[0]
  const lider = scan && c.googlePlaceId ? liderDaGrade(scan.pontos, c.googlePlaceId) : null
  const nomeLider = lider ? (await resumoDosLugares(sb, [lider.id]).catch(() => new Map())).get(lider.id)?.nome ?? null : null
  const primeiro = scan ? pctPrimeiro(scan.pontos) : 0
  const liderInfo = lider && nomeLider ? { nome: nomeLider as string, pct: lider.pct } : null
  const dados: RelatorioCompartilhado = {
    versao: VERSAO_RELATORIO,
    cliente: c.nome,
    de: periodo.de,
    ate: periodo.ate,
    geradoEm: new Date().toISOString(),
    anuncios,
    instagram: i ? { usuario: i.usuario, seguidores: i.seguidores, novosSeguidores: i.novosSeguidores, alcance: i.alcance, alcancePosts: i.posts.reduce((s, p) => s + p.alcance, 0), visualizacoes: i.visualizacoes, interacoes: i.interacoes, posts: i.posts.length, engajamentoPosts: engajamentoOrganico(i), melhorPost: melhor ? { legenda: melhor.legenda.slice(0, 140), link: melhor.link, interacoes: melhor.interacoes } : null } : null,
    gmn: lugar ? { nota: lugar.nota, avaliacoes: lugar.avaliacoes, saude: analisarSaude(lugar.perfil, periodo.ate).nota, geogrid: scan ? { palavra: scan.palavra, metricas: scan.metricas, centro: scan.centro, pontos: scan.pontos, em: scan.em, primeiro, lider: liderInfo } : null } : null,
    // Só o que deu certo (tom "bom") vai como destaque para o cliente; o que precisa melhorar a agência conversa.
    campanhas: [
      ...(cm ? cm.campanhas.map((x) => campanhaMetaRelatorio(x, opcoes.mostrarInvestimento)) : []),
      ...(cg ? cg.filter((x) => x.custo > 0).sort((a, b) => b.custo - a.custo).map((x) => campanhaGoogleRelatorio(x, opcoes.mostrarInvestimento)) : []),
    ],
    meuNegocio: negocio && !('erro' in negocio) ? { visualizacoes: negocio.visualizacoes, buscas: negocio.buscas, mapas: negocio.mapas, ligacoes: negocio.ligacoes, site: negocio.site, rotas: negocio.rotas, conversas: negocio.conversas } : null,
    avisosInternos: avisos,
    destaques: [
      ...(m || g ? analisarPago({ meta: m ? { gasto: m.gasto, impressoes: m.impressoes, alcance: 0, cliques: m.cliques, ctr: m.impressoes ? (m.cliques / m.impressoes) * 100 : 0, anuncios: 0, fracos: 0, frequenciaAlta: 0 } : null, google: g ? { custo: g.custo, cliques: g.cliques, conversoes: g.conversoes, ctr: g.impressoes ? (g.cliques / g.impressoes) * 100 : 0, custoPorConversao: g.conversoes ? g.custo / g.conversoes : 0, campanhas: goog && !('erro' in goog) ? goog.campanhas.length : 0 } : null }).destaques : []),
      ...(i ? analisarOrganico(i, dias).destaques : []),
      ...(scan ? [{ tom: 'bom' as const, texto: fraseGeogrid(scan.palavra, scan.metricas, primeiro, liderInfo) }] : []),
    ].filter((d) => d.tom === 'bom' && (opcoes.mostrarInvestimento || !/R\$/.test(d.texto))).map((d) => d.texto).slice(0, 5),
  }
  const token = gerarToken()
  const { data, error } = await sb.from('client_reports').insert({ token, client_id: c.id, de: periodo.de, ate: periodo.ate, dados: dados as unknown as Json, automatico: !!opcoes.automatico }).select('id').single()
  if (error) throw error
  const url = urlDoRelatorio(token)
  const texto = textoWhatsapp(dados, url)
  return { id: data.id, url, texto, whatsapp: c.whatsapp ? linkWhatsapp(texto, c.whatsapp) : null, whatsappTelefone: telefoneComoWhatsapp ? linkWhatsapp(texto, telefoneComoWhatsapp) : null, avisos, dados }
}

export type RelatorioGerado = { id: string; url: string; de: string; ate: string; automatico: boolean; em: string; texto: string; whatsapp: string | null; avisos: string[]; desatualizado: boolean }

export async function relatoriosDoCliente(sb: Supabase, c: Pick<Cliente, 'id' | 'whatsapp'>, limite = 10): Promise<RelatorioGerado[]> {
  const { data, error } = await sb.from('client_reports').select('id, token, de, ate, automatico, created_at, dados').eq('client_id', c.id).order('created_at', { ascending: false }).limit(limite)
  if (error) return []
  return data.map((r) => {
    const url = urlDoRelatorio(r.token)
    const d = r.dados as unknown as RelatorioCompartilhado
    const texto = textoWhatsapp(d, url)
    return { id: r.id, url, de: r.de, ate: r.ate, automatico: r.automatico, em: r.created_at, texto, whatsapp: c.whatsapp ? linkWhatsapp(texto, c.whatsapp) : null, avisos: d.avisosInternos ?? [], desatualizado: (d.versao ?? 1) < VERSAO_RELATORIO }
  })
}

/** Leitura pública pelo token (página /r/<token>): só os dados guardados, nada além. */
export async function relatorioPorToken(token: string): Promise<RelatorioCompartilhado | null> {
  if (!TOKEN_RELATORIO.test(token)) return null
  const { data } = await criarClienteAdmin().from('client_reports').select('dados').eq('token', token).maybeSingle()
  return (data?.dados as unknown as RelatorioCompartilhado) ?? null
}

/** Rotina do dia 1: relatório do mês anterior de cada cliente ativo; avisa a equipe no sino para enviar. */
export async function relatoriosDoMes(hoje: string): Promise<number> {
  const admin = criarClienteAdmin()
  const sb = admin as unknown as Supabase
  const [ano, mes] = hoje.split('-').map(Number)
  const inicio = new Date(Date.UTC(ano, mes - 2, 1)).toISOString().slice(0, 10)
  const fim = new Date(Date.UTC(ano, mes - 1, 0)).toISOString().slice(0, 10)
  const { listarClientes } = await import('./clientes-plataforma')
  const clientes = (await listarClientes(sb)).filter((c) => !c.interno && c.status === 'ativo' && (c.metaContaId || c.googleAdsId || c.metaPaginaId || c.googlePlaceId))
  const { data: gestores } = await admin.from('profiles').select('id').in('role', ['admin', 'gestor']).eq('active', true)
  const nomeMes = new Intl.DateTimeFormat('pt-BR', { month: 'long', timeZone: 'UTC' }).format(new Date(`${inicio}T12:00:00Z`))
  let feitos = 0
  for (const c of clientes) {
    try {
      await gerarRelatorio(sb, c, { de: inicio, ate: fim }, { mostrarInvestimento: true, automatico: true })
      feitos++
      if (gestores?.length) await admin.from('notifications').insert(gestores.map((g) => ({ user_id: g.id, kind: 'alerta', message: `Relatório de ${nomeMes} da ${c.nome} pronto: abra para enviar ao cliente pelo WhatsApp.`.slice(0, 300), link: `/clientes/${c.id}#relatorios` })))
    } catch (e) {
      console.error('relatório do mês', c.id, e)
    }
  }
  return feitos
}
