import { mensagemErro } from '@/dominio/erros-banco'

export type Resultado = { ok?: string; erro?: string } | null

/** Executa a escrita e transforma erro em mensagem amigável (detalhe no log). */
export async function tentar(fn: () => Promise<unknown>, sucesso = 'Salvo.'): Promise<Resultado> {
  try {
    await fn()
    return { ok: sucesso }
  } catch (e) {
    console.error(e)
    return { erro: mensagemErro(e) }
  }
}
