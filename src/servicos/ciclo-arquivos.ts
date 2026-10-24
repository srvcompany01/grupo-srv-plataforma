import 'server-only'
import { TABELA_DO_TIPO, tamanho, type TipoArquivo } from '@/dominio/ciclo-arquivos'
import { apagarArquivos, arquivosAntigos } from '@/infra/r2'
import { criarClienteAdmin } from '@/infra/supabase/admin'

/**
 * Ciclo de renovação (rotina diária /api/cron/arquivos): apaga do R2 os arquivos vencidos e marca o registro como
 * arquivado; limpa gravações de reunião esquecidas; às segundas avisa admin e gestor do que sai na semana.
 */
export async function rodarCiclo(agora = new Date()): Promise<{ tipo: string; arquivos: number; bytes: number }[]> {
  const admin = criarClienteAdmin()
  const { data: vencidos, error } = await admin.rpc('arquivos_a_arquivar', { p_antecedencia_dias: 0 })
  if (error) throw error
  const feito: { tipo: string; arquivos: number; bytes: number }[] = []
  for (const tipo of Object.keys(TABELA_DO_TIPO) as (keyof typeof TABELA_DO_TIPO)[]) {
    // ponytail: até 2.000 por tipo por dia; o resto sai nos dias seguintes.
    const lote = (vencidos ?? []).filter((v) => v.tipo === tipo).slice(0, 2000)
    if (!lote.length) continue
    const falhas = new Set(await apagarArquivos(lote.map((v) => v.chave)))
    const ok = lote.filter((v) => !falhas.has(v.chave))
    if (!ok.length) continue
    const { error: e } = await admin.from(TABELA_DO_TIPO[tipo]).update({ arquivado_em: agora.toISOString() }).in('id', ok.map((v) => v.id))
    if (e) throw e
    feito.push({ tipo, arquivos: ok.length, bytes: ok.reduce((s, v) => s + Number(v.bytes), 0) })
  }
  // Gravações de reunião sem ata (envio abandonado ou falha): a ata normal já apaga a dela.
  const reunioes = await arquivosAntigos('reunioes/', new Date(agora.getTime() - 2 * 86_400_000))
  if (reunioes.length) {
    const falhas = new Set(await apagarArquivos(reunioes.map((r) => r.chave)))
    const ok = reunioes.filter((r) => !falhas.has(r.chave))
    if (ok.length) feito.push({ tipo: 'reuniao', arquivos: ok.length, bytes: ok.reduce((s, r) => s + r.bytes, 0) })
  }
  if (feito.length) await admin.from('file_cleanups').insert(feito)
  if (agora.getUTCDay() === 1) await avisarSemana()
  return feito
}

async function avisarSemana() {
  const admin = criarClienteAdmin()
  const { data } = await admin.rpc('arquivos_a_arquivar', { p_antecedencia_dias: 7 })
  if (!data?.length) return
  const bytes = data.reduce((s, v) => s + Number(v.bytes), 0)
  const { data: gestores } = await admin.from('profiles').select('id').in('role', ['admin', 'gestor']).eq('active', true)
  if (gestores?.length) {
    await admin.from('notifications').insert(gestores.map((g) => ({
      user_id: g.id, kind: 'alerta', link: '/config/armazenamento',
      message: `${data.length} arquivo(s) (${tamanho(bytes)}) serão arquivados nos próximos 7 dias pelo ciclo de renovação. Baixe o que precisar guardar.`,
    })))
  }
}

/** Apaga uma gravação de reunião (depois da ata) e registra o espaço liberado. */
export async function apagarGravacao(chave: string, bytes: number): Promise<void> {
  const falhas = await apagarArquivos([chave])
  if (!falhas.length) await criarClienteAdmin().from('file_cleanups').insert({ tipo: 'reuniao' satisfies TipoArquivo, arquivos: 1, bytes })
}

export type SituacaoArmazenamento = {
  uso: { tipo: string; arquivos: number; bytes: number }[]
  liberado: { tipo: string; arquivos: number; bytes: number }[]
  proximos: { tipo: string; id: string; chave: string; bytes: number; nome: string; venceEm: string }[]
  /** Os que saem nos próximos 7 dias. */
  semana: { arquivos: number; bytes: number }
}

export async function situacaoArmazenamento(): Promise<SituacaoArmazenamento> {
  const admin = criarClienteAdmin()
  const [uso, liberado, proximos] = await Promise.all([
    admin.rpc('uso_armazenamento'),
    admin.from('file_cleanups').select('tipo, arquivos, bytes'),
    admin.rpc('arquivos_a_arquivar', { p_antecedencia_dias: 30 }),
  ])
  if (uso.error) throw uso.error
  const porTipo = new Map<string, { tipo: string; arquivos: number; bytes: number }>()
  for (const l of liberado.data ?? []) {
    const t = porTipo.get(l.tipo) ?? { tipo: l.tipo, arquivos: 0, bytes: 0 }
    t.arquivos += l.arquivos
    t.bytes += Number(l.bytes)
    porTipo.set(l.tipo, t)
  }
  const limite = Date.now() + 7 * 86_400_000
  const semana = (proximos.data ?? []).filter((p) => Date.parse(p.vence_em) <= limite)
  return {
    semana: { arquivos: semana.length, bytes: semana.reduce((t, p) => t + Number(p.bytes), 0) },
    uso: (uso.data ?? []).map((u) => ({ tipo: u.tipo, arquivos: Number(u.arquivos), bytes: Number(u.bytes) })),
    liberado: [...porTipo.values()],
    proximos: (proximos.data ?? []).map((p) => ({ tipo: p.tipo, id: p.id, chave: p.chave, bytes: Number(p.bytes), nome: p.nome, venceEm: p.vence_em })),
  }
}
