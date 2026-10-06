import { describe, expect, it } from 'vitest'
import { montarArvoreEspacos } from '@/dominio/arvore-espacos'

const esp = (id: string, posicao: string, paiId: string | null = null) => ({ id, nome: id, descricao: null, cor: '#000000', icone: 'layers-3', emoji: null, posicao, paiId })
const pasta = (id: string, espacoId: string, posicao: string) => ({ id, nome: id, espacoId, cor: '#646464', icone: 'folder', emoji: null, posicao })
const lista = (id: string, espacoId: string, posicao: string, pastaId: string | null = null, mes: string | null = null) => ({
  id,
  nome: id,
  espacoId,
  pastaId,
  posicao,
  clienteNome: 'Padaria',
  mes,
  cor: '#646464',
  icone: 'list',
  emoji: null,
})

describe('montarArvoreEspacos', () => {
  it('aninha sub-áreas, pastas e listas em ordem', () => {
    const arvore = montarArvoreEspacos(
      [esp('Operacional', 'a2'), esp('Comercial', 'a0'), esp('Tráfego', 'a1', 'Operacional'), esp('Conteúdo', 'a0', 'Operacional')],
      [pasta('P2', 'Conteúdo', 'a1'), pasta('P1', 'Conteúdo', 'a0')],
      [lista('L2', 'Conteúdo', 'a1', 'P1'), lista('L1', 'Conteúdo', 'a0', 'P1'), lista('Solta', 'Conteúdo', 'a0'), lista('C', 'Comercial', 'a0')],
    )
    expect(arvore.map((e) => e.id)).toEqual(['Comercial', 'Operacional'])
    const op = arvore[1]
    expect(op.filhos.map((e) => e.id)).toEqual(['Conteúdo', 'Tráfego'])
    const conteudo = op.filhos[0]
    expect(conteudo.pastas.map((p) => p.id)).toEqual(['P1', 'P2'])
    expect(conteudo.pastas[0].listas.map((l) => l.id)).toEqual(['L1', 'L2'])
    expect(conteudo.listas.map((l) => l.id)).toEqual(['Solta'])
    expect(arvore[0].listas.map((l) => l.id)).toEqual(['C'])
  })

  it('sub-área visível sem o pai na consulta vira raiz', () => {
    expect(montarArvoreEspacos([esp('Conteúdo', 'a0', 'invisivel')], [], []).map((e) => e.id)).toEqual(['Conteúdo'])
  })

  it('lista em pasta que não veio aparece solta no espaço', () => {
    const [e] = montarArvoreEspacos([esp('E', 'a0')], [], [lista('L', 'E', 'a0', 'pasta-invisivel')])
    expect(e.listas.map((l) => l.id)).toEqual(['L'])
  })
})
