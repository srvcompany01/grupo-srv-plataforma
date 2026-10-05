import { ErroRegra } from './erros'
import type { MidiaEntrada, TipoMidia } from './tipos'

export const TIPOS_ACEITOS: Record<string, TipoMidia> = {
  'image/jpeg': 'imagem',
  'image/png': 'imagem',
  'image/webp': 'imagem',
  'video/mp4': 'video',
  'video/quicktime': 'video',
}
export const TAMANHO_MAXIMO = 1024 ** 3
export const MAX_IMAGENS = 20

export function validarArquivo(a: { tipoMime: string; tamanhoBytes: number }): TipoMidia {
  const tipo = TIPOS_ACEITOS[a.tipoMime]
  if (!tipo) throw new ErroRegra('tipo_invalido', 'Formato não aceito. Use JPG, PNG, WEBP, MP4 ou MOV.')
  if (a.tamanhoBytes > TAMANHO_MAXIMO) throw new ErroRegra('arquivo_grande', 'Arquivo acima de 1 GB.')
  return tipo
}

export function validarConjunto(midias: MidiaEntrada[]): void {
  if (midias.length === 0) throw new ErroRegra('sem_midia', 'Adicione ao menos uma mídia.')
  const videos = midias.filter((m) => m.tipo === 'video').length
  if (videos > 0 && midias.length > 1) {
    throw new ErroRegra('midias_invalidas', 'Um post com vídeo não pode ter outras mídias.')
  }
  if (midias.length > MAX_IMAGENS) {
    throw new ErroRegra('midias_invalidas', `O carrossel aceita até ${MAX_IMAGENS} imagens.`)
  }
}
