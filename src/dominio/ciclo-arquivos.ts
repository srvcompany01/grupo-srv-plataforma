/** Ciclo de renovação dos arquivos: o que é apagado e quando (as datas são calculadas no banco). */
export const TIPOS_ARQUIVO = {
  post: { rotulo: 'Mídias de posts', regra: 'Publicado: 90 dias depois da publicação. Não publicado: 180 dias sem versão nova.' },
  anexo_tarefa: { rotulo: 'Anexos de tarefas', regra: '12 meses depois do envio.' },
  anexo_chat: { rotulo: 'Anexos do chat', regra: '12 meses depois do envio.' },
  criativo: { rotulo: 'Criativos de anúncio', regra: '90 dias, se já foram enviados à Meta (ela guarda a cópia dela).' },
  reuniao: { rotulo: 'Gravações de reunião', regra: 'Logo depois que a ata é gerada (a transcrição fica no documento).' },
} as const
export type TipoArquivo = keyof typeof TIPOS_ARQUIVO

export const TABELA_DO_TIPO = { post: 'content_media', anexo_tarefa: 'comment_attachments', anexo_chat: 'chat_attachments', criativo: 'ad_creatives' } as const

export const NUNCA_APAGADOS = 'Imagens do blog e capas de clientes nunca são apagadas.'

export function tamanho(bytes: number): string {
  if (bytes >= 1e9) return `${(bytes / 1e9).toLocaleString('pt-BR', { maximumFractionDigits: 2 })} GB`
  if (bytes >= 1e6) return `${(bytes / 1e6).toLocaleString('pt-BR', { maximumFractionDigits: 1 })} MB`
  return `${Math.ceil(bytes / 1e3).toLocaleString('pt-BR')} KB`
}
