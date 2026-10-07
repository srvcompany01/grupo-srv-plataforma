import { expect, it } from 'vitest'
import { colunasVisiveis, CONFIG_COLUNAS_VAZIA, mostrarColuna, moverColuna, ocultarColuna } from '@/dominio/colunas-lista'

const C = CONFIG_COLUNAS_VAZIA

it('por padrão mostra só as nativas padrão e os campos', () => {
  expect(colunasVisiveis(['f1'], C)).toEqual(['responsavel', 'prazo', 'prioridade', 'campo:f1'])
})

it('mostra e oculta nativas que começam ocultas', () => {
  const com = mostrarColuna(C, 'status')
  expect(colunasVisiveis([], com)).toEqual(['responsavel', 'prazo', 'prioridade', 'status'])
  expect(colunasVisiveis([], ocultarColuna(com, 'status'))).toEqual(['responsavel', 'prazo', 'prioridade'])
})

it('oculta coluna padrão e campo, e os traz de volta', () => {
  const oculto = ocultarColuna(ocultarColuna(C, 'prazo'), 'f1')
  expect(colunasVisiveis(['f1'], oculto)).toEqual(['responsavel', 'prioridade'])
  expect(colunasVisiveis(['f1'], mostrarColuna(oculto, 'prazo'))).toEqual(['responsavel', 'prazo', 'prioridade'])
})

it('move entre as visíveis, misturando nativas e campos', () => {
  const visiveis = colunasVisiveis(['f1'], C)
  const inicio = moverColuna(C, visiveis, 'f1', 'inicio')
  expect(colunasVisiveis(['f1'], inicio)).toEqual(['campo:f1', 'responsavel', 'prazo', 'prioridade'])
  const final = moverColuna(C, visiveis, 'responsavel', 'final')
  expect(colunasVisiveis(['f1'], final)).toEqual(['prazo', 'prioridade', 'campo:f1', 'responsavel'])
})
