import { describe, expect, it } from 'vitest'
import { validarArquivo, validarConjunto, validarEntrada } from '@/dominio/midias'
import type { MidiaEntrada, TipoMidia } from '@/dominio/tipos'
import { ErroRegra, type CodigoErro } from '@/dominio/erros'

function codigoDe(fn: () => unknown): CodigoErro | undefined {
  try {
    fn()
  } catch (e) {
    if (e instanceof ErroRegra) return e.codigo
    throw e
  }
  return undefined
}

const m = (tipo: TipoMidia, i = 0): MidiaEntrada => ({
  chave: `posts/p/${i}`, tipo, nomeOriginal: `${i}`, tamanhoBytes: 1,
})
const imagens = (n: number) => Array.from({ length: n }, (_, i) => m('imagem', i))

describe('validarArquivo', () => {
  it('classifica os tipos aceitos', () => {
    expect(validarArquivo({ tipoMime: 'video/quicktime', tamanhoBytes: 10 })).toBe('video')
    expect(validarArquivo({ tipoMime: 'video/mp4', tamanhoBytes: 10 })).toBe('video')
    expect(validarArquivo({ tipoMime: 'image/webp', tamanhoBytes: 10 })).toBe('imagem')
    expect(validarArquivo({ tipoMime: 'image/jpeg', tamanhoBytes: 10 })).toBe('imagem')
    expect(validarArquivo({ tipoMime: 'image/png', tamanhoBytes: 10 })).toBe('imagem')
  })

  it('recusa tipo fora da lista', () => {
    expect(codigoDe(() => validarArquivo({ tipoMime: 'image/gif', tamanhoBytes: 10 }))).toBe('tipo_invalido')
  })

  it('aceita até 4 GB e recusa acima', () => {
    expect(codigoDe(() => validarArquivo({ tipoMime: 'video/mp4', tamanhoBytes: 4 * 1024 ** 3 }))).toBeUndefined()
    expect(codigoDe(() => validarArquivo({ tipoMime: 'video/mp4', tamanhoBytes: 4 * 1024 ** 3 + 1 }))).toBe('arquivo_grande')
  })
})

describe('validarConjunto', () => {
  it('recusa conjunto vazio', () => {
    expect(codigoDe(() => validarConjunto([]))).toBe('sem_midia')
  })

  it('aceita um vídeo, uma imagem ou até 20 imagens', () => {
    expect(codigoDe(() => validarConjunto([m('video')]))).toBeUndefined()
    expect(codigoDe(() => validarConjunto([m('imagem')]))).toBeUndefined()
    expect(codigoDe(() => validarConjunto(imagens(20)))).toBeUndefined()
  })

  it('recusa 21 imagens, vídeo com imagem e dois vídeos', () => {
    expect(codigoDe(() => validarConjunto(imagens(21)))).toBe('midias_invalidas')
    expect(codigoDe(() => validarConjunto([m('video'), m('imagem', 1)]))).toBe('midias_invalidas')
    expect(codigoDe(() => validarConjunto([m('video'), m('video', 1)]))).toBe('midias_invalidas')
  })
})

describe('validarEntrada', () => {
  const e = (extra: Partial<MidiaEntrada>): MidiaEntrada => ({
    chave: 'posts/p/x.jpg', tipo: 'imagem', nomeOriginal: 'x.jpg', tamanhoBytes: 10, ...extra,
  })

  it('aceita tipo coerente com a extensão da chave', () => {
    expect(codigoDe(() => validarEntrada(e({})))).toBeUndefined()
    expect(codigoDe(() => validarEntrada(e({ chave: 'posts/p/x.mov', tipo: 'video' })))).toBeUndefined()
  })

  it('recusa tipo que não bate com a extensão', () => {
    expect(codigoDe(() => validarEntrada(e({ chave: 'posts/p/x.mp4', tipo: 'imagem' })))).toBe('midias_invalidas')
    expect(codigoDe(() => validarEntrada(e({ tipo: 'qualquer' as TipoMidia })))).toBe('midias_invalidas')
  })

  it('recusa extensão desconhecida', () => {
    expect(codigoDe(() => validarEntrada(e({ chave: 'posts/p/x.gif' })))).toBe('chave_invalida')
    expect(codigoDe(() => validarEntrada(e({ chave: 'posts/p/x' })))).toBe('chave_invalida')
  })

  it('recusa tamanho fora de 1 byte a 4 GB e nome vazio', () => {
    expect(codigoDe(() => validarEntrada(e({ tamanhoBytes: 0 })))).toBe('midias_invalidas')
    expect(codigoDe(() => validarEntrada(e({ tamanhoBytes: -5 })))).toBe('midias_invalidas')
    expect(codigoDe(() => validarEntrada(e({ tamanhoBytes: 1.5 })))).toBe('midias_invalidas')
    expect(codigoDe(() => validarEntrada(e({ tamanhoBytes: 4 * 1024 ** 3 + 1 })))).toBe('arquivo_grande')
    expect(codigoDe(() => validarEntrada(e({ nomeOriginal: '' })))).toBe('midias_invalidas')
  })
})
