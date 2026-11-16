import { describe, expect, it } from 'vitest'
import { guiaDeAnuncioGoogle, guiaDeAnuncioMeta, guiaDePost, MODOS_META_GUIA } from '@/dominio/guia-publicacao'

describe('guias de publicação', () => {
  it('o post pergunta lista, formato, redes, quando e modo; e proíbe agendar sem OK', () => {
    const g = guiaDePost()
    const campos = g.perguntas.map((p) => p.campo)
    for (const c of ['listaDeConteudo', 'formato', 'redes', 'quando', 'modo']) expect(campos).toContain(c)
    expect(g.avisos.join(' ')).toMatch(/Nunca agende sem a confirmação/)
  })

  it('anúncio Meta: texto, título, descrição e orçamento sempre; botão só onde pode mudar; link e formulário só nos modos certos', () => {
    const campos = (m: (typeof MODOS_META_GUIA)[number]) => guiaDeAnuncioMeta(m).perguntas.map((p) => p.campo)
    for (const m of MODOS_META_GUIA) for (const c of ['texto', 'titulo', 'descricao', 'orcamentoDiario', 'locais', 'idades']) expect(campos(m)).toContain(c)
    expect(campos('whatsapp')).not.toContain('botao')
    expect(campos('direct')).not.toContain('botao')
    expect(campos('site')).toContain('botao')
    expect(campos('site')).toContain('link')
    expect(campos('site')).not.toContain('formularioId')
    expect(campos('formulario')).toContain('formularioId')
    expect(guiaDeAnuncioMeta('whatsapp').avisos.join(' ')).toMatch(/WhatsApp/)
  })

  it('anúncio Google explica que vídeo não é usado e pede títulos e descrições', () => {
    const g = guiaDeAnuncioGoogle()
    expect(g.objetivo).toMatch(/YouTube/)
    expect(g.perguntas.map((p) => p.campo)).toEqual(expect.arrayContaining(['titulos', 'descricoes', 'palavras', 'orcamentoDiario']))
  })
})
