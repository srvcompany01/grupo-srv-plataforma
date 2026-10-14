import { describe, expect, it } from 'vitest'
import { deBase64, paraBase64 } from '@/dominio/base64'
import { arvoreDePaginas, filtrarDocumentos, lerAba, resumoAcesso, type ResumoDocumento } from '@/dominio/documentos'

const doc = (o: Partial<ResumoDocumento>): ResumoDocumento => ({
  id: 'd', titulo: 'Doc', icone: null, donoId: 'eu', donoNome: 'Eu', visibilidade: 'team', clienteId: null, clienteNome: null, clienteVisivel: false,
  wiki: false, arquivadoEm: null, atualizadoEm: '2026-10-01T00:00:00Z', visualizadoEm: null, favorito: false, listas: [], ...o,
})

describe('abas de documentos', () => {
  const docs = [
    doc({ id: 'a', donoId: 'eu', atualizadoEm: '2026-10-03T00:00:00Z' }),
    doc({ id: 'b', donoId: 'outro', atualizadoEm: '2026-10-05T00:00:00Z', favorito: true }),
    doc({ id: 'c', donoId: 'eu', visibilidade: 'private' }),
    doc({ id: 'd', donoId: 'outro', visibilidade: 'people' }),
    doc({ id: 'e', arquivadoEm: '2026-10-02T00:00:00Z' }),
  ]
  const ids = (aba: Parameters<typeof filtrarDocumentos>[1]) => filtrarDocumentos(docs, aba, 'eu').map((d) => d.id)

  it('todos esconde arquivados e ordena do mais recente', () => expect(ids('todos')).toEqual(['b', 'a', 'c', 'd']))
  it('meus, compartilhados, privados, favoritos e arquivados', () => {
    expect(ids('meus')).toEqual(['a', 'c'])
    expect(ids('compartilhados')).toEqual(['b', 'd'])
    expect(ids('privados')).toEqual(['c', 'd'])
    expect(ids('favoritos')).toEqual(['b'])
    expect(ids('arquivados')).toEqual(['e'])
  })
  it('busca por título, lista ou cliente', () => {
    const lista = [doc({ id: 'x', titulo: 'Roteiro', listas: [{ id: 'l', nome: 'Outubro' }] }), doc({ id: 'y', titulo: 'Outro', clienteNome: 'Padaria' })]
    expect(filtrarDocumentos(lista, 'todos', 'eu', 'outubro').map((d) => d.id)).toEqual(['x'])
    expect(filtrarDocumentos(lista, 'todos', 'eu', 'padar').map((d) => d.id)).toEqual(['y'])
  })
  it('aba inválida vira "todos"', () => expect(lerAba('lixo')).toBe('todos'))
})

describe('páginas', () => {
  it('ordena pai antes dos filhos e as irmãs por posição, com o nível', () => {
    const p = (id: string, paiId: string | null, posicao: string) => ({ id, paiId, titulo: id, icone: null, posicao })
    const arvore = arvoreDePaginas([p('b', null, 'a1'), p('a2', 'a', 'a1'), p('a', null, 'a0'), p('a1', 'a', 'a0'), p('b1', 'b', 'a0')])
    expect(arvore.map((x) => `${x.nivel}:${x.id}`)).toEqual(['0:a', '1:a1', '1:a2', '0:b', '1:b1'])
  })
})

it('texto do acesso', () => {
  expect(resumoAcesso(doc({}), 0)).toBe('Equipe toda')
  expect(resumoAcesso(doc({ visibilidade: 'people' }), 2)).toBe('Você e mais 2 pessoas')
  expect(resumoAcesso(doc({ visibilidade: 'private', clienteNome: 'Padaria', clienteVisivel: true }), 0)).toBe('Só você · cliente Padaria')
})

it('base64 ida e volta com bytes grandes', () => {
  const bytes = Uint8Array.from({ length: 70000 }, (_, i) => i % 256)
  expect([...deBase64(paraBase64(bytes))]).toEqual([...bytes])
})
