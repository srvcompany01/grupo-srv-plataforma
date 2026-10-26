/**
 * Relatório que a agência manda ao cliente: uma foto dos números do período (anúncios, Instagram e Google Meu
 * Negócio) guardada no banco, aberta por um link público com token, e o texto pronto para o WhatsApp.
 */
import { papelDoObjetivo } from './anuncios-meta'
import { fraseGeogrid, type MetricasGrade, type PontoGrade, type Ponto } from './gmn'
import { totalLeads, type Leads } from './performance'
import type { AvaliacoesNegocio, PalavraChaveNegocio } from './google'

/** 4 = Meta separa captação de reconhecimento; CPL nunca inclui investimento de tráfego/perfil. */
export const VERSAO_RELATORIO = 4
/** Versões anteriores misturam campanha de reconhecimento no custo por lead e não podem continuar públicas. */
export const VERSAO_MINIMA_PUBLICA = 4

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
  instagram: { usuario: string; seguidores: number; novosSeguidores: number; /** Orgânicos x pagos (versão 4+): quem passou a seguir, quem saiu e quantos vieram dos anúncios pela atribuição da Meta. */ seguidoresGanhos?: number; seguidoresPerdidos?: number; seguidoresPagos?: number | null; seguidoresOrganicos?: number | null; /** Legado: na versão 3+, é igual a alcancePosts. */ alcance: number; /** Alcance acumulado somente dos posts publicados no período. */ alcancePosts?: number; /** Cliques no link da bio da plataforma no período. */ cliquesLinkBio?: number | null; visualizacoes: number; interacoes: number; posts: number; engajamentoPosts: number | null; melhorPost: { legenda: string; link: string; interacoes: number } | null } | null
  gmn: { nota: number | null; avaliacoes: number; saude: number; geogrid: { palavra: string; metricas: MetricasGrade; centro: Ponto; pontos: PontoGrade[]; em: string; /** % dos pontos em 1º e o concorrente que mais aparece em 1º (versão 2+). */ primeiro?: number; lider?: { nome: string; pct: number } | null } | null } | null
  /** Métricas do Meu Negócio no período (quando o perfil está ligado e a API responde). */
  meuNegocio?: { visualizacoes: number; buscas: number; mapas: number; ligacoes: number; site: number; rotas: number; /** Campo legado, removido pelo Google em 2026. */ conversas?: number; mensagens?: number; reservas?: number; pedidosComida?: number; cliquesCardapio?: number; avaliacoes?: AvaliacoesNegocio | null; palavrasChave?: PalavraChaveNegocio[]; palavrasPeriodo?: { de: string; ate: string } } | null
  /** Página da bio do cliente: visitas e toques em cada botão no período (só quando houve visita). */
  bio?: { visitas: number; toques: number; botoes: { rotulo: string; toques: number }[] } | null
  /** Só para a equipe (a página pública não mostra). */
  avisosInternos?: string[]
  /** Cada campanha que gastou no período, por plataforma (versão 2+). */
  campanhas?: CampanhaRelatorio[]
  destaques: string[]
}

/** Lead: resultado = leads e custo por lead. Marca (tráfego/conteúdo): cliques no link e custo por clique, nunca CPL. */
export type CampanhaRelatorio = { plataforma: 'meta' | 'google'; nome: string; ativa: boolean; papel: 'lead' | 'marca'; gasto: number | null; resultado: number; rotuloResultado: string; custoPorResultado: number | null }

/** Números de uma plataforma de anúncios. Meta: leads = conversas + formulários + site. Google: leads = conversões. */
export type AnunciosPlataforma = {
  investido: number | null
  /** Só campanhas de captação (sem as de marca/tráfego). */
  investidoCaptacao?: number | null
  leads: number
  conversas: number
  formularios: number
  leadsSite: number
  cliques: number
  impressoes: number
  /** Investimento de captação ÷ leads. */
  custoPorLead: number | null
  /** Seguidores do Instagram atribuídos aos anúncios, de todas as campanhas (Meta). */
  seguidoresAnuncio?: number
  /** Todo o investimento ÷ leads (só quando difere do de captação). */
  custoPorLeadGeral?: number | null
  /** Detalhe da Meta na versão 4+: somente campanhas cujo objetivo é gerar contato. */
  captacao?: { investido: number | null; leads: number; conversas: number; formularios: number; leadsSite: number; custoPorLead: number | null; campanhas: number }
  /** Detalhe da Meta na versão 4+: tráfego/reconhecimento, medido por visitas explícitas ou cliques no link. */
  reconhecimento?: { investido: number | null; cliquesLink: number; visitasPerfil: number; /** Investimento ÷ visitas ao perfil (campanhas otimizadas para visita ao perfil). */ custoPorVisitaPerfil?: number | null; /** Seguidores do Instagram atribuídos aos anúncios e o custo de cada um (quando a Meta entrega). */ seguidoresAnuncio?: number; custoPorSeguidor?: number | null; custoPorClique: number | null; campanhas: number }
}

const arred = (n: number) => Math.round(n * 100) / 100

function plataforma(gasto: number, gastoMarca: number, leads: number, resto: Pick<AnunciosPlataforma, 'conversas' | 'formularios' | 'leadsSite' | 'cliques' | 'impressoes'>, mostrar: boolean): AnunciosPlataforma {
  const captacao = gasto - gastoMarca
  const cpl = (v: number) => (mostrar && leads && v ? arred(v / leads) : null)
  return { investido: mostrar ? arred(gasto) : null, investidoCaptacao: mostrar ? arred(captacao) : null, leads: arred(leads), ...resto, custoPorLead: cpl(captacao), custoPorLeadGeral: gastoMarca > 0 ? cpl(gasto) : null }
}

/** gastoMarca: o que foi para campanhas de marca (gastoDeMarca), fora do custo por lead de captação. */
export const anunciosMeta = (m: { gasto: number; cliques: number; impressoes: number } & Leads, gastoMarca: number, mostrarInvestimento: boolean) =>
  plataforma(m.gasto, gastoMarca, totalLeads(m), { conversas: m.conversas, formularios: m.formularios, leadsSite: m.site, cliques: m.cliques, impressoes: m.impressoes }, mostrarInvestimento)

/** Relatório Meta v4: cada finalidade tem seu investimento e sua métrica; não existe média de CPL com tráfego de perfil. */
export const anunciosMetaSeparados = (m: {
  total: { gasto: number; cliques: number; impressoes: number; seguidoresAnuncio: number }
  captacao: { gasto: number; leads: number; conversas: number; formularios: number; site: number; seguidoresAnuncio: number; custoPorLead: number | null; campanhas: number }
  reconhecimento: { gasto: number; cliquesLink: number; visitasPerfil: number; custoPorVisitaPerfil: number | null; seguidoresAnuncio: number; custoPorSeguidor: number | null; custoPorClique: number | null; campanhas: number }
}, mostrarInvestimento: boolean): AnunciosPlataforma => ({
  investido: mostrarInvestimento ? arred(m.total.gasto) : null,
  investidoCaptacao: mostrarInvestimento ? arred(m.captacao.gasto) : null,
  leads: arred(m.captacao.leads),
  conversas: arred(m.captacao.conversas),
  formularios: arred(m.captacao.formularios),
  leadsSite: arred(m.captacao.site),
  cliques: arred(m.total.cliques),
  impressoes: arred(m.total.impressoes),
  custoPorLead: mostrarInvestimento && m.captacao.custoPorLead !== null ? arred(m.captacao.custoPorLead) : null,
  seguidoresAnuncio: arred(m.total.seguidoresAnuncio),
  captacao: { investido: mostrarInvestimento ? arred(m.captacao.gasto) : null, leads: arred(m.captacao.leads), conversas: arred(m.captacao.conversas), formularios: arred(m.captacao.formularios), leadsSite: arred(m.captacao.site), custoPorLead: mostrarInvestimento && m.captacao.custoPorLead !== null ? arred(m.captacao.custoPorLead) : null, campanhas: m.captacao.campanhas },
  reconhecimento: { investido: mostrarInvestimento ? arred(m.reconhecimento.gasto) : null, cliquesLink: arred(m.reconhecimento.cliquesLink), visitasPerfil: arred(m.reconhecimento.visitasPerfil), custoPorVisitaPerfil: mostrarInvestimento && m.reconhecimento.custoPorVisitaPerfil !== null ? arred(m.reconhecimento.custoPorVisitaPerfil) : null, seguidoresAnuncio: arred(m.reconhecimento.seguidoresAnuncio), custoPorSeguidor: mostrarInvestimento && m.reconhecimento.custoPorSeguidor !== null ? arred(m.reconhecimento.custoPorSeguidor) : null, custoPorClique: mostrarInvestimento && m.reconhecimento.custoPorClique !== null ? arred(m.reconhecimento.custoPorClique) : null, campanhas: m.reconhecimento.campanhas },
})

export const anunciosGoogle = (g: { custo: number; conversoes: number; cliques: number; impressoes: number }, mostrarInvestimento: boolean) =>
  plataforma(g.custo, 0, g.conversoes, { conversas: 0, formularios: 0, leadsSite: 0, cliques: g.cliques, impressoes: g.impressoes }, mostrarInvestimento)

/** "Custo por lead (campanhas de captação): R$ 16,17 · considerando todo o investimento: R$ 19,55". */
export const rotuloCustoPorLead = (p: AnunciosPlataforma) =>
  p.custoPorLead === null ? null : p.custoPorLeadGeral ? `Custo por lead (campanhas de captação): ${reais(p.custoPorLead)} · considerando todo o investimento: ${reais(p.custoPorLeadGeral)}` : `Custo por lead: ${reais(p.custoPorLead)}`

export function campanhaMetaRelatorio(c: { nome: string; status: string; objetivo: string; gasto: number; cliquesLink: number; leads: Leads }, mostrarInvestimento: boolean): CampanhaRelatorio {
  const leads = totalLeads(c.leads)
  const papel = papelDoObjetivo(c.objetivo, leads > 0)
  const resultado = papel === 'lead' ? leads : c.cliquesLink
  const rotuloLead = c.leads.conversas && !c.leads.formularios && !c.leads.site ? 'conversas' : c.leads.formularios && !c.leads.conversas && !c.leads.site ? 'formulários' : c.leads.site && !c.leads.conversas && !c.leads.formularios ? 'leads no site' : 'leads'
  return { plataforma: 'meta', nome: c.nome, ativa: c.status === 'ACTIVE', papel, gasto: mostrarInvestimento ? arred(c.gasto) : null, resultado, rotuloResultado: papel === 'lead' ? rotuloLead : 'cliques no link', custoPorResultado: mostrarInvestimento && resultado ? arred(c.gasto / resultado) : null }
}

export function campanhaGoogleRelatorio(c: { nome: string; status: string; custo: number; conversoes: number }, mostrarInvestimento: boolean): CampanhaRelatorio {
  return { plataforma: 'google', nome: c.nome, ativa: c.status === 'ENABLED', papel: 'lead', gasto: mostrarInvestimento ? arred(c.custo) : null, resultado: arred(c.conversoes), rotuloResultado: 'conversões', custoPorResultado: mostrarInvestimento && c.conversoes ? arred(c.custo / c.conversoes) : null }
}

export const TOKEN_RELATORIO = /^[A-Za-z0-9]{32}$/

export const relatorioDeveSerSubstituido = (versao: number | undefined, revogado = false) => revogado || (versao ?? 1) < VERSAO_MINIMA_PUBLICA

/** Aceita o UUID interno ou uma URL/token público, sem confundir ids com tokens. */
export function referenciaRelatorio(valor: string): { id?: string; token?: string } | null {
  const v = valor.trim()
  if (/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(v)) return { id: v }
  const token = v.match(/(?:^|\/r\/)([A-Za-z0-9]{32})(?:[/?#]|$)/)?.[1]
  return token && TOKEN_RELATORIO.test(token) ? { token } : null
}

export const leadsDoRelatorio = (a: NonNullable<RelatorioCompartilhado['anuncios']>) => a.conversas + a.formularios + (a.leadsSite ?? 0) + Math.round(a.conversoesGoogle)

const data = (d: string) => d.split('-').reverse().slice(0, 2).join('/')
const reais = (n: number) => n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
const num = (n: number) => n.toLocaleString('pt-BR', { maximumFractionDigits: 1 })

/** Texto do WhatsApp: os números principais e o link do relatório completo. */
export function textoWhatsapp(r: RelatorioCompartilhado, url: string): string {
  const linhas = [`Olá! Segue o relatório da ${r.cliente} de ${data(r.de)} a ${data(r.ate)} 📊`, '']
  const bloco = (titulo: string, p: AnunciosPlataforma, detalhe: string) => {
    linhas.push(`*${titulo}*`)
    if (p.captacao && p.reconhecimento) {
      if (p.captacao.investido !== null) linhas.push(`• Captação: ${reais(p.captacao.investido)} · ${num(p.captacao.leads)} leads${detalhe} · CPL ${p.captacao.custoPorLead === null ? '—' : reais(p.captacao.custoPorLead)}`)
      else linhas.push(`• Captação: ${num(p.captacao.leads)} leads${detalhe}`)
      const resultadoMarca = p.reconhecimento.visitasPerfil || p.reconhecimento.cliquesLink
      const rotuloMarca = p.reconhecimento.visitasPerfil ? 'visitas ao perfil' : 'cliques no link'
      if (p.reconhecimento.investido !== null) linhas.push(`• Reconhecimento/tráfego: ${reais(p.reconhecimento.investido)} · ${num(resultadoMarca)} ${rotuloMarca}${p.reconhecimento.visitasPerfil && p.reconhecimento.custoPorVisitaPerfil != null ? ` · custo por visita ${reais(p.reconhecimento.custoPorVisitaPerfil)}` : p.reconhecimento.custoPorClique === null ? '' : ` · custo por clique ${reais(p.reconhecimento.custoPorClique)}`}`)
      else if (resultadoMarca) linhas.push(`• Reconhecimento/tráfego: ${num(resultadoMarca)} ${rotuloMarca}`)
      if (p.seguidoresAnuncio) linhas.push(`• ${num(p.seguidoresAnuncio)} novos seguidores pelos anúncios${p.reconhecimento.custoPorSeguidor != null ? ` · custo por seguidor nas campanhas de perfil ${reais(p.reconhecimento.custoPorSeguidor)}` : ''}`)
    } else {
      if (p.investido !== null) linhas.push(`• Investimento: ${reais(p.investido)}`)
      linhas.push(`• Leads: ${num(p.leads)}${detalhe}`)
      const cpl = rotuloCustoPorLead(p)
      if (cpl) linhas.push(`• ${cpl}`)
    }
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
    if (r.instagram.seguidoresGanhos !== undefined) {
      linhas.push(`• ${num(r.instagram.seguidoresGanhos)} seguidores ganhos no período (total ${num(r.instagram.seguidores)})`)
      if (r.instagram.seguidoresPagos != null && r.instagram.seguidoresOrganicos != null) linhas.push(`  - ${num(r.instagram.seguidoresPagos)} pelos anúncios · ${num(r.instagram.seguidoresOrganicos)} orgânicos · ${num(r.instagram.seguidoresPerdidos ?? 0)} deixaram de seguir`)
      else linhas.push(`  - ${num(r.instagram.seguidoresPerdidos ?? 0)} deixaram de seguir`)
    } else linhas.push(`• ${r.instagram.novosSeguidores >= 0 ? '+' : ''}${num(r.instagram.novosSeguidores)} seguidores (total ${num(r.instagram.seguidores)})`)
    linhas.push(r.instagram.alcancePosts !== undefined ? `• ${num(r.instagram.posts)} posts orgânicos, com ${num(r.instagram.alcancePosts)} de alcance e ${num(r.instagram.interacoes)} interações` : `• ${num(r.instagram.alcance)} pessoas alcançadas pela conta (orgânico + anúncios) · ${num(r.instagram.posts)} posts`)
    if (r.bio) linhas.push(`• ${num(r.bio.visitas)} visitas no link da bio e ${num(r.bio.toques)} toques nos botões${r.bio.toques ? ` (mais tocado: ${r.bio.botoes[0].rotulo})` : ''}`)
    else if (r.instagram.cliquesLinkBio) linhas.push(`• ${num(r.instagram.cliquesLinkBio)} cliques no link da bio`)
    linhas.push('')
  }
  if (r.gmn || r.meuNegocio) {
    linhas.push('*Google*')
    if (r.gmn) {
      linhas.push(`• Nota ${r.gmn.nota === null ? '—' : `★ ${num(r.gmn.nota)}`} com ${num(r.gmn.avaliacoes)} avaliações`)
      if (r.gmn.geogrid) linhas.push(`• ${r.gmn.geogrid.primeiro !== undefined ? fraseGeogrid(r.gmn.geogrid.palavra, r.gmn.geogrid.metricas, r.gmn.geogrid.primeiro, r.gmn.geogrid.lider ?? null) : `Top 3 do Google Maps em ${num(r.gmn.geogrid.metricas.top3)}% da região para "${r.gmn.geogrid.palavra}"`}`)
    }
    if (r.meuNegocio) {
      linhas.push(`• ${num(r.meuNegocio.visualizacoes)} visualizações do perfil (${num(r.meuNegocio.buscas)} na Busca · ${num(r.meuNegocio.mapas)} no Maps)`)
      linhas.push(`• ${num(r.meuNegocio.ligacoes)} ligações · ${num(r.meuNegocio.rotas)} rotas · ${num(r.meuNegocio.site)} cliques no site`)
      if (r.meuNegocio.avaliacoes) linhas.push(`• ${num(r.meuNegocio.avaliacoes.novas)} avaliações novas no período${r.meuNegocio.avaliacoes.notaMedia === null ? '' : ` · média ★ ${num(r.meuNegocio.avaliacoes.notaMedia)}`}`)
    }
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
  meuNegocioLigado: boolean
  /** false = o cliente não tem o link da bio rastreado (cliques da bio não medidos). */
  linkBioRastreado?: boolean
  erroMeuNegocio: string | null
  ativasSemEntrega: string[]
  pausadasComGasto: string[]
  avisosGoogle: string[]
}): string[] {
  const lista = (xs: string[]) => xs.slice(0, 4).join('; ') + (xs.length > 4 ? ` e mais ${xs.length - 4}` : '')
  return [
    ...(e.whatsapp ? [] : ['Cliente sem WhatsApp no cadastro: o link do WhatsApp sai sem destinatário (escolha o contato ao abrir). Cadastre o WhatsApp do cliente na página do cliente.']),
    ...(e.linkBioRastreado === false ? ['Cliques no link da bio não medidos: o cliente não tem a página da bio rastreada. Crie a página da bio na aba Performance (logo, WhatsApp de atendimento e botões) e coloque o endereço dela na bio do Instagram.'] : []),
    ...(!e.meuNegocioLigado ? ['Métricas do Meu Negócio indisponíveis (visualizações, ligações, rotas, cliques no site): perfil do Google Meu Negócio não ligado ao cliente.'] : e.erroMeuNegocio ? [`Métricas do Meu Negócio indisponíveis: ${e.erroMeuNegocio}`] : []),
    ...(e.ativasSemEntrega.length ? [`Campanhas ativas sem nenhum gasto no período (em revisão, reprovadas, público ou pagamento?): ${lista(e.ativasSemEntrega)}.`] : []),
    ...(e.pausadasComGasto.length ? [`Campanhas pausadas que gastaram no período (o cliente pode perguntar por que pararam): ${lista(e.pausadasComGasto)}.`] : []),
    ...e.avisosGoogle,
  ]
}
