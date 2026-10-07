import { expect, it } from 'vitest'
import { chaveDeCapaValida, ehDownloadUnsplash, ehImagemUnsplash, formatarCampoCliente, iniciais, validarCapa } from '@/dominio/clientes-galeria'

const ID = '3cb205fc-3e8a-4d0e-9f11-aaaaaaaaaaaa'
const UUID = '0b9c6d36-1d8e-4f43-8d5c-123456789abc'

it('valida a imagem de capa por tipo e tamanho', () => {
  expect(validarCapa({ mime: 'image/png', tamanho: 1000 })).toBeNull()
  expect(validarCapa({ mime: 'image/gif', tamanho: 1000 })).toMatch(/JPG/)
  expect(validarCapa({ mime: 'image/jpeg', tamanho: 6 * 1024 * 1024 })).toMatch(/5 MB/)
  expect(validarCapa({ mime: 'image/jpeg', tamanho: 0 })).toMatch(/vazio/)
})

it('só aceita chave de capa do próprio cliente no formato gerado', () => {
  expect(chaveDeCapaValida(`clientes/${ID}/${UUID}.webp`, ID)).toBe(true)
  expect(chaveDeCapaValida(`clientes/outro/${UUID}.webp`, ID)).toBe(false)
  expect(chaveDeCapaValida(`clientes/${ID}/../x.webp`, ID)).toBe(false)
  expect(chaveDeCapaValida(`posts/${ID}/${UUID}.webp`, ID)).toBe(false)
})

it('restringe URLs do Unsplash aos hosts oficiais em https', () => {
  expect(ehImagemUnsplash('https://images.unsplash.com/photo-1?w=800')).toBe(true)
  expect(ehImagemUnsplash('http://images.unsplash.com/photo-1')).toBe(false)
  expect(ehImagemUnsplash('https://images.unsplash.com.evil.com/x')).toBe(false)
  expect(ehDownloadUnsplash('https://api.unsplash.com/photos/abc/download')).toBe(true)
  expect(ehDownloadUnsplash('https://evil.com/photos/abc/download')).toBe(false)
})

it('formata o valor do campo conforme o tipo', () => {
  expect(formatarCampoCliente('data', '2026-10-07')).toBe('07/10/2026')
  expect(formatarCampoCliente('link', 'https://www.exemplo.com.br/a/b')).toBe('exemplo.com.br')
  expect(formatarCampoCliente('texto', 'Plano anual')).toBe('Plano anual')
  expect(iniciais('Aurum Belém')).toBe('AB')
})
