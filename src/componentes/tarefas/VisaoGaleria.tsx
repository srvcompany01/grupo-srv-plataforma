import { formatarPrazo } from '@/dominio/prazo'
import { CalendarDays, MessageSquare } from 'lucide-react'
import Link from 'next/link'
import { NomeCliente } from '@/componentes/NomeCliente'
import type { GrupoTarefas } from '@/dominio/agrupamento'
import type { Contexto } from './LinhaTarefa'
import { Pessoas } from './Pessoas'
import { SeloPrioridade } from './SeloPrioridade'


/** Galeria: cartões grandes das tarefas, agrupados como a pessoa escolheu (status por padrão). Cada cartão abre a tarefa. */
export function VisaoGaleria({ grupos, ctx }: { grupos: GrupoTarefas[]; ctx: Contexto }) {
  const total = grupos.reduce((s, g) => s + g.tarefas.length, 0)
  if (!total) return <p>Nenhuma tarefa nesta visualização.</p>
  return (
    <div>
      {grupos.filter((g) => g.tarefas.length > 0 || !g.semCabecalho).map((g) => (
        <section key={g.id}>
          {!g.semCabecalho && (
            <h2>
              <span style={{ background: g.cor }} aria-hidden /> {g.nome}
              <span>{g.tarefas.length}</span>
            </h2>
          )}
          <ul>
            {g.tarefas.map((t) => {
              const st = ctx.statusPorLista[t.listaId]?.find((s) => s.id === t.statusId)
              const atrasada = !!t.prazo && t.prazo < ctx.hoje && !t.concluidaEm
              return (
                <li key={t.id}>
                  <Link href={`/tarefas/${t.id}`}>
                    <span style={{ background: st?.cor ?? g.cor }} aria-hidden />
                    <span>
                      <span>{t.titulo}</span>
                      <NomeCliente nome={t.clienteNome} />
                      <span>
                        {st && <span style={{ background: `${st.cor}22`, color: st.cor }}>{st.nome}</span>}
                        <SeloPrioridade prioridade={t.prioridade} />
                        {t.prazo && <span><CalendarDays />{formatarPrazo(t.prazo, t.horario)}</span>}
                        {!!t.comentarios && <span><MessageSquare />{t.comentarios}</span>}
                      </span>
                      <span>
                        {t.responsaveis.length ? <Pessoas pessoas={t.responsaveis} /> : <span>Sem responsável</span>}
                        {t.filhos.length > 0 && <span>{t.filhos.length} subtarefa{t.filhos.length > 1 ? 's' : ''}</span>}
                      </span>
                    </span>
                  </Link>
                </li>
              )
            })}
          </ul>
        </section>
      ))}
    </div>
  )
}
