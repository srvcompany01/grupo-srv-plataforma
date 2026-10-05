export const STATUS = ['rascunho', 'aguardando', 'aprovado', 'ajuste'] as const
export type Status = (typeof STATUS)[number]

export const FORMATOS = ['feed', 'reels', 'stories', 'tiktok'] as const
export type Formato = (typeof FORMATOS)[number]

export type TipoMidia = 'imagem' | 'video'
export type Decisao = 'aprovado' | 'ajuste'

export interface MidiaEntrada {
  chave: string
  tipo: TipoMidia
  nomeOriginal: string
  tamanhoBytes: number
}

export interface CamposPost {
  /** YYYY-MM-DD */
  dataPrevista: string
  formato: Formato
  ideia: string
  objetivo: string
  legenda: string
}
