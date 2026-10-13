import { expect, it } from 'vitest'
import { gerarTokenApi, hashToken, pareceTokenApi, tokenDoCabecalho } from '@/dominio/api-token'
import { descricaoParaTexto, textoParaDescricao } from '@/dominio/descricao'

it('gera token com prefixo e valida o formato', () => {
  const t = gerarTokenApi()
  expect(t).toMatch(/^srv_[A-Za-z0-9]{32}$/)
  expect(pareceTokenApi(t)).toBe(true)
  expect(pareceTokenApi('srv_curto')).toBe(false)
})

it('hash é estável e tem 64 caracteres hex', async () => {
  const h = await hashToken('srv_' + 'a'.repeat(32))
  expect(h).toMatch(/^[0-9a-f]{64}$/)
  expect(await hashToken('srv_' + 'a'.repeat(32))).toBe(h)
  expect(await hashToken('srv_' + 'b'.repeat(32))).not.toBe(h)
})

it('lê o token do cabeçalho Authorization', () => {
  const t = gerarTokenApi()
  expect(tokenDoCabecalho(`Bearer ${t}`)).toBe(t)
  expect(tokenDoCabecalho(`bearer  ${t}`)).toBe(t)
  expect(tokenDoCabecalho(`Basic ${t}`)).toBeNull()
  expect(tokenDoCabecalho('Bearer xyz')).toBeNull()
  expect(tokenDoCabecalho(null)).toBeNull()
})

it('converte texto em documento com um parágrafo por linha', () => {
  expect(textoParaDescricao('')).toBeNull()
  expect(textoParaDescricao('a\n\nb')).toEqual({
    type: 'doc',
    content: [{ type: 'paragraph', content: [{ type: 'text', text: 'a' }] }, { type: 'paragraph' }, { type: 'paragraph', content: [{ type: 'text', text: 'b' }] }],
  })
})

it('ida e volta entre texto e documento', () => {
  expect(descricaoParaTexto(textoParaDescricao('Cena 1\n\nCena 2'))).toBe('Cena 1\n\nCena 2')
  expect(descricaoParaTexto(null)).toBe('')
})
