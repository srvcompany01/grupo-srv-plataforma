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
    expect(vazio.nota).toBeLessThan(20)
    const kw = 'tráfego pago'
    const conteudo = `Tráfego pago é o caminho.\n\n## O que é tráfego pago\n\n${'texto '.repeat(900)} tráfego pago\n\n## Dois\n\n[veja](/blog/outro) e [landing](/maquinadevendas)\n\n## Três`
    const bom = checklistSeo({ titulo: 'Tráfego pago: o guia completo para pequenas empresas', seoTitulo: '', resumo: 'Entenda o que é tráfego pago, quanto investir e como medir o retorno das campanhas no Meta e no Google, com exemplos práticos.', palavraChave: kw, conteudo, capa: true, capaAlt: 'Painel de campanhas', slug: 'trafego-pago-guia' })
    expect(bom.itens.filter((i) => !i.ok)).toEqual([])
    expect(bom.nota).toBe(100)
  })
})
