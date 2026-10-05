import type { Decisao, Status } from './tipos'

/** Depois que o cliente respondeu, a versão respondida fica congelada. */
export function edicaoCriaNovaVersao(status: Status): boolean {
  return status === 'aprovado' || status === 'ajuste'
}

export function statusAposEdicao(status: Status): Status {
  return status === 'rascunho' ? 'rascunho' : 'aguardando'
}

export function podeEnviar(status: Status): boolean {
  return status === 'rascunho'
}

export function statusAposResposta(decisao: Decisao): Status {
  return decisao
}
