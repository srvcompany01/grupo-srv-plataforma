'use client'

import Link from 'next/link'
import type { StatusLista } from '@/dominio/tarefas'
import type { TarefaCompleta } from '@/servicos/tarefas'
import { NovaTarefa } from '../NovaTarefa'
import { EditorVencimento } from '../EditorVencimento'
import { SeletorStatus } from '../SeletorStatus'

export function SecaoSubtarefas({ tarefa: t, status, euId, hoje }: { tarefa: TarefaCompleta; status: StatusLista[]; euId: string; hoje: string }) {
  return (
    <section className="space-y-2">
      <h2 className="text-corpo font-semibold">Subtarefas</h2>
      <div className="rounded-md border border-borda">
        {t.subtarefas.map((s) => (
          <div key={s.id} className="flex h-9 items-center gap-2 border-b border-borda px-2 text-corpo last:border-b-0">
            <SeletorStatus tarefaId={s.id} statusId={s.statusId} opcoes={status} />
            <Link href={`/tarefas/${s.id}`} className="flex-1 truncate hover:text-marca">
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
