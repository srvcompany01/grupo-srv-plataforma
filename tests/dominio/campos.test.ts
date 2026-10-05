import { expect, it } from 'vitest'
import { validarCampos } from '@/dominio/campos'

const ok = { dataPrevista: '2026-10-07', formato: 'reels', ideia: 'i', objetivo: 'o', legenda: 'l' }

it('aceita campos válidos e devolve só os campos conhecidos', () => {
  expect(validarCampos({ ...ok, extra: 1 })).toEqual(ok)
})

it('recusa formato desconhecido', () => {
  expect(() => validarCampos({ ...ok, formato: 'youtube' })).toThrow(/formato/i)
})

it('recusa data inválida', () => {
  for (const d of ['07/10/2026', '2026-13-01', '2026-02-30', '']) {
    expect(() => validarCampos({ ...ok, dataPrevista: d }), d).toThrow(/data/i)
  }
})

it('textos ausentes viram string vazia', () => {
  expect(validarCampos({ dataPrevista: ok.dataPrevista, formato: 'feed' })).toMatchObject({ ideia: '', legenda: '' })
})
