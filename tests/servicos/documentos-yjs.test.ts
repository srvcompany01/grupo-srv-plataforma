import { describe, expect, it } from 'vitest'
import * as Y from 'yjs'
import { paraBase64 } from '@/dominio/base64'
import { descricaoParaTexto, textoParaDescricao } from '@/dominio/descricao'
import type { PaginaCompleta } from '@/servicos/documentos'
import { alteracaoDeAnexo, conteudoAtual, jsonParaYjs } from '@/servicos/documentos-yjs'

const pagina = (o: Partial<PaginaCompleta>): PaginaCompleta => ({ id: 'p', documentoId: 'd', titulo: '', conteudo: null, ydoc: null, baseUpdate: 0, alteracoes: [], ...o })

describe('documentos: estado Yjs', () => {
  it('o JSON vira estado Yjs e volta igual', () => {
    const json = textoParaDescricao('Primeira linha\nSegunda linha')
    const volta = conteudoAtual(pagina({ ydoc: jsonParaYjs(json) }))
    expect(descricaoParaTexto(volta)).toBe('Primeira linha\nSegunda linha')
  })

  it('acrescentar texto não apaga o que já existia nem o que chegou depois do estado gravado', () => {
    const base = pagina({ ydoc: jsonParaYjs(textoParaDescricao('Original')) })
    const anexo = alteracaoDeAnexo(base, 'Da IA\n\nFim')
    const comAnexo = pagina({ ydoc: base.ydoc, alteracoes: [{ id: 1, data: paraBase64(anexo) }] })
    expect(descricaoParaTexto(conteudoAtual(comAnexo))).toBe('Original\nDa IA\n\nFim')
    // Segundo anexo em cima do primeiro (alteração pendente) também preserva tudo.
    const anexo2 = alteracaoDeAnexo(comAnexo, 'Mais um')
    const dois = pagina({ ydoc: base.ydoc, alteracoes: [{ id: 1, data: paraBase64(anexo) }, { id: 2, data: paraBase64(anexo2) }] })
    expect(descricaoParaTexto(conteudoAtual(dois))).toBe('Original\nDa IA\n\nFim\nMais um')
  })

  it('páginas sem estado gravado partem do JSON salvo', () => {
    const doc = alteracaoDeAnexo(pagina({ conteudo: textoParaDescricao('Antigo') as PaginaCompleta['conteudo'] }), 'Novo')
    const d = new Y.Doc()
    expect(doc.length).toBeGreaterThan(0)
    Y.applyUpdate(d, doc)
  })
})
