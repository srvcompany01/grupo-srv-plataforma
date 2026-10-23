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

/** Link da landing com a origem marcada (para saber qual artigo trouxe o lead). */
export const linkLanding = (slugArtigo: string, landing = LANDING_PADRAO) => `${landing}${landing.includes('?') ? '&' : '?'}utm_source=blog&utm_medium=artigo&utm_campaign=${encodeURIComponent(slugArtigo)}`

// ---------- Briefing (estratégia editorial do "modelo mestre de artigos") ----------

export type CampoBriefing = { chave: string; rotulo: string; grupo: 'Briefing' | 'Busca' | 'Capa' | 'Distribuição'; tipo: 'texto' | 'longo' | 'lista' | 'opcao'; opcoes?: string[]; ajuda?: string }

/** Campos guardados no briefing do artigo (JSON). Orientam a IA e a revisão; não aparecem no site. */
export const CAMPOS_BRIEFING: CampoBriefing[] = [
  { chave: 'content_idea', rotulo: 'Ideia central (uma frase)', grupo: 'Briefing', tipo: 'texto' },
  { chave: 'decision_maker', rotulo: 'Decisor (quem decide a compra)', grupo: 'Briefing', tipo: 'texto' },
  { chave: 'business_context', rotulo: 'Contexto empresarial', grupo: 'Briefing', tipo: 'longo' },
  { chave: 'main_problem', rotulo: 'Problema principal', grupo: 'Briefing', tipo: 'longo' },
  { chave: 'visible_symptom', rotulo: 'Sintoma visível', grupo: 'Briefing', tipo: 'texto' },
  { chave: 'hidden_cause', rotulo: 'Causa estrutural (escondida)', grupo: 'Briefing', tipo: 'texto' },
  { chave: 'financial_consequence', rotulo: 'Impacto em vendas e receita', grupo: 'Briefing', tipo: 'texto' },
  { chave: 'desired_transformation', rotulo: 'Transformação desejada', grupo: 'Briefing', tipo: 'texto' },
  { chave: 'unique_point_of_view', rotulo: 'Tese própria do Grupo SRV', grupo: 'Briefing', tipo: 'longo' },
  { chave: 'offer_connection', rotulo: 'Conexão com a Máquina de Vendas', grupo: 'Briefing', tipo: 'longo' },
  { chave: 'related_gear', rotulo: 'Engrenagem', grupo: 'Briefing', tipo: 'opcao', opcoes: ['Contínuo', 'Previsível', 'Controlável', 'Escalável'] },
  { chave: 'related_leak', rotulo: 'Vazamento da jornada', grupo: 'Briefing', tipo: 'texto' },
  { chave: 'related_module', rotulo: 'Módulo da Máquina de Vendas', grupo: 'Briefing', tipo: 'texto' },
  { chave: 'funnel_stage', rotulo: 'Etapa do funil', grupo: 'Briefing', tipo: 'opcao', opcoes: ['Descoberta', 'Consideração', 'Decisão', 'Conversão'] },
  { chave: 'awareness_level', rotulo: 'Nível de consciência', grupo: 'Briefing', tipo: 'opcao', opcoes: ['Inconsciente', 'Problema', 'Solução', 'Oferta'] },
  { chave: 'primary_goal', rotulo: 'Objetivo do artigo', grupo: 'Briefing', tipo: 'opcao', opcoes: ['Atrair', 'Educar', 'Diagnosticar', 'Qualificar', 'Converter'] },
  { chave: 'content_format', rotulo: 'Formato', grupo: 'Briefing', tipo: 'opcao', opcoes: ['Guia', 'Diagnóstico', 'Opinião', 'Comparação', 'Checklist', 'Tutorial', 'Lista'] },
  { chave: 'desired_depth', rotulo: 'Profundidade', grupo: 'Briefing', tipo: 'opcao', opcoes: ['Curto', 'Intermediário', 'Aprofundado'] },
  { chave: 'original_examples', rotulo: 'Exemplos reais (do Fabrício)', grupo: 'Briefing', tipo: 'lista' },
  { chave: 'approved_cases', rotulo: 'Cases autorizados e comprovados', grupo: 'Briefing', tipo: 'lista' },
  { chave: 'approved_statistics', rotulo: 'Números aprovados (com fonte e data)', grupo: 'Briefing', tipo: 'lista' },
  { chave: 'prohibited_topics', rotulo: 'Limites deste artigo', grupo: 'Briefing', tipo: 'texto' },
  { chave: 'search_intent', rotulo: 'Intenção de busca', grupo: 'Busca', tipo: 'opcao', opcoes: ['Informacional', 'Diagnóstico', 'Comercial', 'Navegacional'] },
  { chave: 'reader_question', rotulo: 'Pergunta principal do leitor', grupo: 'Busca', tipo: 'texto' },
  { chave: 'direct_answer', rotulo: 'Resposta direta (40 a 80 palavras)', grupo: 'Busca', tipo: 'longo', ajuda: 'Deve abrir o artigo: a resposta autocontida que o Google e as IAs podem citar.' },
  { chave: 'related_questions', rotulo: 'Perguntas relacionadas', grupo: 'Busca', tipo: 'lista' },
  { chave: 'content_gap', rotulo: 'O que o artigo traz de diferente', grupo: 'Busca', tipo: 'texto' },
  { chave: 'sources', rotulo: 'Fontes externas', grupo: 'Busca', tipo: 'lista' },
  { chave: 'geographic_target', rotulo: 'Alvo geográfico', grupo: 'Busca', tipo: 'texto' },
  { chave: 'freshness_requirement', rotulo: 'Precisa de atualização frequente?', grupo: 'Busca', tipo: 'opcao', opcoes: ['Sim', 'Não'] },
  { chave: 'internal_links_in_plan', rotulo: 'Páginas que devem linkar para este artigo', grupo: 'Busca', tipo: 'lista' },
  { chave: 'cover_concept', rotulo: 'Conceito da capa', grupo: 'Capa', tipo: 'texto' },
  { chave: 'cover_headline', rotulo: 'Texto da capa', grupo: 'Capa', tipo: 'texto' },
  { chave: 'cover_description', rotulo: 'Direção de arte', grupo: 'Capa', tipo: 'longo' },
  { chave: 'cover_prompt', rotulo: 'Prompt para gerar a capa', grupo: 'Capa', tipo: 'longo' },
  { chave: 'linkedin_post_copy', rotulo: 'Post para o LinkedIn', grupo: 'Distribuição', tipo: 'longo' },
  { chave: 'instagram_caption', rotulo: 'Legenda para o Instagram', grupo: 'Distribuição', tipo: 'longo' },
  { chave: 'newsletter_subject', rotulo: 'Assunto da newsletter', grupo: 'Distribuição', tipo: 'texto' },
  { chave: 'newsletter_preview', rotulo: 'Pré-texto da newsletter', grupo: 'Distribuição', tipo: 'texto' },
]

export type Briefing = Record<string, string | string[]>

/** Só as chaves conhecidas, com texto limitado (o que vem da tela, do "colar" ou da IA). */
export function limparBriefing(b: unknown): Briefing {
  const r: Briefing = {}
  if (!b || typeof b !== 'object') return r
  for (const c of CAMPOS_BRIEFING) {
    const v = (b as Record<string, unknown>)[c.chave]
    if (c.tipo === 'lista') {
      const lista = (Array.isArray(v) ? v : typeof v === 'string' ? v.split('\n') : []).map((x) => String(x).trim().slice(0, 500)).filter(Boolean).slice(0, 20)
      if (lista.length) r[c.chave] = lista
    } else if (typeof v === 'string' && v.trim()) r[c.chave] = v.trim().slice(0, 2000)
  }
  return r
}

// ---------- FAQ ----------

/** Perguntas da seção "Perguntas frequentes" (### pergunta + resposta). Vira o FAQPage só porque está visível na página. */
export function extrairFaq(md: string): { pergunta: string; resposta: string }[] {
  const linhas = md.split('\n')
  const inicio = linhas.findIndex((l) => /^##\s+(perguntas frequentes|faq|dúvidas frequentes|duvidas frequentes|perguntas e respostas)/i.test(l.trim()))
  if (inicio < 0) return []
  const r: { pergunta: string; resposta: string[] }[] = []
  for (const l of linhas.slice(inicio + 1)) {
    if (/^##\s/.test(l)) break
    const q = l.match(/^###\s+(.+)/)
    if (q) r.push({ pergunta: textoPuro(q[1]), resposta: [] })
    else if (r.length && l.trim()) r[r.length - 1].resposta.push(l)
  }
  return r.map((x) => ({ pergunta: x.pergunta, resposta: textoPuro(x.resposta.join('\n')) })).filter((x) => x.pergunta && x.resposta)
}

// ---------- Checklist de qualidade ----------

export type ItemChecklist = { ok: boolean; texto: string; grupo: 'SEO' | 'Conteúdo' | 'Conversão' | 'Publicação'; /** Impede publicar enquanto não estiver ok. */ bloqueia?: boolean }
export type DadosSeo = {
  titulo: string; seoTitulo: string; resumo: string; palavraChave: string; palavrasSecundarias?: string[]; publico?: string; conteudo: string; capa: boolean; capaAlt: string; slug: string
  tags?: string[]; ctaLabel?: string; ctaUrl?: string; revisado?: boolean; outrasPalavrasChave?: string[]; textosExtras?: string[]
}

/** Texto que não pode ir ao ar: marcadores de modelo esquecidos pela IA. */
export const PLACEHOLDER = /\[(inserir|link|fonte|nome|cliente|empresa|cidade|n[uú]mero|dado|x+)[^\]]*\]|\bTODO\b|\bXXX\b|SEU-DOMINIO|lorem ipsum|\{\{[^}]*\}\}|YYYY-MM-DD|HH:MM/i
/** Promessas que a marca não faz (garantias e certezas). */
const PROMESSA = /\bgarant(ia|imos|ido|ida|e)\b|\b100% (garantid|cert)|resultado (certo|garantido)|sem risco nenhum|fique rico/i

/** Checklist do editor: SEO, conteúdo, conversão e publicação. `bloqueia` = não deixa publicar. */
export function checklistSeo(p: DadosSeo): { itens: ItemChecklist[]; nota: number } {
  const kw = p.palavraChave.trim().toLowerCase()
  const titulo = (p.seoTitulo || p.titulo).trim()
  const corpo = p.conteudo.toLowerCase()
  const blocos = p.conteudo.split(/\n\s*\n/).filter((b) => b.trim() && !b.trim().startsWith('#'))
  const primeiroParagrafo = textoPuro(blocos[0] ?? '')
  const palavrasAbertura = primeiroParagrafo.split(/\s+/).filter(Boolean).length
  const h2 = sumario(p.conteudo).filter((t) => t.nivel === 2)
  const total = palavras(p.conteudo)
  const linksInternos = (p.conteudo.match(/\]\((\/blog\/|https:\/\/www\.gruposrv\.com\.br\/blog\/)/g) ?? []).length
  const linkLanding = /\]\((\/maquinadevendas|\/calculadora|https:\/\/www\.gruposrv\.com\.br\/(maquinadevendas|calculadora))/.test(p.conteudo)
  const secundarias = p.palavrasSecundarias ?? []
  const usadas = secundarias.filter((k) => corpo.includes(k.toLowerCase())).length
  const tags = p.tags ?? []
  const imagensSemAlt = (p.conteudo.match(/!\[\s*\]\(/g) ?? []).length
  const textoTodo = [p.titulo, p.seoTitulo, p.resumo, p.conteudo, p.ctaLabel ?? '', p.ctaUrl ?? '', ...(p.textosExtras ?? [])].join('\n')
  const ocorrencias = kw ? corpo.split(kw).length - 1 : 0
  const itens: ItemChecklist[] = [
    { grupo: 'SEO', ok: !!kw, texto: 'Defina a palavra-chave foco (o que a pessoa digita no Google)' },
    { grupo: 'SEO', ok: !kw || !(p.outrasPalavrasChave ?? []).some((o) => o.trim().toLowerCase() === kw), texto: 'Nenhum outro artigo mira a mesma palavra-chave (evita canibalização)' },
    { grupo: 'SEO', ok: secundarias.length >= 3 && usadas >= Math.ceil(secundarias.length / 2), texto: secundarias.length ? `Palavras-chave secundárias no texto (${usadas} de ${secundarias.length}; use pelo menos metade)` : 'Liste 3 a 5 palavras-chave secundárias' },
    { grupo: 'SEO', ok: !!kw && titulo.toLowerCase().includes(kw), texto: 'A palavra-chave aparece no título' },
    { grupo: 'SEO', ok: titulo.length >= 30 && titulo.length <= 60, texto: `Título para o Google entre 30 e 60 caracteres (tem ${titulo.length})` },
    { grupo: 'SEO', ok: p.resumo.length >= 120 && p.resumo.length <= 160, texto: `Descrição (meta description) entre 120 e 160 caracteres (tem ${p.resumo.length})` },
    { grupo: 'SEO', ok: !!kw && p.resumo.toLowerCase().includes(kw), texto: 'A palavra-chave aparece na descrição' },
    { grupo: 'SEO', ok: !!kw && primeiroParagrafo.toLowerCase().includes(kw), texto: 'A palavra-chave aparece no primeiro parágrafo' },
    { grupo: 'SEO', ok: !!kw && h2.some((t) => t.texto.toLowerCase().includes(kw)), texto: 'A palavra-chave aparece em pelo menos um subtítulo (H2)' },
    { grupo: 'SEO', ok: !!kw && p.slug.includes(slugify(kw)), texto: 'O endereço (slug) contém a palavra-chave' },
    { grupo: 'SEO', ok: !!kw && ocorrencias >= 2 && ocorrencias / Math.max(1, total) <= 0.03, texto: 'Palavra-chave usada no texto com naturalidade (2+ vezes, sem exagero)' },
    { grupo: 'SEO', ok: tags.length >= 3 && tags.length <= 7, texto: `De 3 a 7 tags (tem ${tags.length})` },
    { grupo: 'Conteúdo', ok: !/^#\s/m.test(p.conteudo), texto: 'Um único H1 (o título): o texto não usa "# " — só "## " e "### "', bloqueia: true },
    { grupo: 'Conteúdo', ok: palavrasAbertura >= 35 && palavrasAbertura <= 100, texto: `Começa pela resposta direta: 1º parágrafo com 40 a 80 palavras (tem ${palavrasAbertura})` },
    { grupo: 'Conteúdo', ok: (p.publico ?? '').trim().length >= 5, texto: 'Diga para quem é o artigo (público-alvo)' },
    { grupo: 'Conteúdo', ok: h2.length >= 3, texto: `Pelo menos 3 subtítulos H2 para organizar o texto (tem ${h2.length})` },
    { grupo: 'Conteúdo', ok: total >= 900, texto: `Pelo menos 900 palavras (tem ${total})` },
    { grupo: 'Conteúdo', ok: extrairFaq(p.conteudo).length >= 2, texto: 'Seção "## Perguntas frequentes" com 2+ perguntas em "### " (vira dados para o Google)' },
    { grupo: 'Conteúdo', ok: !PROMESSA.test(textoTodo), texto: 'Sem garantias nem promessas absolutas (regra da marca)' },
    { grupo: 'Conteúdo', ok: !PLACEHOLDER.test(textoTodo), texto: 'Sem marcadores esquecidos ([inserir…], TODO, SEU-DOMINIO, {{…}})', bloqueia: true },
    { grupo: 'Conversão', ok: linksInternos >= 1, texto: 'Pelo menos 1 link para outro artigo do blog' },
    { grupo: 'Conversão', ok: linkLanding || !!p.ctaUrl, texto: 'Link ou CTA para a Máquina de Vendas (ou Calculadora)' },
    { grupo: 'Conversão', ok: !!p.ctaLabel?.trim(), texto: 'CTA principal com texto próprio (ex.: "Faça o pré-diagnóstico")' },
    { grupo: 'Publicação', ok: p.capa, texto: 'Imagem de capa (1200×630, WebP de até 250 KB)' },
    { grupo: 'Publicação', ok: !p.capa || p.capaAlt.trim().length >= 10, texto: 'Texto alternativo da capa (descreva a imagem)' },
    { grupo: 'Publicação', ok: imagensSemAlt === 0, texto: `Toda imagem do texto com texto alternativo${imagensSemAlt ? ` (${imagensSemAlt} sem)` : ''}` },
    { grupo: 'Publicação', ok: !!p.revisado, texto: 'Revisão humana aprovada', bloqueia: true },
  ]
  return { itens, nota: Math.round((itens.filter((i) => i.ok).length / itens.length) * 100) }
}

/** O que impede publicar (vazio = pode). */
export const bloqueiosDePublicacao = (c: ReturnType<typeof checklistSeo>) => c.itens.filter((i) => i.bloqueia && !i.ok).map((i) => i.texto)

// ---------- Colar metadados (texto, YAML do modelo ou JSON) ----------

export type Metadados = {
  titulo?: string; subtitulo?: string; seoTitulo?: string; resumo?: string; slug?: string; palavraChave?: string; palavrasSecundarias?: string; tema?: string; publico?: string
  capaAlt?: string; capaLegenda?: string; capaCredito?: string; categoria?: string; autor?: string; tags?: string; canonical?: string; breadcrumb?: string
  ogTitulo?: string; ogDescricao?: string; ctaLabel?: string; ctaUrl?: string; ctaContexto?: string; cta2Label?: string; cta2Url?: string; entidades?: string; aviso?: string
}

const normalizar = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim()

// Rótulos que as IAs costumam usar (português, inglês e as chaves do modelo YAML), já normalizados.
// A ordem importa: os mais específicos primeiro ("titulo seo" antes de "titulo").
const ROTULOS: [keyof Metadados, string[]][] = [
  ['seoTitulo', ['seo seo title', 'seo title', 'titulo seo', 'meta title', 'metatitle', 'title tag', 'titulo para o google', 'meta titulo', 'titulo meta', 'titulo da pagina', 'seo titulo', 'titulo otimizado']],
  ['ogTitulo', ['social og title', 'og title', 'titulo open graph', 'open graph title', 'social title', 'social twitter title', 'twitter title']],
  ['ogDescricao', ['social og description', 'og description', 'descricao open graph', 'open graph description', 'social description', 'social twitter description', 'twitter description']],
  ['resumo', ['seo meta description', 'meta description', 'metadescription', 'meta descricao', 'descricao meta', 'descricao seo', 'seo description', 'cms excerpt', 'excerpt', 'resumo', 'descricao', 'description', 'meta desc']],
  ['palavrasSecundarias', ['search strategy secondary keywords', 'secondary keywords', 'palavras chave secundarias', 'palavras chave relacionadas', 'palavra chave secundaria', 'keywords secundarias', 'related keywords', 'lsi keywords', 'palavras chave lsi', 'palavras chave', 'keywords']],
  ['tags', ['cms tags', 'article tags', 'tags', 'etiquetas']],
  ['entidades', ['search strategy semantic entities', 'semantic entities', 'entidades semanticas', 'entidades', 'structured data mentions', 'mentions']],
  ['tema', ['tema do artigo', 'tema', 'assunto', 'topico', 'topic', 'pauta']],
  ['palavraChave', ['search strategy primary keyword', 'primary keyword', 'seo focus keyphrase', 'focus keyphrase', 'focus keyword', 'palavra chave foco', 'palavra chave principal', 'palavra chave', 'palavrachave', 'keyword principal', 'main keyword', 'keyword', 'keyphrase', 'frase chave', 'termo principal']],
  ['publico', ['briefing target audience', 'target audience', 'para quem e este conteudo', 'para quem e este artigo', 'para quem e', 'para quem', 'publico alvo', 'publico', 'persona', 'leitor ideal', 'audiencia', 'audience']],
  ['canonical', ['seo canonical url', 'canonical url', 'canonical', 'url canonica']],
  ['breadcrumb', ['seo breadcrumb title', 'breadcrumb title', 'titulo do breadcrumb', 'breadcrumb']],
  ['slug', ['cms slug', 'slug', 'url amigavel', 'permalink']],
  ['capaAlt', ['cover alt text', 'cover alt', 'featured image alt', 'texto alternativo', 'alt text', 'alt da imagem', 'alt da capa', 'og image alt', 'twitter image alt', 'alt', 'image alt']],
  ['capaLegenda', ['cover caption', 'featured image caption', 'legenda da capa', 'legenda', 'caption']],
  ['capaCredito', ['cover credit', 'featured image credit', 'credito da imagem', 'credito', 'credit']],
  ['ctaLabel', ['editorial primary cta label', 'primary cta label', 'texto do cta', 'cta principal', 'cta label', 'cta']],
  ['ctaUrl', ['editorial primary cta url', 'primary cta url', 'link do cta', 'cta url']],
  ['ctaContexto', ['primary cta context', 'contexto do cta']],
  ['cta2Label', ['editorial secondary cta label', 'secondary cta label', 'cta secundario']],
  ['cta2Url', ['editorial secondary cta url', 'secondary cta url', 'link do cta secundario']],
  ['aviso', ['editorial disclosure', 'aviso editorial', 'disclosure']],
  ['categoria', ['cms category', 'categoria', 'category', 'pilar', 'pilar editorial', 'article section']],
  ['autor', ['cms author', 'author name', 'autor', 'author']],
  ['subtitulo', ['editorial subtitle', 'subtitle', 'subtitulo']],
  ['titulo', ['editorial title', 'cms title', 'titulo do artigo', 'titulo h1', 'h1', 'headline', 'titulo', 'title', 'working title']],
]

// Chaves do briefing também aceitas pelo rótulo em português e com o prefixo da seção do YAML.
const APELIDOS_BRIEFING: Record<string, string> = { 'editorial thesis': 'unique_point_of_view', thesis: 'unique_point_of_view', tese: 'unique_point_of_view', 'cover concept': 'cover_concept', 'cover headline': 'cover_headline', 'cover description': 'cover_description', 'cover generation prompt': 'cover_prompt', 'search strategy sources': 'sources', 'seo external sources': 'sources', 'seo internal links in plan': 'internal_links_in_plan' }

function campoDoRotulo(rotulo: string): { campo: keyof Metadados } | { briefing: string } | null {
  const r = normalizar(rotulo)
  if (APELIDOS_BRIEFING[r]) return { briefing: APELIDOS_BRIEFING[r] }
  for (const [campo, nomes] of ROTULOS) if (nomes.includes(r)) return { campo }
  const b = CAMPOS_BRIEFING.find((c) => normalizar(c.chave) === r || normalizar(c.rotulo) === r || r.endsWith(` ${normalizar(c.chave)}`))
  if (b) return { briefing: b.chave }
  for (const [campo, nomes] of ROTULOS) if (nomes.some((n) => n.length > 4 && r.startsWith(n))) return { campo }
  return null
}

/** Tira aspas, negrito e notas como "(155 caracteres)" do valor. */
const limparValor = (v: string) => v.replace(/\s*\((\d+|aprox\.?\s*\d+)\s*(caracteres|chars?|characters)\)\s*$/i, '').replace(/^[\s"'“”*`]+|[\s"'“”*`]+$/g, '').trim()

/** Lista inline ["a", "b"] ou "a, b". */
const listaInline = (v: string) => (v.trim().startsWith('[') ? v.trim().slice(1, -1).split(',').map(limparValor).filter(Boolean) : null)

/**
 * Lê os metadados que uma IA entregou junto com o artigo: JSON, YAML do modelo (com seções e listas "- item") ou
 * linhas "Rótulo: valor" (com ou sem negrito, marcador, aspas). Devolve campos, briefing e os rótulos não usados.
 */
export function lerMetadados(texto: string): { dados: Metadados; briefing: Briefing; ignorados: string[] } {
  const dados: Metadados = {}
  const briefing: Briefing = {}
  const ignorados: string[] = []
  const guardar = (rotulo: string, valor: unknown, secao = '') => {
    const lista = Array.isArray(valor) ? valor.map((x) => (typeof x === 'string' ? limparValor(x) : JSON.stringify(x))).filter(Boolean) : typeof valor === 'string' ? listaInline(valor) : null
    const v = lista ? lista.join(', ') : typeof valor === 'string' ? limparValor(valor) : typeof valor === 'number' ? String(valor) : ''
    if (!v || v === '[]') return
    const destino = (secao ? campoDoRotulo(`${secao} ${rotulo}`) : null) ?? campoDoRotulo(rotulo)
    if (!destino) return void ignorados.push(secao ? `${secao}.${rotulo.trim()}` : rotulo.trim())
    if ('briefing' in destino) {
      const def = CAMPOS_BRIEFING.find((c) => c.chave === destino.briefing)!
      if (!briefing[def.chave]) briefing[def.chave] = def.tipo === 'lista' ? (lista ?? [v]) : v
      return
    }
    if (dados[destino.campo]) return
    dados[destino.campo] = destino.campo === 'slug' ? slugify(v.replace(/\/+$/, '').split('/').pop() ?? v) : v
  }
  const bruto = texto.trim().replace(/^```(?:json|ya?ml)?\s*|```$/g, '').trim()
  if (bruto.startsWith('{')) {
    try {
      const andar = (obj: Record<string, unknown>, secao: string) => {
        for (const [k, v] of Object.entries(obj)) {
          const chave = k.replace(/([a-z])([A-Z])/g, '$1 $2').replace(/_/g, ' ')
          if (k.startsWith('@')) continue
          if (v && typeof v === 'object' && !Array.isArray(v)) andar(v as Record<string, unknown>, chave)
          else guardar(chave, v, secao)
        }
      }
      andar(JSON.parse(bruto) as Record<string, unknown>, '')
      return { dados, briefing, ignorados }
    } catch {
      // não era JSON válido: segue lendo linha a linha
    }
  }
  // Linha a linha: "chave: valor"; "secao:" abre uma seção (YAML); "- item" logo abaixo de "chave:" vira lista.
  const secoes: { recuo: number; nome: string }[] = []
  let listaAberta: { rotulo: string; secao: string; itens: string[]; recuo: number } | null = null
  const fecharLista = () => {
    if (listaAberta?.itens.length) guardar(listaAberta.rotulo, listaAberta.itens, listaAberta.secao)
    listaAberta = null
  }
  for (const linha of bruto.split('\n')) {
    if (!linha.trim() || linha.trim().startsWith('#') && !/^#+\s*\w+\s*:/.test(linha.trim())) continue
    const recuo = linha.length - linha.trimStart().length
    const item = linha.match(/^\s*-\s+(.+)$/)
    if (item && listaAberta && recuo >= listaAberta.recuo) {
      listaAberta.itens.push(limparValor(item[1]))
      continue
    }
    fecharLista()
    while (secoes.length && secoes[secoes.length - 1].recuo >= recuo) secoes.pop()
    const secao = secoes.map((s) => s.nome).join(' ')
    const m = linha.match(/^\s*(?:[-*•>]\s*|\d+[.)]\s*)?(?:\*\*|__)?([^:：\n]{2,60}?)(?:\*\*|__)?\s*[:：]\s*(.*)$/)
    if (!m || /^https?$/i.test(m[1].trim())) continue
    const rotulo = m[1].replace(/[*_#`]/g, ' ').trim()
    const valor = m[2].trim()
    if (!valor) {
      // "chave:" sem valor: abre seção (YAML) e talvez uma lista nas próximas linhas.
      secoes.push({ recuo, nome: normalizar(rotulo) })
      listaAberta = { rotulo, secao, itens: [], recuo }
      continue
    }
    guardar(rotulo, valor, secao)
  }
  fecharLista()
  return { dados, briefing, ignorados }
}
