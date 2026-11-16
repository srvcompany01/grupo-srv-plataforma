import { mensagemErro } from '@/dominio/erros-banco'

/** `acao`: botão no aviso de sucesso (ex.: "Abrir" a próxima tarefa da série). */
export type Resultado = { ok?: string; erro?: string; acao?: { rotulo: string; href: string } } | null

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
