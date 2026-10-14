import { expect, it } from 'vitest'
import { contraste, cssTema, lerTema, PREDEFINICOES, TEMA_PADRAO, validarTema } from '@/dominio/tema'

it('calcula contraste WCAG', () => {
  expect(contraste('#000000', '#ffffff')).toBeCloseTo(21, 0)
  expect(contraste('#777777', '#ffffff')).toBeCloseTo(4.48, 1)
})

it('todas as predefinições passam na validação', () => {
  for (const p of PREDEFINICOES) expect(validarTema(p.tema)).toEqual({ tema: p.tema })
})

it('normaliza HEX e rejeita valores inválidos', () => {
  expect(validarTema({ ...TEMA_PADRAO, acao: '073F3B' })).toEqual({ tema: TEMA_PADRAO })
  const r = validarTema({ ...TEMA_PADRAO, fundo: 'red;}body{display:none' })
  expect('erros' in r && r.erros[0]).toMatch(/Fundo/)
})

it('bloqueia combinações ilegíveis', () => {
  const claro = validarTema({ ...TEMA_PADRAO, acao: '#a7f3d0' })
  expect('erros' in claro && claro.erros.join()).toMatch(/botões/)
  const escuro = validarTema({ ...TEMA_PADRAO, fundo: '#333333' })
  expect('erros' in escuro && escuro.erros.join()).toMatch(/fundo/)
})

it('cai no padrão quando o valor salvo é inválido', () => {
  expect(lerTema(null)).toEqual(TEMA_PADRAO)
  expect(lerTema({ acao: 'x' })).toEqual(TEMA_PADRAO)
  expect(cssTema(TEMA_PADRAO)).toBe(':root{--tema-acao:#073f3b;--tema-acento:#70262d;--tema-fundo:#f7f3ed;--tema-superficie:#fffcf8}')
})
