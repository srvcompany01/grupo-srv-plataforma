export const FORMATOS = ['feed', 'reels', 'stories', 'tiktok'] as const
export type Formato = (typeof FORMATOS)[number]

export const ROTULO_FORMATO: Record<Formato, string> = { feed: 'Feed', reels: 'Reels', stories: 'Stories', tiktok: 'TikTok' }

export const APROVACOES = ['rascunho', 'aguardando', 'aprovado', 'ajuste'] as const
export type Aprovacao = (typeof APROVACOES)[number]
export type Decisao = 'aprovado' | 'ajuste'

export const ROTULO_APROVACAO: Record<Aprovacao, string> = {
  rascunho: 'Rascunho',
  aguardando: 'Aguardando aprovação',
  aprovado: 'Aprovado',
  ajuste: 'Ajuste solicitado',
}

const COR_FORMATO: Record<Formato, string> = { feed: '#3e78b8', reels: '#b75b4b', stories: '#d79528', tiktok: '#073f3b' }
export const corDoFormato = (formato: Formato): string => COR_FORMATO[formato]

/** Só o rascunho vai para o cliente; depois disso o post já está (ou esteve) com ele. */
export const podeEnviarParaAprovacao = (a: Aprovacao): boolean => a === 'rascunho'

/** Depois que o cliente respondeu, a versão fica congelada: editar cria a versão seguinte. */
export const edicaoCriaNovaVersao = (a: Aprovacao): boolean => a === 'aprovado' || a === 'ajuste'

export const aprovacaoAposEdicao = (a: Aprovacao): Aprovacao => (a === 'rascunho' ? 'rascunho' : 'aguardando')

export const aprovacaoAposResposta = (d: Decisao): Aprovacao => d

const EXTENSOES = new Set(['jpg', 'png', 'webp', 'mp4', 'mov'])
const UUID = '[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}'

/** Só aceita a chave gerada no upload desta tarefa (`conteudo/<tarefa>/<uuid>.<ext>`); bloqueia chave alheia e `..`. */
export function chaveDeMidiaValida(chave: string, tarefaId: string): boolean {
  const m = new RegExp(`^conteudo/(${UUID})/${UUID}\\.([a-z0-9]+)$`, 'i').exec(chave)
  return !!m && m[1].toLowerCase() === tarefaId.toLowerCase() && EXTENSOES.has(m[2].toLowerCase())
}
