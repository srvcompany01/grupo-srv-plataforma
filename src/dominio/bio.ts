import type { Analise, Item } from './insights'

/**
 * Página da bio do cliente: só o nome e a logo do cliente, com os botões (WhatsApp do cadastro + links extras).
 * Fica no domínio dedicado (BIO_DOMINIO, ex.: links.exemplo.com/<cliente>) ou, sem ele, em /l/<cliente>.
 */
export const MAXIMO_LINKS_BIO = 8
export const ORIGENS_BIO = ['bio', 'story', 'anuncio'] as const

/** Robôs e pré-visualizações (Instagram, WhatsApp, Facebook, buscadores) não contam como clique. */
export const ehRobo = (userAgent: string | null | undefined) => !userAgent || /bot|crawl|spider|slurp|preview|facebookexternalhit|facebot|whatsapp|telegram|skype|embedly|quora|pinterest|headless|lighthouse|curl|wget|python-requests|okhttp|go-http/i.test(userAgent)

export const origemDaBio = (o: string | null | undefined) => (o && /^[a-z0-9_-]{1,20}$/.test(o) ? o : 'bio')

export const slugValido = (slug: string) => /^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug)

/** Endereço da página: no domínio dedicado (sem prefixo) ou no do app, em /l/. */
export function urlDaBio(slug: string, origem: string | null = null, dominio: string | undefined = process.env.BIO_DOMINIO): string {
  const base = dominio ? `https://${dominio}/${slug}` : `https://www.gruposrv.com.br/l/${slug}`
  return origem && origem !== 'bio' ? `${base}?o=${origem}` : base
}

/** Reescreve o caminho que chega no domínio da bio para a rota interna; null = não existe (página em branco 404). */
export function caminhoInternoDaBio(caminho: string): string | null {
  const m = caminho.match(/^\/([a-z0-9]+(?:-[a-z0-9]+)*)(?:\/ir\/([a-z0-9-]{1,40})|\/(v))?\/?$/)
  if (!m) return null
  return m[2] ? `/l/${m[1]}/ir/${m[2]}` : m[3] ? `/l/${m[1]}/v` : `/l/${m[1]}`
}

export const hostEhDaBio = (host: string | null, dominio: string | undefined) => !!dominio && !!host && host.split(':')[0].toLowerCase() === dominio.toLowerCase()

/** Rótulo e endereço de um botão: https obrigatório (completa se faltar), até 500 caracteres. */
export function lerLinkBio(rotulo: string, url: string): { rotulo: string; url: string } | { erro: string } {
  const r = rotulo.trim()
  if (!r || r.length > 40) return { erro: 'Dê um nome de até 40 caracteres ao botão.' }
  const bruto = url.trim()
  const completo = /^https?:\/\//i.test(bruto) ? bruto : `https://${bruto}`
  try {
    const u = new URL(completo)
    if (!/^https?:$/.test(u.protocol) || !u.hostname.includes('.') || completo.length > 500) throw new Error('url')
    return { rotulo: r, url: u.toString() }
  } catch {
    return { erro: 'Endereço inválido. Use algo como https://www.site.com.br.' }
  }
}

// ───────────────────────────── Relatório da bio ─────────────────────────────

export type ResumoBio = {
  /** Cliques no link da bio: cada vez que alguém tocou no link e a página foi pedida (robôs não contam). */
  cliques: number
  /** Visualizações: a página chegou a abrir no aparelho. Clique sem visualização = a pessoa desistiu antes de abrir. */
  visualizacoes: number
  /** Pessoas distintas por dia (hash de IP + aparelho), somadas nos dias do período: a mesma pessoa em dois dias conta duas vezes. */
  pessoas: number
  /** Toques somados em todos os botões. */
  toques: number
  /** Leads orgânicos: toques no botão do WhatsApp (atendimento). Cada toque é um lead. */
  leadsOrganicos: number
  porOrigem: { origem: string; cliques: number; visualizacoes: number }[]
  porDia: { dia: string; cliques: number; visualizacoes: number; toques: number }[]
  /** Todos os botões da página (inclusive sem toque) e os já removidos que tiveram toque no período. */
  botoes: { id: string; rotulo: string; toques: number; ativo: boolean }[]
}

type LinhaClique = { day: string; origem: string; clicks: number }
type LinhaVisualizacao = { day: string; origem: string; views: number; visitantes: number }
type LinhaBotao = { botao: string; rotulo: string | null; day: string; clicks: number }

/** Junta as linhas do banco no resumo. `links`: botões extras de hoje; `temWhatsapp`: se há o botão do WhatsApp. */
export function montarResumoBio(a: { visitas: LinhaClique[]; visualizacoes?: LinhaVisualizacao[]; botoes: LinhaBotao[]; links: { id: string; rotulo: string }[]; temWhatsapp: boolean }): ResumoBio {
  const dias = new Map<string, { cliques: number; visualizacoes: number; toques: number }>()
  const dia = (d: string) => dias.get(d) ?? dias.set(d, { cliques: 0, visualizacoes: 0, toques: 0 }).get(d)!
  const origens = new Map<string, { cliques: number; visualizacoes: number }>()
  const origem = (o: string) => origens.get(o) ?? origens.set(o, { cliques: 0, visualizacoes: 0 }).get(o)!
  for (const v of a.visitas) {
    dia(v.day).cliques += v.clicks
    origem(v.origem).cliques += v.clicks
  }
  let pessoas = 0
  for (const v of a.visualizacoes ?? []) {
    dia(v.day).visualizacoes += v.views
    origem(v.origem).visualizacoes += v.views
    pessoas += v.visitantes
  }
  const toquesPorBotao = new Map<string, { toques: number; rotulo: string | null }>()
  for (const b of a.botoes) {
    dia(b.day).toques += b.clicks
    const atual = toquesPorBotao.get(b.botao) ?? { toques: 0, rotulo: null }
    toquesPorBotao.set(b.botao, { toques: atual.toques + b.clicks, rotulo: b.rotulo ?? atual.rotulo })
  }
  const botoes: ResumoBio['botoes'] = [
    ...(a.temWhatsapp || toquesPorBotao.has('whatsapp') ? [{ id: 'whatsapp', rotulo: 'WhatsApp', toques: toquesPorBotao.get('whatsapp')?.toques ?? 0, ativo: a.temWhatsapp }] : []),
    ...a.links.map((l) => ({ id: l.id, rotulo: l.rotulo, toques: toquesPorBotao.get(l.id)?.toques ?? 0, ativo: true })),
  ]
  for (const [id, t] of toquesPorBotao) if (!botoes.some((b) => b.id === id)) botoes.push({ id, rotulo: t.rotulo ?? 'Botão removido', toques: t.toques, ativo: false })
  return {
    cliques: [...origens.values()].reduce((s, x) => s + x.cliques, 0),
    visualizacoes: [...origens.values()].reduce((s, x) => s + x.visualizacoes, 0),
    pessoas,
    toques: [...toquesPorBotao.values()].reduce((s, x) => s + x.toques, 0),
    leadsOrganicos: toquesPorBotao.get('whatsapp')?.toques ?? 0,
    porOrigem: [...origens].map(([o, v]) => ({ origem: o, ...v })).sort((x, y) => y.cliques - x.cliques),
    porDia: [...dias].map(([d, v]) => ({ dia: d, ...v })).sort((x, y) => x.dia.localeCompare(y.dia)),
    botoes: botoes.sort((x, y) => y.toques - x.toques),
  }
}

export const ROTULO_ORIGEM: Record<string, string> = { bio: 'Link da bio', story: 'Stories', anuncio: 'Anúncios' }

const p1 = (v: number) => v.toLocaleString('pt-BR', { maximumFractionDigits: 1 })

/** Insights e recomendações do link da bio: quem desiste antes de abrir, qual botão domina, leads orgânicos e o que não funciona. */
export function analisarBio(r: ResumoBio): Analise {
  const destaques: Item[] = []
  const recomendacoes: Item[] = []
  if (!r.cliques && !r.visualizacoes) {
    destaques.push({ tom: 'atencao', texto: 'Ninguém clicou no link da bio neste período.' })
    recomendacoes.push({ tom: 'atencao', texto: 'Confira se o endereço da página está na bio do Instagram e divulgue o link (stories e posts fixados).' })
    return { destaques, recomendacoes }
  }
  destaques.push({ tom: 'neutro', texto: `${p1(r.cliques)} cliques no link da bio, ${p1(r.visualizacoes)} visualizações da página${r.pessoas ? ` (${p1(r.pessoas)} pessoas distintas por dia)` : ''} e ${p1(r.toques)} toques nos botões.` })
  if (r.cliques >= 20) {
    const abriu = r.visualizacoes / r.cliques
    if (abriu < 0.6) recomendacoes.push({ tom: 'ruim', texto: `Só ${p1(abriu * 100)}% dos cliques chegaram a abrir a página: muita gente clica e desiste antes. Veja se o link abre rápido no celular e se o endereço está certo na bio.` })
    else if (abriu < 0.85) recomendacoes.push({ tom: 'atencao', texto: `${p1(abriu * 100)}% dos cliques abriram a página. Quem sai antes pode estar com internet lenta ou com o navegador do Instagram bloqueando.` })
    else destaques.push({ tom: 'bom', texto: `${p1(abriu * 100)}% dos cliques abriram a página.` })
  }
  if (r.leadsOrganicos) destaques.push({ tom: 'bom', texto: `${p1(r.leadsOrganicos)} leads orgânicos: pessoas que tocaram no botão do WhatsApp.` })
  const base = r.visualizacoes || r.cliques
  if (!r.toques) {
    destaques.push({ tom: 'ruim', texto: 'As pessoas abrem a página, mas ninguém toca em nenhum botão.' })
    recomendacoes.push({ tom: 'ruim', texto: 'Revise o nome dos botões (diga o que a pessoa ganha ao tocar), a ordem e se o WhatsApp de atendimento está cadastrado.' })
  } else {
    const lider = r.botoes[0]
    destaques.push({ tom: 'bom', texto: `O botão ${lider.rotulo} concentra ${p1((lider.toques / r.toques) * 100)}% dos toques (${p1(lider.toques)} de ${p1(r.toques)}).` })
    const taxa = r.toques / base
    if (taxa < 0.3) recomendacoes.push({ tom: 'ruim', texto: 'Poucas visualizações viram toque: deixe o botão principal no topo, com um nome claro, e confira a mensagem pronta do WhatsApp.' })
    else if (taxa < 0.6) recomendacoes.push({ tom: 'atencao', texto: 'Cerca de metade de quem vê a página toca em algum botão. Teste um nome mais direto no botão principal.' })
    else destaques.push({ tom: 'bom', texto: 'A página converte bem: a maioria de quem vê toca em um botão.' })
  }
  const parados = r.botoes.filter((b) => b.ativo && !b.toques)
  if (parados.length && base >= 20) recomendacoes.push({ tom: 'atencao', texto: `Sem nenhum toque no período: ${parados.map((b) => b.rotulo).join(', ')}. Mude o nome, suba na lista ou remova.` })
  if (r.porOrigem.length > 1 && r.cliques) destaques.push({ tom: 'neutro', texto: `${p1((r.porOrigem[0].cliques / r.cliques) * 100)}% dos cliques vêm de ${(ROTULO_ORIGEM[r.porOrigem[0].origem] ?? r.porOrigem[0].origem).toLowerCase()}.` })
  const pico = [...r.porDia].sort((x, y) => y.cliques - x.cliques)[0]
  if (pico && r.cliques >= 10) destaques.push({ tom: 'neutro', texto: `Maior movimento em ${pico.dia.slice(8, 10)}/${pico.dia.slice(5, 7)}, com ${p1(pico.cliques)} cliques.` })
  return { destaques, recomendacoes }
}
