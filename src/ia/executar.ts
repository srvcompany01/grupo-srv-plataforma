import * as z from 'zod'
import { FERRAMENTAS, type Contexto } from '@/mcp/ferramentas'
import { ESCRITAS_DA_IA } from './agente'
import { mensagemErro } from '@/dominio/erros-banco'
import { resumirResultado } from './resumo'

/** Executa UMA ferramenta de escrita que a pessoa confirmou. Só as permitidas à IA; valida os argumentos de novo. */
export async function executarConfirmada(ctx: Contexto, nome: string, argumentos: unknown): Promise<{ ok: true; resumo: string } | { ok: false; erro: string }> {
  const f = FERRAMENTAS.find((x) => x.nome === nome)
  if (!f || !f.escrita || !ESCRITAS_DA_IA.has(nome)) return { ok: false, erro: 'Ação não permitida.' }
  const lido = z.object(f.entrada).safeParse(argumentos)
  if (!lido.success) return { ok: false, erro: `Dados inválidos: ${lido.error.issues.map((i) => `${i.path.join('.')} ${i.message}`).join('; ')}`.slice(0, 300) }
  try {
    return { ok: true, resumo: resumirResultado(nome, await f.executar(ctx, lido.data as never)) }
  } catch (e) {
    console.error('IA executar', nome, JSON.stringify(e instanceof Error ? { message: e.message } : e))
    // Erros do banco chegam como objeto ({ code, message }), não como Error: traduz para algo que a pessoa entenda.
    const texto = e instanceof Error ? e.message : mensagemErro(e)
    return { ok: false, erro: texto.slice(0, 300) }
  }
}
