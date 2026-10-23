import { Marked, type Tokens } from 'marked'

/**
 * Blog da Grupo SRV: artigos em Markdown (escritos na plataforma, com ajuda da IA), publicados em
 * www.gruposrv.com.br/blog. Aqui ficam as regras puras: endereço, leitura, sumário, HTML seguro e o checklist de SEO.
 */

export const SITE = 'https://www.gruposrv.com.br'
export const LANDING_PADRAO = '/maquinadevendas'

export function slugify(texto: string, max = 90): string {
  return texto
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, max)
    .replace(/-+$/, '')
}

const palavras = (md: string) => md.replace(/[#*_>`[\]()!-]/g, ' ').split(/\s+/).filter(Boolean).length
export const contarPalavras = palavras
/** Minutos de leitura (200 palavras por minuto, mínimo 1). */
export const tempoLeitura = (md: string) => Math.max(1, Math.round(palavras(md) / 200))

/** Texto puro (sem Markdown) para resumos e meta description. */
export function textoPuro(md: string): string {
  return md
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/!\[[^\]]*]\([^)]*\)/g, ' ')
    .replace(/\[([^\]]*)]\([^)]*\)/g, '$1')
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/[*_>`]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

/** Resumo automático: o começo do texto, cortado na última palavra inteira antes de `max`. */
export function resumir(md: string, max = 155): string {
  const t = textoPuro(md)
  if (t.length <= max) return t
  const corte = t.slice(0, max - 1)
  return `${corte.slice(0, corte.lastIndexOf(' ') > 60 ? corte.lastIndexOf(' ') : corte.length)}…`
}

export type Titulo = { nivel: 2 | 3; texto: string; id: string }

/** Títulos H2 e H3 do artigo (para o sumário), com o mesmo id que entra no HTML. */
export function sumario(md: string): Titulo[] {
  const usados = new Map<string, number>()
  const r: Titulo[] = []
  for (const linha of md.replace(/```[\s\S]*?```/g, '').split('\n')) {
    const m = linha.match(/^(#{2,3})\s+(.+?)\s*#*\s*$/)
    if (!m) continue
    const texto = textoPuro(m[2])
    r.push({ nivel: m[1].length as 2 | 3, texto, id: idUnico(slugify(texto, 60) || 'secao', usados) })
  }
  return r
}

function idUnico(base: string, usados: Map<string, number>): string {
  const n = usados.get(base) ?? 0
  usados.set(base, n + 1)
  return n ? `${base}-${n + 1}` : base
}

const escapar = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
const linkSeguro = (href: string) => (/^(https?:|mailto:|tel:|\/|#)/i.test(href.trim()) ? href.trim() : '#')

/**
 * Markdown → HTML do artigo. HTML escrito à mão vira texto (nada de script), links externos abrem em outra aba,
 * imagens carregam sob demanda e os títulos ganham id (para o sumário e links diretos).
 */
export function renderizar(md: string): string {
  const usados = new Map<string, number>()
  const marked = new Marked({ gfm: true, breaks: false })
  marked.use({
    renderer: {
      html: ({ text }: Tokens.HTML | Tokens.Tag) => escapar(text),
      heading({ tokens, depth }: Tokens.Heading) {
        const texto = this.parser.parseInline(tokens)
        if (depth < 2 || depth > 3) return `<h${Math.max(2, Math.min(depth, 4))}>${texto}</h${Math.max(2, Math.min(depth, 4))}>\n`
        const id = idUnico(slugify(textoPuro(texto.replace(/<[^>]+>/g, '')), 60) || 'secao', usados)
        return `<h${depth} id="${id}">${texto}</h${depth}>\n`
      },
      link({ href, title, tokens }: Tokens.Link) {
        const url = linkSeguro(href)
        const externo = /^https?:/i.test(url) && !url.startsWith(SITE)
        return `<a href="${escapar(url)}"${title ? ` title="${escapar(title)}"` : ''}${externo ? ' target="_blank" rel="noopener"' : ''}>${this.parser.parseInline(tokens)}</a>`
      },
      image({ href, title, text }: Tokens.Image) {
        return `<img src="${escapar(linkSeguro(href))}" alt="${escapar(text)}"${title ? ` title="${escapar(title)}"` : ''} loading="lazy" decoding="async" />`
      },
    },
  })
  return marked.parse(md, { async: false }) as string
}

/** Divide o HTML depois do 2º H2, para encaixar a chamada para ação no meio do artigo. */
export function dividirParaChamada(html: string): [string, string] {
  let pos = -1
  for (let i = 0; i < 2; i++) {
    pos = html.indexOf('<h2', pos + 1)
    if (pos < 0) return [html, '']
  }
  return [html.slice(0, pos), html.slice(pos)]
}

export type ItemChecklist = { ok: boolean; texto: string }
export type DadosSeo = { titulo: string; seoTitulo: string; resumo: string; palavraChave: string; conteudo: string; capa: boolean; capaAlt: string; slug: string }

/** Checklist de SEO do editor: o que falta para o artigo ter boas chances no Google. */
export function checklistSeo(p: DadosSeo): { itens: ItemChecklist[]; nota: number } {
  const kw = p.palavraChave.trim().toLowerCase()
  const titulo = (p.seoTitulo || p.titulo).trim()
  const corpo = p.conteudo.toLowerCase()
  const primeiroParagrafo = textoPuro(p.conteudo.split(/\n\s*\n/).find((b) => b.trim() && !b.trim().startsWith('#')) ?? '').toLowerCase()
  const h2 = sumario(p.conteudo).filter((t) => t.nivel === 2)
  const total = palavras(p.conteudo)
  const linksInternos = (p.conteudo.match(/\]\((\/blog\/|https:\/\/www\.gruposrv\.com\.br\/blog\/)/g) ?? []).length
  const linkLanding = /\]\((\/maquinadevendas|\/calculadora|https:\/\/www\.gruposrv\.com\.br\/(maquinadevendas|calculadora))/.test(p.conteudo)
  const itens: ItemChecklist[] = [
    { ok: !!kw, texto: 'Defina a palavra-chave foco (o que a pessoa digita no Google)' },
    { ok: !!kw && titulo.toLowerCase().includes(kw), texto: 'A palavra-chave aparece no título' },
    { ok: titulo.length >= 30 && titulo.length <= 60, texto: `Título para o Google entre 30 e 60 caracteres (tem ${titulo.length})` },
    { ok: p.resumo.length >= 120 && p.resumo.length <= 160, texto: `Descrição (meta description) entre 120 e 160 caracteres (tem ${p.resumo.length})` },
    { ok: !!kw && p.resumo.toLowerCase().includes(kw), texto: 'A palavra-chave aparece na descrição' },
    { ok: !!kw && primeiroParagrafo.includes(kw), texto: 'A palavra-chave aparece no primeiro parágrafo' },
    { ok: !!kw && h2.some((t) => t.texto.toLowerCase().includes(kw)), texto: 'A palavra-chave aparece em pelo menos um subtítulo (H2)' },
    { ok: !!kw && p.slug.includes(slugify(kw)), texto: 'O endereço (slug) contém a palavra-chave' },
    { ok: h2.length >= 3, texto: `Pelo menos 3 subtítulos H2 para organizar o texto (tem ${h2.length})` },
    { ok: total >= 900, texto: `Pelo menos 900 palavras (tem ${total})` },
    { ok: linksInternos >= 1, texto: 'Pelo menos 1 link para outro artigo do blog' },
    { ok: linkLanding, texto: 'Pelo menos 1 link para a landing page (Máquina de Vendas ou Calculadora)' },
    { ok: p.capa, texto: 'Imagem de capa' },
    { ok: !p.capa || p.capaAlt.trim().length >= 10, texto: 'Texto alternativo da capa (descreva a imagem)' },
    { ok: !!kw && corpo.split(kw).length - 1 >= 2 && (corpo.split(kw).length - 1) / Math.max(1, total) <= 0.03, texto: 'Palavra-chave usada no texto com naturalidade (2+ vezes, sem exagero)' },
  ]
  return { itens, nota: Math.round((itens.filter((i) => i.ok).length / itens.length) * 100) }
}

/** Link da landing com a origem marcada (para saber qual artigo trouxe o lead). */
export const linkLanding = (slugArtigo: string, landing = LANDING_PADRAO) => `${landing}?utm_source=blog&utm_medium=artigo&utm_campaign=${encodeURIComponent(slugArtigo)}`

export type Metadados = { titulo?: string; seoTitulo?: string; resumo?: string; slug?: string; palavraChave?: string; capaAlt?: string; categoria?: string }

const normalizar = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim()

// Rótulos que as IAs costumam usar (português e inglês), já normalizados. A ordem importa: "titulo seo" antes de "titulo".
const ROTULOS: [keyof Metadados, string[]][] = [
  ['seoTitulo', ['titulo seo', 'seo title', 'meta title', 'metatitle', 'title tag', 'titulo para o google', 'meta titulo', 'titulo meta', 'titulo da pagina', 'seo titulo', 'titulo otimizado']],
  ['resumo', ['meta description', 'metadescription', 'meta descricao', 'descricao meta', 'descricao seo', 'seo description', 'descricao', 'description', 'resumo', 'excerpt', 'meta desc']],
  ['palavraChave', ['palavra chave foco', 'palavra chave principal', 'palavra chave', 'palavrachave', 'focus keyword', 'focus keyphrase', 'keyword principal', 'main keyword', 'keyword', 'keyphrase', 'frase chave', 'termo principal']],
  ['slug', ['slug', 'url amigavel', 'url', 'permalink', 'endereco']],
  ['capaAlt', ['texto alternativo', 'alt text', 'alt da imagem', 'alt da capa', 'alt', 'image alt']],
  ['categoria', ['categoria', 'category']],
  ['titulo', ['titulo do artigo', 'titulo h1', 'h1', 'headline', 'titulo', 'title']],
]

function campoDoRotulo(rotulo: string): keyof Metadados | null {
  const r = normalizar(rotulo)
  for (const [campo, nomes] of ROTULOS) if (nomes.includes(r)) return campo
  for (const [campo, nomes] of ROTULOS) if (nomes.some((n) => n.length > 4 && r.startsWith(n))) return campo
  return null
}

/** Tira aspas, negrito e notas como "(155 caracteres)" do valor. */
const limparValor = (v: string) => v.replace(/\s*\((\d+|aprox\.?\s*\d+)\s*(caracteres|chars?|characters)\)\s*$/i, '').replace(/^[\s"'“”*`]+|[\s"'“”*`]+$/g, '').trim()

/**
 * Lê os metadados que uma IA entregou junto com o artigo: JSON ({"metaTitle": …}) ou linhas "Rótulo: valor"
 * (com ou sem negrito, marcador, aspas). Devolve o que reconheceu e os rótulos que não usa (ex.: tags).
 */
export function lerMetadados(texto: string): { dados: Metadados; ignorados: string[] } {
  const dados: Metadados = {}
  const ignorados: string[] = []
  const guardar = (rotulo: string, valor: unknown) => {
    const v = typeof valor === 'string' ? limparValor(valor) : Array.isArray(valor) ? valor.map(String).join(', ') : ''
    if (!v) return
    const campo = campoDoRotulo(rotulo)
    if (!campo) return void ignorados.push(rotulo.trim())
    if (dados[campo]) return
    dados[campo] = campo === 'slug' ? slugify(v.replace(/\/+$/, '').split('/').pop() ?? v) : v
  }
  const bruto = texto.trim()
  if (bruto.startsWith('{')) {
    try {
      const json = JSON.parse(bruto.replace(/^```(?:json)?|```$/g, '')) as Record<string, unknown>
      const plano = Object.entries(json).flatMap(([k, v]) => (v && typeof v === 'object' && !Array.isArray(v) ? Object.entries(v as Record<string, unknown>) : [[k, v] as [string, unknown]]))
      for (const [k, v] of plano) guardar(k.replace(/([a-z])([A-Z])/g, '$1 $2').replace(/_/g, ' '), v)
      return { dados, ignorados }
    } catch {
      // não era JSON válido: segue lendo linha a linha
    }
  }
  for (const linha of bruto.split('\n')) {
    const m = linha.match(/^\s*(?:[-*•>]\s*|\d+[.)]\s*)?(?:\*\*|__)?([^:：\n]{2,45}?)(?:\*\*|__)?\s*[:：]\s*(.+)$/)
    if (m && !/^https?$/i.test(m[1].trim())) guardar(m[1].replace(/[*_#`]/g, ''), m[2])
  }
  return { dados, ignorados }
}
