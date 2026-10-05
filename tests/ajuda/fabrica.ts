import type { CamposPost, MidiaEntrada, TipoMidia } from '@/dominio/tipos'
import { prefixoChave } from '@/servicos/posts'

export const campos = (extra: Partial<CamposPost> = {}): CamposPost => ({
  dataPrevista: '2026-10-07',
  formato: 'feed',
  ideia: 'Ideia',
  objetivo: 'Objetivo',
  legenda: 'Legenda',
  ...extra,
})

export const midia = (postId: string, tipo: TipoMidia = 'imagem', nome = 'a.jpg'): MidiaEntrada => ({
  chave: `${prefixoChave(postId)}${nome}`,
  tipo,
  nomeOriginal: nome,
  tamanhoBytes: 100,
})
