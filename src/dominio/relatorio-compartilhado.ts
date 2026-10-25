/**
 * Relatório que a agência manda ao cliente: uma foto dos números do período (anúncios, Instagram e Google Meu
 * Negócio) guardada no banco, aberta por um link público com token, e o texto pronto para o WhatsApp.
 */
import { papelDoObjetivo } from './anuncios-meta'
import { fraseGeogrid, type MetricasGrade, type PontoGrade, type Ponto } from './gmn'
import { totalLeads, type Leads } from './performance'

/** 2 = leads contados por destino (sem somar conversa e "lead" da mesma pessoa) e alcance orgânico separado. */
export const VERSAO_RELATORIO = 2

export type RelatorioCompartilhado = {
  /** Ausente nos relatórios de antes da versão 2 (contagem antiga de leads). */
  versao?: number
  cliente: string
  de: string
  ate: string
  geradoEm: string
  anuncios: {
    /** null quando a agência escolheu não mostrar o investimento. */
    investido: number | null
    conversas: number
    formularios: number
    /** Evento Lead do pixel do site (versão 2+). */
    leadsSite?: number
    conversoesGoogle: number
    cliques: number
    impressoes: number
    custoPorLead: number | null
    /** Cada plataforma com seus próprios números (sem somar Meta e Google). Ausente nos relatórios antigos. */
    meta?: AnunciosPlataforma | null
    google?: AnunciosPlataforma | null
  } | null
  instagram: { usuario: string; seguidores: number; novosSeguidores: number; /** Alcance da CONTA (soma orgânico e anúncios). */ alcance: number; /** Alcance só dos posts do período (orgânico). Versão 2+. */ alcancePosts?: number; visualizacoes: number; interacoes: number; posts: number; engajamentoPosts: number | null; melhorPost: { legenda: string; link: string; interacoes: number } | null } | null
  gmn: { nota: number | null; avaliacoes: number; saude: number; geogrid: { palavra: string; metricas: MetricasGrade; centro: Ponto; pontos: PontoGrade[]; em: string; /** % dos pontos em 1º e o concorrente que mais aparece em 1º (versão 2+). */ primeiro?: number; lider?: { nome: string; pct: number } | null } | null } | null
  /** Métricas do Meu Negócio no período (quando o perfil está ligado e a API responde). */
  meuNegocio?: { visualizacoes: number; buscas: number; mapas: number; ligacoes: number; site: number; rotas: number; conversas: number } | null
  /** Só para a equipe (a página pública não mostra). */
  avisosInternos?: string[]
  /** Cada campanha que gastou no período, por plataforma (versão 2+). */
  campanhas?: CampanhaRelatorio[]
  destaques: string[]
}

/** Lead: resultado = leads e custo por lead. Marca (tráfego/conteúdo): cliques no link e custo por clique, nunca CPL. */
export type CampanhaRelatorio = { plataforma: 'meta' | 'google'; nome: string; ativa: boolean; papel: 'lead' | 'marca'; gasto: number | null; resultado: number; rotuloResultado: string; custoPorResultado: number | null }

/** Números de uma plataforma de anúncios. Meta: leads = conversas + formulários + site. Google: leads = conversões. */
export type AnunciosPlataforma = { investido: number | null; leads: number; conversas: number; formularios: number; leadsSite: number; cliques: number; impressoes: number; custoPorLead: number | null }

const arred = (n: number) => Math.round(n * 100) / 100

function plataforma(gasto: number, leads: number, resto: Omit<AnunciosPlataforma, 'investido' | 'leads' | 'custoPorLead'>, mostrarInvestimento: boolean): AnunciosPlataforma {
  return { investido: mostrarInvestimento ? arred(gasto) : null, leads: arred(leads), ...resto, custoPorLead: mostrarInvestimento && leads && gasto ? arred(gasto / leads) : null }
}

export const anunciosMeta = (m: { gasto: number; cliques: number; impressoes: number } & Leads, mostrarInvestimento: boolean) =>
  plataforma(m.gasto, totalLeads(m), { conversas: m.conversas, formularios: m.formularios, leadsSite: m.site, cliques: m.cliques, impressoes: m.impressoes }, mostrarInvestimento)

export const anunciosGoogle = (g: { custo: number; conversoes: number; cliques: number; impressoes: number }, mostrarInvestimento: boolean) =>
  plataforma(g.custo, g.conversoes, { conversas: 0, formularios: 0, leadsSite: 0, cliques: g.cliques, impressoes: g.impressoes }, mostrarInvestimento)

export function campanhaMetaRelatorio(c: { nome: string; status: string; objetivo: string; gasto: number; cliquesLink: number; leads: Leads }, mostrarInvestimento: boolean): CampanhaRelatorio {
  const leads = totalLeads(c.leads)
  const papel = papelDoObjetivo(c.objetivo, leads > 0)
  const resultado = papel === 'lead' ? leads : c.cliquesLink
  return { plataforma: 'meta', nome: c.nome, ativa: c.status === 'ACTIVE', papel, gasto: mostrarInvestimento ? arred(c.gasto) : null, resultado, rotuloResultado: papel === 'lead' ? (c.leads.conversas && !c.leads.formularios ? 'conversas' : 'leads') : 'cliques no link', custoPorResultado: mostrarInvestimento && resultado ? arred(c.gasto / resultado) : null }
}

export function campanhaGoogleRelatorio(c: { nome: string; status: string; custo: number; conversoes: number }, mostrarInvestimento: boolean): CampanhaRelatorio {
  return { plataforma: 'google', nome: c.nome, ativa: c.status === 'ENABLED', papel: 'lead', gasto: mostrarInvestimento ? arred(c.custo) : null, resultado: arred(c.conversoes), rotuloResultado: 'conversões', custoPorResultado: mostrarInvestimento && c.conversoes ? arred(c.custo / c.conversoes) : null }
}

export const TOKEN_RELATORIO = /^[A-Za-z0-9]{32}$/

export const leadsDoRelatorio = (a: NonNullable<RelatorioCompartilhado['anuncios']>) => a.conversas + a.formularios + (a.leadsSite ?? 0) + Math.round(a.conversoesGoogle)

const data = (d: string) => d.split('-').reverse().slice(0, 2).join('/')
const reais = (n: number) => n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
const num = (n: number) => n.toLocaleString('pt-BR', { maximumFractionDigits: 1 })

/** Texto do WhatsApp: os números principais e o link do relatório completo. */
export function textoWhatsapp(r: RelatorioCompartilhado, url: string): string {
  const linhas = [`Olá! Segue o relatório da ${r.cliente} de ${data(r.de)} a ${data(r.ate)} 📊`, '']
  const bloco = (titulo: string, p: AnunciosPlataforma, detalhe: string) => {
    linhas.push(`*${titulo}*`)
    if (p.investido !== null) linhas.push(`• Investimento: ${reais(p.investido)}`)
    linhas.push(`• Leads: ${num(p.leads)}${detalhe}`)
    if (p.custoPorLead !== null) linhas.push(`• Custo por lead: ${reais(p.custoPorLead)}`)
    linhas.push('')
  }
  if (r.anuncios?.meta || r.anuncios?.google) {
    if (r.anuncios.meta) bloco('Meta Ads (Instagram e Facebook)', r.anuncios.meta, r.anuncios.meta.conversas ? ` (${num(r.anuncios.meta.conversas)} conversas no WhatsApp/Direct)` : '')
    if (r.anuncios.google) bloco('Google Ads', r.anuncios.google, ' (conversões)')
  } else if (r.anuncios) {
    const leads = leadsDoRelatorio(r.anuncios)
    linhas.push('*Anúncios*')
    if (r.anuncios.investido !== null) linhas.push(`• Investimento: ${reais(r.anuncios.investido)}`)
    linhas.push(`• Leads: ${num(leads)}${r.anuncios.conversas ? ` (${num(r.anuncios.conversas)} conversas no WhatsApp/Direct)` : ''}`)
    if (r.anuncios.custoPorLead !== null && r.anuncios.investido !== null) linhas.push(`• Custo por lead: ${reais(r.anuncios.custoPorLead)}`)
    linhas.push('')
  }
  if (r.instagram) {
    linhas.push('*Instagram*')
    linhas.push(`• ${r.instagram.novosSeguidores >= 0 ? '+' : ''}${num(r.instagram.novosSeguidores)} seguidores (total ${num(r.instagram.seguidores)})`)
    linhas.push(r.instagram.alcancePosts !== undefined ? `• ${num(r.instagram.posts)} posts, que alcançaram ${num(r.instagram.alcancePosts)} pessoas (alcance da conta com anúncios: ${num(r.instagram.alcance)})` : `• ${num(r.instagram.alcance)} pessoas alcançadas pela conta (orgânico + anúncios) · ${num(r.instagram.posts)} posts`)
    linhas.push('')
  }
  if (r.gmn) {
    linhas.push('*Google*')
    linhas.push(`• Nota ${r.gmn.nota === null ? '—' : `★ ${num(r.gmn.nota)}`} com ${num(r.gmn.avaliacoes)} avaliações`)
    if (r.gmn.geogrid) linhas.push(`• ${r.gmn.geogrid.primeiro !== undefined ? fraseGeogrid(r.gmn.geogrid.palavra, r.gmn.geogrid.metricas, r.gmn.geogrid.primeiro, r.gmn.geogrid.lider ?? null) : `Top 3 do Google Maps em ${num(r.gmn.geogrid.metricas.top3)}% da região para "${r.gmn.geogrid.palavra}"`}`)
    linhas.push('')
  }
  linhas.push(`Relatório completo: ${url}`)
  return linhas.join('\n')
}

/** Link do WhatsApp com o texto pronto (para o número do cliente, se houver). */
export const linkWhatsapp = (texto: string, numero: string | null) => `https://wa.me/${numero ?? ''}?text=${encodeURIComponent(texto)}`

/**
 * Avisos para a EQUIPE ao gerar o relatório (não aparecem na página do cliente): o que falta no cadastro e o que
 * aconteceu na operação e o cliente vai perguntar.
 */
export function avisosInternos(e: {
  whatsapp: string | null
  telefoneComoWhatsapp: string | null
  meuNegocioLigado: boolean
  erroMeuNegocio: string | null
  ativasSemEntrega: string[]
  pausadasComGasto: string[]
  avisosGoogle: string[]
}): string[] {
  const lista = (xs: string[]) => xs.slice(0, 4).join('; ') + (xs.length > 4 ? ` e mais ${xs.length - 4}` : '')
  return [
    ...(e.whatsapp ? [] : [e.telefoneComoWhatsapp ? `Cliente sem WhatsApp no cadastro: o link do WhatsApp sai sem destinatário. Há um botão para o telefone do cadastro (${e.telefoneComoWhatsapp}); confirme antes que é WhatsApp.` : 'Cliente sem WhatsApp no cadastro: o link do WhatsApp sai sem destinatário (escolha o contato ao abrir). Cadastre o WhatsApp na página do cliente.']),
    ...(!e.meuNegocioLigado ? ['Métricas do Meu Negócio indisponíveis (visualizações, ligações, rotas, cliques no site): perfil do Google Meu Negócio não ligado ao cliente.'] : e.erroMeuNegocio ? [`Métricas do Meu Negócio indisponíveis: ${e.erroMeuNegocio}`] : []),
    ...(e.ativasSemEntrega.length ? [`Campanhas ativas sem nenhum gasto no período (em revisão, reprovadas, público ou pagamento?): ${lista(e.ativasSemEntrega)}.`] : []),
    ...(e.pausadasComGasto.length ? [`Campanhas pausadas que gastaram no período (o cliente pode perguntar por que pararam): ${lista(e.pausadasComGasto)}.`] : []),
    ...e.avisosGoogle,
  ]
}
