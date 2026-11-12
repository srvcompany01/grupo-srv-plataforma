'use client'

import Link from 'next/link'
import type { StatusLista } from '@/dominio/tarefas'
import type { TarefaCompleta } from '@/servicos/tarefas'
import '@/app/(app)/listas/lista.css'
import { NovaTarefa } from '../NovaTarefa'
import { EditorVencimento } from '../EditorVencimento'
import { SeletorStatus } from '../SeletorStatus'

export function SecaoSubtarefas({ tarefa: t, status, euId, hoje }: { tarefa: TarefaCompleta; status: StatusLista[]; euId: string; hoje: string }) {
  const feitas = t.subtarefas.filter((s) => s.concluidaEm).length
  const pct = t.subtarefas.length ? Math.round((feitas / t.subtarefas.length) * 100) : 0
  return (
    <section className="ta-subs">
      <div>
        <h2>Subtarefas</h2>
        <span>{feitas}/{t.subtarefas.length}</span>
        <span style={{ width: 64, height: 4, borderRadius: 2, background: 'var(--bg-active)', overflow: 'hidden' }}><span style={{ display: 'block', height: '100%', width: `${pct}%`, background: '#16a34a' }} /></span>
      </div>
      <div className="ta-subs-lista">
        {t.subtarefas.map((s) => (
          <div key={s.id}>
            <SeletorStatus tarefaId={s.id} statusId={s.statusId} opcoes={status} />
            <Link href={`/tarefas/${s.id}`}>
              {s.titulo}
            </Link>
            <EditorVencimento tarefaId={s.id} prazo={s.prazo} horario={s.horario} concluida={!!s.concluidaEm} hoje={hoje} />
          </div>
        ))}
        <NovaTarefa listaId={t.lista.id} euId={euId} paiId={t.id} />
      </div>
    </section>
  )
}
