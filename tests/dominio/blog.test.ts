import { describe, expect, it } from 'vitest'
import { checklistSeo, dividirParaChamada, renderizar, resumir, slugify, sumario, tempoLeitura } from '@/dominio/blog'

describe('blog', () => {
  it('slug e resumo', () => {
    expect(slugify('Como anunciar no Instagram em 2026: o guia!')).toBe('como-anunciar-no-instagram-em-2026-o-guia')
    expect(resumir('# Título\n\nUm texto **curto**.')).toBe('Título Um texto curto.')
    expect(resumir('palavra '.repeat(40), 50).endsWith('…')).toBe(true)
    expect(tempoLeitura('a '.repeat(1000))).toBe(5)
  })
  it('HTML seguro, ids nos títulos e links externos', () => {
    const html = renderizar('## Primeiro passo\n\nTexto <script>alert(1)</script> [site](https://exemplo.com) e [interno](/blog/x) [mal](javascript:alert(1))\n\n## Primeiro passo\n\n![capa](/img.png)')
    expect(html).toContain('<h2 id="primeiro-passo">')
    expect(html).toContain('<h2 id="primeiro-passo-2">')
    expect(html).not.toContain('<script>')
    expect(html).toContain('target="_blank" rel="noopener"')
    expect(html).toContain('<a href="/blog/x">interno</a>')
    expect(html).toContain('href="#"')
    expect(html).toContain('loading="lazy"')
    expect(sumario('## A\n### B\n## A')).toEqual([{ nivel: 2, texto: 'A', id: 'a' }, { nivel: 3, texto: 'B', id: 'b' }, { nivel: 2, texto: 'A', id: 'a-2' }])
  })
  it('chamada no meio: depois do 2º H2', () => {
    expect(dividirParaChamada('<p>a</p><h2>1</h2><p>b</p><h2>2</h2><p>c</p>')).toEqual(['<p>a</p><h2>1</h2><p>b</p>', '<h2>2</h2><p>c</p>'])
    expect(dividirParaChamada('<p>sem</p>')).toEqual(['<p>sem</p>', ''])
  })
  it('checklist de SEO', () => {
    const vazio = checklistSeo({ titulo: 'x', seoTitulo: '', resumo: '', palavraChave: '', conteudo: '', capa: false, capaAlt: '', slug: 'x' })
    expect(vazio.nota).toBeLessThan(30)
    const kw = 'tráfego pago'
    const abertura = `Tráfego pago é o anúncio que coloca a sua empresa na frente de quem já procura o que você vende. ${'Ele funciona com verba controlada e resultado medido em cada etapa do funil. '.repeat(3)}`
    const conteudo = `${abertura}\n\n## O que é tráfego pago\n\n${'texto '.repeat(900)} tráfego pago guia funil\n\n## Dois\n\n[veja](/blog/outro) e [landing](/maquinadevendas)\n\n## Perguntas frequentes\n\n### Quanto custa?\n\nDepende da verba.\n\n### Demora?\n\nAlgumas semanas.`
    const bom = checklistSeo({ titulo: 'Tráfego pago: o guia completo para pequenas empresas', seoTitulo: '', resumo: 'Entenda o que é tráfego pago, quanto investir e como medir o retorno das campanhas no Meta e no Google, com exemplos práticos.', palavraChave: kw, palavrasSecundarias: ['guia', 'texto', 'funil'], publico: 'donos de pequenas empresas', conteudo, capa: true, capaAlt: 'Painel de campanhas', slug: 'trafego-pago-guia', tags: ['anúncios', 'meta ads', 'google ads'], ctaLabel: 'Faça o pré-diagnóstico', revisado: true, outrasPalavrasChave: ['instagram'] })
    expect(bom.itens.filter((i) => !i.ok)).toEqual([])
    expect(bom.nota).toBe(100)
  })
})

describe('metadados colados de outra IA', () => {
  it('linhas "Rótulo: valor" em português e inglês', async () => {
    const { lerMetadados } = await import('@/dominio/blog')
    const r = lerMetadados(`**Título SEO:** Tráfego pago: guia para pequenas empresas
- **Meta description:** "Entenda quanto investir em tráfego pago e como medir o retorno." (62 caracteres)
Slug: /blog/trafego-pago-guia/
Palavra-chave foco: tráfego pago
Palavras-chave secundárias: anúncios, meta ads
Tema: quanto investir
Hashtags: #x
Alt da imagem: gestor olhando campanhas
Público-alvo: donos de clínicas
Categoria: Tráfego pago
Título: Tráfego pago: o guia completo`)
    expect(r.dados).toEqual({ seoTitulo: 'Tráfego pago: guia para pequenas empresas', resumo: 'Entenda quanto investir em tráfego pago e como medir o retorno.', slug: 'trafego-pago-guia', palavraChave: 'tráfego pago', palavrasSecundarias: 'anúncios, meta ads', tema: 'quanto investir', publico: 'donos de clínicas', capaAlt: 'gestor olhando campanhas', categoria: 'Tráfego pago', titulo: 'Tráfego pago: o guia completo' })
    expect(r.ignorados).toEqual(['Hashtags'])
  })
  it('JSON (inclusive aninhado e em camelCase)', async () => {
    const { lerMetadados } = await import('@/dominio/blog')
    const r = lerMetadados('{"seo": {"metaTitle": "Reels que vendem", "metaDescription": "7 formatos."}, "focusKeyword": "reels", "slug": "reels-que-vendem", "tags": ["a"]}')
    expect(r.dados).toEqual({ seoTitulo: 'Reels que vendem', resumo: '7 formatos.', palavraChave: 'reels', slug: 'reels-que-vendem', tags: 'a' })
    expect(r.ignorados).toEqual([])
  })
})

describe('modelo mestre (YAML com seções e listas)', () => {
  it('lê seções, listas e chaves do modelo', async () => {
    const { lerMetadados } = await import('@/dominio/blog')
    const r = lerMetadados(`project:
  brand_name: "Grupo SRV"
briefing:
  target_audience: "Donos de empresas de serviço"
  main_problem: "Leads chegam e somem"
  related_gear: "Previsível"
  original_examples:
    - "Clínica que dobrou a agenda"
    - "Loja de móveis"
search_strategy:
  primary_keyword: "máquina de vendas"
  secondary_keywords: ["funil de vendas", "previsibilidade de vendas"]
  direct_answer: "Uma máquina de vendas é..."
editorial:
  title: "Máquina de vendas: o que é"
  subtitle: "Como vender todo mês"
  thesis: "Venda é engenharia"
  primary_cta:
    label: "Faça o pré-diagnóstico"
    url: "/maquinadevendas"
cms:
  slug: "maquina-de-vendas"
  excerpt: "Entenda o que é."
  tags: ["vendas", "funil", "receita"]
  category: "Vendas e marketing"
seo:
  seo_title: "Máquina de vendas: guia"
  meta_description: "Guia completo."
  canonical_url: "https://www.gruposrv.com.br/blog/maquina-de-vendas"
cover:
  alt_text: "Diagrama da máquina"
  caption: "A engrenagem"
social:
  og_title: "Máquina de vendas"`)
    expect(r.dados).toMatchObject({
      publico: 'Donos de empresas de serviço', palavraChave: 'máquina de vendas', palavrasSecundarias: 'funil de vendas, previsibilidade de vendas',
      titulo: 'Máquina de vendas: o que é', subtitulo: 'Como vender todo mês', ctaLabel: 'Faça o pré-diagnóstico', ctaUrl: '/maquinadevendas',
      slug: 'maquina-de-vendas', resumo: 'Entenda o que é.', tags: 'vendas, funil, receita', categoria: 'Vendas e marketing', seoTitulo: 'Máquina de vendas: guia',
      canonical: 'https://www.gruposrv.com.br/blog/maquina-de-vendas', capaAlt: 'Diagrama da máquina', capaLegenda: 'A engrenagem', ogTitulo: 'Máquina de vendas',
    })
    expect(r.briefing).toMatchObject({ main_problem: 'Leads chegam e somem', related_gear: 'Previsível', original_examples: ['Clínica que dobrou a agenda', 'Loja de móveis'], direct_answer: 'Uma máquina de vendas é...', unique_point_of_view: 'Venda é engenharia' })
    expect(r.ignorados).toContain('project.brand name')
  })
  it('FAQ e bloqueios de publicação', async () => {
    const { extrairFaq, checklistSeo, bloqueiosDePublicacao } = await import('@/dominio/blog')
    expect(extrairFaq('## Algo\n\ntexto\n\n## Perguntas frequentes\n\n### O que é?\n\nÉ isso.\n\n### Quanto custa?\n\nDepende.\n\n## Conclusão\n\nfim')).toEqual([{ pergunta: 'O que é?', resposta: 'É isso.' }, { pergunta: 'Quanto custa?', resposta: 'Depende.' }])
    const c = checklistSeo({ titulo: 'x', seoTitulo: '', resumo: '', palavraChave: '', conteudo: '# Título\n\nVeja [inserir link] aqui. Resultado garantido.', capa: false, capaAlt: '', slug: 'x', revisado: false })
    expect(bloqueiosDePublicacao(c)).toHaveLength(3)
    expect(c.itens.find((i) => i.texto.startsWith('Sem garantias'))?.ok).toBe(false)
  })
})
