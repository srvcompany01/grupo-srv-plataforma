import Link from 'next/link'
import { VisaoLista } from '@/componentes/tarefas/VisaoLista'
import { dataDeHoje, lerFiltros } from '@/dominio/filtros'
import { grupoDePrazo, type GrupoPrazo } from '@/dominio/kanban'
import { montarArvore } from '@/dominio/tarefas'
import { exigirEquipe } from '@/infra/supabase/sessao'
import { criarClienteServidor } from '@/infra/supabase/servidor'
import { statusDasListas } from '@/servicos/listas'
import { listarTarefas } from '@/servicos/tarefas'
import { listarEquipe } from '@/servicos/usuarios'

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
  const ctx = { equipe, hoje, statusPorLista, mostrarLista: true }

  return (
    <div>
      <header className="sticky top-0 z-10 flex h-10 items-center gap-3 border-b border-borda-fraca bg-white px-3">
        <h1 className="text-destaque font-semibold">Minhas tarefas</h1>
        <span className="text-rotulo text-texto-3">{abertas} abertas · <span className={emAtraso ? 'text-[var(--red)]' : ''}>{emAtraso} em atraso</span></span>
        <Link href={comConcluidas ? '/inicio' : '/inicio?concluidas=1'} role="switch" aria-checked={comConcluidas} className="ml-auto inline-flex items-center gap-2 text-rotulo text-texto-2">
          Mostrar publicadas
          <span className={`flex h-4 w-7 items-center rounded-full px-0.5 transition-colors ${comConcluidas ? 'bg-petroleo' : 'bg-[var(--border-strong)]'}`}><span className={`h-3 w-3 rounded-full bg-[var(--bg)] transition-transform ${comConcluidas ? 'translate-x-3' : ''}`} /></span>
        </Link>
      </header>
      <div className="space-y-3 p-3">
      {tarefas.length === 0 ? (
        <p className="text-corpo text-texto-3">Nenhuma tarefa atribuída a você. 🎉</p>
      ) : (
        <VisaoLista
          grupos={GRUPOS.map((g) => ({ ...g, tarefas: planas.filter((t) => grupoDePrazo(t.prazo, t.concluidaEm, hoje) === g.id) })).filter((g) => g.tarefas.length)}
          ctx={ctx}
          euId={eu.id}
        />
      )}
      </div>
    </div>
  )
}
