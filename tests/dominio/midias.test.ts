import { describe, expect, it } from 'vitest'
import { validarArquivo, validarConjunto } from '@/dominio/midias'
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

  it('aceita até 1 GB e recusa acima', () => {
    expect(codigoDe(() => validarArquivo({ tipoMime: 'video/mp4', tamanhoBytes: 1024 ** 3 }))).toBeUndefined()
    expect(codigoDe(() => validarArquivo({ tipoMime: 'video/mp4', tamanhoBytes: 1024 ** 3 + 1 }))).toBe('arquivo_grande')
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
