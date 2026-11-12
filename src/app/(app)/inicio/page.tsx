import Link from 'next/link'
import './inicio.css'
import { Ic } from '@/componentes/app/Ic'
import { ChipCliente } from '@/componentes/NomeCliente'
import { EditorVencimento } from '@/componentes/tarefas/EditorVencimento'
import { SeletorStatus } from '@/componentes/tarefas/SeletorStatus'
import { dataDeHoje, lerFiltros } from '@/dominio/filtros'
import { grupoDePrazo, type GrupoPrazo } from '@/dominio/kanban'
import { montarArvore, ROTULO_PRIORIDADE } from '@/dominio/tarefas'
import { exigirEquipe } from '@/infra/supabase/sessao'
import { criarClienteServidor } from '@/infra/supabase/servidor'
import { statusDasListas } from '@/servicos/listas'
import { listarTarefas } from '@/servicos/tarefas'
import { listarEquipe } from '@/servicos/usuarios'

const COR_PRIO = { urgente: '#d80d12', alta: '#e08a00', normal: '#1d6fe0', baixa: '#8b8b94' } as const

const GRUPOS: { id: GrupoPrazo; nome: string; cor: string }[] = [
  { id: 'atrasadas', nome: 'Em atraso', cor: '#e5484d' },
  { id: 'hoje', nome: 'Hoje', cor: '#f76808' },
  { id: 'semana', nome: 'Próximos 7 dias', cor: '#7b68ee' },
  { id: 'depois', nome: 'Depois', cor: '#5b8def' },
  { id: 'sem-prazo', nome: 'Sem vencimento', cor: '#87909e' },
]

export default async function MinhasTarefas({ searchParams }: PageProps<'/inicio'>) {
  const eu = await exigirEquipe()
  const sp = await searchParams
  const comConcluidas = sp.concluidas === '1'
  const sb = await criarClienteServidor()
  const hoje = dataDeHoje(new Date())
  const [todas, equipe] = await Promise.all([listarTarefas(sb, { responsavelId: eu.id }, lerFiltros({}), hoje), listarEquipe(sb)])
  const tarefas = comConcluidas ? todas : todas.filter((t) => !t.concluidaEm)
  const statusPorLista = await statusDasListas(sb, [...new Set(tarefas.map((t) => t.listaId))])
  // Cada tarefa aparece sozinha (sem a árvore): é a lista pessoal de quem é responsável.
  const planas = montarArvore(tarefas.map((t) => ({ ...t, paiId: null }))).sort((a, b) => ((a.prazo ?? '9') < (b.prazo ?? '9') ? -1 : 1))
  const abertas = todas.filter((t) => !t.concluidaEm).length
  const emAtraso = todas.filter((t) => !t.concluidaEm && t.prazo && t.prazo < hoje).length

  return (
    <div className="mt">
      <header className="mt-topo">
        <h1>Minhas tarefas</h1>
        <span className="mt-resumo">{abertas} abertas · <b data-atraso={emAtraso > 0 ? '' : undefined}>{emAtraso} em atraso</b></span>
        <Link href={comConcluidas ? '/inicio' : '/inicio?concluidas=1'} className="mt-publicadas">
          Mostrar publicadas
          <span role="switch" aria-checked={comConcluidas}><span /></span>
        </Link>
      </header>
      {tarefas.length === 0 ? (
        <div className="mt-vazio">
          <div>
            <span><Ic n="task_alt" s={20} /></span>
            <p>Nada atribuído a você</p>
            <p>Quando alguém atribuir uma tarefa ou post, ele aparece aqui organizado por vencimento.</p>
          </div>
        </div>
      ) : (
        <div className="mt-corpo">
          {GRUPOS.map((g) => ({ ...g, tarefas: planas.filter((t) => grupoDePrazo(t.prazo, t.concluidaEm, hoje) === g.id) })).filter((g) => g.tarefas.length).map((g) => (
            <details key={g.id} open className="mt-grupo">
              <summary data-atrasadas={g.id === 'atrasadas' ? '' : undefined}>
                <Ic n="expand_more" s={16} />
                <span>{g.nome}</span>
                <span>{g.tarefas.length}</span>
              </summary>
              <div className="mt-rolagem">
                {g.tarefas.map((t) => {
                  const opcoes = statusPorLista[t.listaId] ?? []
                  const atrasada = !!t.prazo && t.prazo < hoje && !t.concluidaEm
                  return (
                    <div key={t.id} className="mt-linha">
                      <div className="mt-c-status"><SeletorStatus tarefaId={t.id} statusId={t.statusId} opcoes={opcoes} /></div>
                      <Link href={`/tarefas/${t.id}`} scroll={false} className="mt-titulo">
                        <span>{t.titulo}</span>
                        {t.clienteNome && <ChipCliente nome={t.clienteNome} cor={t.clienteCor ?? undefined} />}
                      </Link>
                      <span className="mt-lista">{t.listaNome}</span>
                      <div className="mt-c-selo"><SeletorStatus tarefaId={t.id} statusId={t.statusId} opcoes={opcoes} comNome /></div>
                      <div className="mt-c-prazo" data-atrasada={atrasada ? '' : undefined}><EditorVencimento tarefaId={t.id} prazo={t.prazo} concluida={!!t.concluidaEm} hoje={hoje} /></div>
                      <div className="mt-prio"><Ic n="flag" s={15} fill style={{ color: COR_PRIO[t.prioridade] }} />{ROTULO_PRIORIDADE[t.prioridade]}</div>
                    </div>
                  )
                })}
              </div>
            </details>
          ))}
        </div>
      )}
    </div>
  )
}
