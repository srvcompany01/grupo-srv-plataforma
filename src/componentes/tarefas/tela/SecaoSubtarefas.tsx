'use client'

import Link from 'next/link'
import type { StatusLista } from '@/dominio/tarefas'
import type { TarefaCompleta } from '@/servicos/tarefas'
import { NovaTarefa } from '../NovaTarefa'
import { EditorVencimento } from '../EditorVencimento'
import { SeletorStatus } from '../SeletorStatus'

export function SecaoSubtarefas({ tarefa: t, status, euId, hoje }: { tarefa: TarefaCompleta; status: StatusLista[]; euId: string; hoje: string }) {
  const feitas = t.subtarefas.filter((s) => s.concluidaEm).length
  const pct = t.subtarefas.length ? Math.round((feitas / t.subtarefas.length) * 100) : 0
  return (
    <section className="space-y-2">
      <div className="flex items-center gap-2">
        <h2 className="text-[13px] font-semibold">Subtarefas</h2>
        <span className="text-[12px] text-texto-3">{feitas}/{t.subtarefas.length}</span>
        <span style={{ width: 64, height: 4, borderRadius: 2, background: 'var(--bg-active)', overflow: 'hidden' }}><span style={{ display: 'block', height: '100%', width: `${pct}%`, background: '#16a34a' }} /></span>
      </div>
      <div className="rounded-md border border-borda">
        {t.subtarefas.map((s) => (
          <div key={s.id} className="flex h-8 items-center gap-2 border-b border-[var(--border-soft)] px-2 text-[13px] last:border-b-0">
            <SeletorStatus tarefaId={s.id} statusId={s.statusId} opcoes={status} />
            <Link href={`/tarefas/${s.id}`} className={`flex-1 truncate hover:underline ${s.concluidaEm ? 'text-texto-3 line-through' : ''}`}>
              {s.titulo}
            </Link>
            <EditorVencimento tarefaId={s.id} prazo={s.prazo} concluida={!!s.concluidaEm} hoje={hoje} />
          </div>
        ))}
        <NovaTarefa listaId={t.lista.id} euId={euId} paiId={t.id} />
      </div>
    </section>
  )
}
