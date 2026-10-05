import { ErroRegra } from '@/dominio/erros'

export type Resultado = { ok: true } | { erro: string }

/** Converte erro de regra em mensagem para a tela; o resto vai para o log. */
export function mensagemErro(e: unknown): string {
  if (e instanceof ErroRegra) return e.message
  console.error(e)
  return 'Algo deu errado. Tente de novo.'
}
