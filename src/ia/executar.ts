import * as z from 'zod'
import { FERRAMENTAS, type Contexto } from '@/mcp/ferramentas'
import { ESCRITAS_DA_IA } from './agente'
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
    console.error('IA executar', nome, e)
    return { ok: false, erro: e instanceof Error ? e.message.slice(0, 300) : 'Falha ao executar.' }
  }
}
