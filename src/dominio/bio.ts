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
  const m = caminho.match(/^\/([a-z0-9]+(?:-[a-z0-9]+)*)(?:\/ir\/([a-z0-9-]{1,40}))?\/?$/)
  if (!m) return null
  return m[2] ? `/l/${m[1]}/ir/${m[2]}` : `/l/${m[1]}`
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
  /** Pessoas que abriram a página da bio (cada abertura conta uma visita). */
  visitas: number
  /** Toques somados em todos os botões. */
  toques: number
  porOrigem: { origem: string; visitas: number }[]
  porDia: { dia: string; visitas: number; toques: number }[]
  /** Todos os botões da página (inclusive sem toque) e os já removidos que tiveram toque no período. */
  botoes: { id: string; rotulo: string; toques: number; ativo: boolean }[]
}

type LinhaVisita = { day: string; origem: string; clicks: number }
type LinhaBotao = { botao: string; rotulo: string | null; day: string; clicks: number }

/** Junta as linhas do banco no resumo. `links`: botões extras de hoje; `temWhatsapp`: se há o botão do WhatsApp. */
export function montarResumoBio(a: { visitas: LinhaVisita[]; botoes: LinhaBotao[]; links: { id: string; rotulo: string }[]; temWhatsapp: boolean }): ResumoBio {
  const dias = new Map<string, { visitas: number; toques: number }>()
  const dia = (d: string) => dias.get(d) ?? dias.set(d, { visitas: 0, toques: 0 }).get(d)!
  const origens = new Map<string, number>()
  for (const v of a.visitas) {
    dia(v.day).visitas += v.clicks
    origens.set(v.origem, (origens.get(v.origem) ?? 0) + v.clicks)
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
    visitas: [...origens.values()].reduce((s, x) => s + x, 0),
    toques: [...toquesPorBotao.values()].reduce((s, x) => s + x.toques, 0),
    porOrigem: [...origens].map(([origem, visitas]) => ({ origem, visitas })).sort((x, y) => y.visitas - x.visitas),
    porDia: [...dias].map(([d, v]) => ({ dia: d, ...v })).sort((x, y) => x.dia.localeCompare(y.dia)),
    botoes: botoes.sort((x, y) => y.toques - x.toques),
  }
}

export const ROTULO_ORIGEM: Record<string, string> = { bio: 'Link da bio', story: 'Stories', anuncio: 'Anúncios' }

const p1 = (v: number) => v.toLocaleString('pt-BR', { maximumFractionDigits: 1 })

/** Insights e recomendações do link da bio: qual botão domina, quantas visitas viram toque, de onde vêm e o que não funciona. */
export function analisarBio(r: ResumoBio): Analise {
  const destaques: Item[] = []
  const recomendacoes: Item[] = []
  if (!r.visitas) {
    destaques.push({ tom: 'atencao', texto: 'Ninguém abriu a página da bio neste período.' })
    recomendacoes.push({ tom: 'atencao', texto: 'Confira se o endereço da página está na bio do Instagram e divulgue o link (stories e posts fixados).' })
    return { destaques, recomendacoes }
  }
  const taxa = r.toques / r.visitas
  destaques.push({ tom: 'neutro', texto: `${p1(r.visitas)} visitas à página da bio e ${p1(r.toques)} toques nos botões (${p1(taxa)} toque por visita).` })
  if (!r.toques) {
    destaques.push({ tom: 'ruim', texto: 'As pessoas abrem a página, mas ninguém toca em nenhum botão.' })
    recomendacoes.push({ tom: 'ruim', texto: 'Revise o nome dos botões (diga o que a pessoa ganha ao tocar), a ordem e se o WhatsApp está cadastrado como atendimento.' })
  } else {
    const lider = r.botoes[0]
    destaques.push({ tom: 'bom', texto: `O botão ${lider.rotulo} concentra ${p1((lider.toques / r.toques) * 100)}% dos toques (${p1(lider.toques)} de ${p1(r.toques)}).` })
    if (taxa < 0.3) recomendacoes.push({ tom: 'ruim', texto: 'Poucas visitas viram toque: deixe o botão principal no topo, com um nome claro, e confira a mensagem pronta do WhatsApp.' })
    else if (taxa < 0.6) recomendacoes.push({ tom: 'atencao', texto: 'Cerca de metade das visitas toca em algum botão. Teste um nome mais direto no botão principal.' })
    else destaques.push({ tom: 'bom', texto: 'A página converte bem: a maioria das visitas toca em um botão.' })
  }
  const parados = r.botoes.filter((b) => b.ativo && !b.toques)
  if (parados.length && r.visitas >= 20) recomendacoes.push({ tom: 'atencao', texto: `Sem nenhum toque no período: ${parados.map((b) => b.rotulo).join(', ')}. Mude o nome, suba na lista ou remova.` })
  if (r.porOrigem.length > 1) destaques.push({ tom: 'neutro', texto: `${p1((r.porOrigem[0].visitas / r.visitas) * 100)}% das visitas vêm de ${(ROTULO_ORIGEM[r.porOrigem[0].origem] ?? r.porOrigem[0].origem).toLowerCase()}.` })
  const pico = [...r.porDia].sort((x, y) => y.visitas - x.visitas)[0]
  if (pico && r.visitas >= 10) destaques.push({ tom: 'neutro', texto: `Maior movimento em ${pico.dia.slice(8, 10)}/${pico.dia.slice(5, 7)}, com ${p1(pico.visitas)} visitas.` })
  return { destaques, recomendacoes }
}
