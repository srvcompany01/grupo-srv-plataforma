'use client'

import { ArrowRight, CheckCheck, ChevronRight, CircleAlert, Flag } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useId, useState, useTransition } from 'react'
import { somarDias } from '@/dominio/agenda'
import { ROTULO_PRIORIDADE, type TarefaResumo } from '@/dominio/tarefas'

export type TarefaHome = Pick<TarefaResumo, 'id' | 'titulo' | 'prazo' | 'horario' | 'prioridade' | 'clienteNome' | 'clienteCor' | 'listaNome'>
const formatar = (data: string) => new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short', timeZone: 'UTC' }).format(new Date(`${data}T00:00:00Z`)).replace('.', '')

export function RecarregarHome() {
  const router = useRouter()
  const [pendente, iniciar] = useTransition()
  return <button type="button" disabled={pendente} onClick={() => iniciar(() => router.refresh())}>{pendente ? 'Atualizando…' : 'Tentar novamente'}</button>
}

export function Prioridades({ tarefas, hoje, indisponivel = false }: { tarefas: TarefaHome[]; hoje: string; indisponivel?: boolean }) {
  const [aba, setAba] = useState('prioridades')
  const id = useId()
  const abas = [
    { id: 'prioridades', nome: 'Prioridades', tarefas },
    { id: 'hoje', nome: 'Hoje', tarefas: tarefas.filter((t) => t.prazo === hoje) },
    { id: 'semana', nome: 'Próximos 7 dias', tarefas: tarefas.filter((t) => t.prazo && t.prazo > hoje && t.prazo <= somarDias(hoje, 7)) },
  ]
  const atual = abas.find((a) => a.id === aba)!
  return <section className="hm-cartao hm-prioridades" aria-labelledby={`${id}-titulo`}>
    <div className="hm-cab"><div><h2 id={`${id}-titulo`}>Seu foco agora</h2><p>Suas entregas, na ordem de atenção.</p></div><Link href="/inicio">Ver todas <ArrowRight size={14} /></Link></div>
    <div className="hm-filtros" aria-label="Filtrar minhas tarefas">
      {abas.map((a) => <button key={a.id} type="button" aria-pressed={aba === a.id} onClick={() => setAba(a.id)} aria-controls={`${id}-lista`}>{a.nome}<span>{indisponivel ? '—' : a.tarefas.length}</span></button>)}
    </div>
    <div id={`${id}-lista`} aria-live="polite">
      {indisponivel ? <div className="hm-vazio"><CircleAlert /><h3>Não foi possível carregar suas tarefas</h3><p>Abra Minhas tarefas para tentar novamente.</p><Link href="/inicio">Abrir minhas tarefas <ArrowRight size={14} /></Link></div> : atual.tarefas.length === 0 ? <div className="hm-vazio"><CheckCheck /><h3>{aba === 'hoje' ? 'Nenhuma entrega para hoje' : aba === 'semana' ? 'A semana está livre por aqui' : 'Tudo em dia por aqui'}</h3><p>{aba === 'prioridades' ? 'Quando uma tarefa for atribuída a você, ela aparece aqui.' : 'Confira as outras prioridades ou aproveite para planejar as próximas entregas.'}</p><Link href="/inicio">Abrir minhas tarefas <ArrowRight size={14} /></Link></div> : <ul className="hm-tarefas">
        {atual.tarefas.slice(0, 6).map((t, indice) => {
          const atrasada = !!t.prazo && t.prazo < hoje
          return <li key={t.id}><Link className="hm-tarefa" href={`/tarefas/${t.id}`} scroll={false}>
            <span className="hm-tarefa-marca" data-atrasada={atrasada || undefined} aria-hidden="true">{indice + 1}</span>
            <span className="hm-tarefa-texto"><strong title={t.titulo}>{t.titulo || 'Sem título'}</strong><span>{t.clienteNome && <span className="hm-cliente-inline"><i style={{ background: t.clienteCor }} />{t.clienteNome}</span>}<span className="hm-tarefa-lista">{t.listaNome}</span></span></span>
            {(t.prioridade === 'urgente' || t.prioridade === 'alta') && <span className="hm-prioridade" data-urgente={t.prioridade === 'urgente' || undefined}><Flag size={12} />{ROTULO_PRIORIDADE[t.prioridade]}</span>}
            <span className="hm-prazo" data-atrasada={atrasada || undefined} data-hoje={t.prazo === hoje || undefined}>{atrasada ? 'Em atraso' : t.prazo === hoje ? 'Hoje' : t.prazo ? formatar(t.prazo) : 'Sem prazo'}{atrasada && <small>{formatar(t.prazo!)}</small>}{t.prazo === hoje && t.horario && <small>{t.horario}</small>}</span>
            <ChevronRight className="hm-tarefa-seta" size={15} />
          </Link></li>
        })}
      </ul>}
    </div>
    {!indisponivel && atual.tarefas.length > 6 && <Link className="hm-rodape-link" href="/inicio">Mais {atual.tarefas.length - 6} tarefas nas suas prioridades <ArrowRight size={14} /></Link>}
  </section>
}
