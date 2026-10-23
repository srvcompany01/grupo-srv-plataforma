import { describe, expect, it } from 'vitest'
import { docxParaTexto, lerArquivoDeArtigo, modeloDocx, modeloMarkdown } from '@/dominio/blog-modelo'

const cats = ['Tráfego pago', 'Vendas e marketing']
const autores = ['Fabrício Saraiva']

/** Preenche o modelo como uma pessoa faria: troca as dicas pelos valores. */
function preencher(modelo: string, valores: Record<string, string>, artigo: string) {
  let t = modelo
  for (const [campo, valor] of Object.entries(valores)) t = t.replace(new RegExp(`^${campo}:.*$`, 'm'), `${campo}: ${valor}`)
  return t.replace(/Resposta direta em 40 a 80 palavras…[\s\S]*$/, artigo)
}

describe('modelo de artigo (arquivo)', () => {
  it('o modelo em branco não preenche nada (dicas são ignoradas)', () => {
    const r = lerArquivoDeArtigo(modeloMarkdown(cats, autores))
    expect(r.dados).toEqual({})
    expect(r.briefing).toEqual({})
  })

  it('lê o modelo preenchido: ficha, briefing, listas e o texto do artigo', () => {
    const md = preencher(modeloMarkdown(cats, autores), {
      'Título': 'Máquina de vendas: o que é',
      'Subtítulo': 'Como vender todo mês',
      'Para quem é': 'Donos de empresas de serviço',
      'Categoria': 'Vendas e marketing',
      'Autor': 'Fabrício Saraiva',
      'Palavra-chave foco': 'máquina de vendas',
      'Tags': 'vendas, funil, receita',
      'Meta description': 'Entenda o que é uma máquina de vendas.',
      'Problema principal': 'Leads chegam e somem',
      'Engrenagem': 'Previsível',
      'CTA principal': 'Faça o pré-diagnóstico',
      'Link do CTA': '/maquinadevendas',
      'Posição do CTA': 'final',
      'Título para redes': 'Máquina de vendas',
    }, 'Uma máquina de vendas é um sistema.\n\n## O que é\n\nTexto.\n\n## Perguntas frequentes\n\n### Funciona?\n\nDepende.')
    const md2 = md.replace('Exemplos reais (do Fabrício):\n- ', 'Exemplos reais (do Fabrício):\n- Clínica que dobrou a agenda\n- Loja de móveis')
    const r = lerArquivoDeArtigo(md2)
    expect(r.dados).toMatchObject({ titulo: 'Máquina de vendas: o que é', subtitulo: 'Como vender todo mês', publico: 'Donos de empresas de serviço', categoria: 'Vendas e marketing', autor: 'Fabrício Saraiva', palavraChave: 'máquina de vendas', tags: 'vendas, funil, receita', resumo: 'Entenda o que é uma máquina de vendas.', ctaLabel: 'Faça o pré-diagnóstico', ctaUrl: '/maquinadevendas', ctaPosicao: 'final', ogTitulo: 'Máquina de vendas' })
    expect(r.briefing).toMatchObject({ main_problem: 'Leads chegam e somem', related_gear: 'Previsível', original_examples: ['Clínica que dobrou a agenda', 'Loja de móveis'] })
    expect(r.artigo.startsWith('Uma máquina de vendas é um sistema.')).toBe(true)
    expect(r.artigo).toContain('## Perguntas frequentes')
    expect(r.ignorados).toEqual([])
  })

  it('o modelo .docx volta como texto com títulos e negrito', () => {
    const texto = docxParaTexto(modeloDocx(cats, autores))
    expect(texto).toContain('# Ficha do artigo')
    expect(texto).toContain('## Essencial')
    expect(texto).toMatch(/\*\*Título:\*\*/)
    expect(texto).toContain('=== ARTIGO ===')
    expect(lerArquivoDeArtigo(texto).dados).toEqual({})
  })
})
