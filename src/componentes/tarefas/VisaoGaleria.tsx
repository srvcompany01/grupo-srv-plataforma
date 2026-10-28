import { CalendarDays, MessageSquare } from 'lucide-react'
import Link from 'next/link'
import { NomeCliente } from '@/componentes/NomeCliente'
import type { GrupoTarefas } from '@/dominio/agrupamento'
import type { Contexto } from './LinhaTarefa'
import { Pessoas } from './Pessoas'
import { SeloPrioridade } from './SeloPrioridade'

const data = (iso: string) => new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short', timeZone: 'UTC' }).format(new Date(`${iso}T00:00:00Z`)).replace('.', '')

/** Galeria: cartões grandes das tarefas, agrupados como a pessoa escolheu (status por padrão). Cada cartão abre a tarefa. */
export function VisaoGaleria({ grupos, ctx }: { grupos: GrupoTarefas[]; ctx: Contexto }) {
  const total = grupos.reduce((s, g) => s + g.tarefas.length, 0)
  if (!total) return <p className="py-10 text-center text-corpo text-texto-3">Nenhuma tarefa nesta visualização.</p>
  return (
    <div className="space-y-6">
      {grupos.filter((g) => g.tarefas.length > 0 || !g.semCabecalho).map((g) => (
        <section key={g.id}>
          {!g.semCabecalho && (
            <h2 className="mb-2 flex items-center gap-2 text-rotulo font-semibold uppercase text-texto-2">
              <span className="h-2.5 w-2.5 rounded-full" style={{ background: g.cor }} aria-hidden /> {g.nome}
              <span className="font-normal text-texto-3">{g.tarefas.length}</span>
            </h2>
          )}
          <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
            {g.tarefas.map((t) => {
              const st = ctx.statusPorLista[t.listaId]?.find((s) => s.id === t.statusId)
              const atrasada = !!t.prazo && t.prazo < ctx.hoje && !t.concluidaEm
              return (
                <li key={t.id}>
                  <Link href={`/tarefas/${t.id}`} className="block overflow-hidden rounded-xl border border-borda bg-white transition-shadow hover:shadow-flutuante">
                    <span className="block h-1.5" style={{ background: st?.cor ?? g.cor }} aria-hidden />
                    <span className="block space-y-2 p-3">
                      <span className={`block text-corpo font-semibold ${t.concluidaEm ? 'text-texto-3 line-through' : 'text-texto'}`}>{t.titulo}</span>
                      <NomeCliente nome={t.clienteNome} className="text-rotulo" />
                      <span className="flex flex-wrap items-center gap-2 text-rotulo text-texto-2">
                        {st && <span className="rounded-md px-1.5 py-0.5 text-legenda font-semibold uppercase" style={{ background: `${st.cor}22`, color: st.cor }}>{st.nome}</span>}
                        <SeloPrioridade prioridade={t.prioridade} />
                        {t.prazo && <span className={`inline-flex items-center gap-1 ${atrasada ? 'font-semibold text-perigo' : ''}`}><CalendarDays className="h-3.5 w-3.5" />{data(t.prazo)}</span>}
                        {!!t.comentarios && <span className="inline-flex items-center gap-1"><MessageSquare className="h-3.5 w-3.5" />{t.comentarios}</span>}
                      </span>
                      <span className="flex items-center justify-between">
                        {t.responsaveis.length ? <Pessoas pessoas={t.responsaveis} /> : <span className="text-rotulo text-texto-3">Sem responsável</span>}
                        {t.filhos.length > 0 && <span className="text-rotulo text-texto-3">{t.filhos.length} subtarefa{t.filhos.length > 1 ? 's' : ''}</span>}
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
