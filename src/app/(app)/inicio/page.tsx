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
  { id: 'atrasadas', nome: 'Atrasadas', cor: '#e5484d' },
  { id: 'hoje', nome: 'Hoje', cor: '#f76808' },
  { id: 'semana', nome: 'Próximos 7 dias', cor: '#7b68ee' },
  { id: 'depois', nome: 'Depois', cor: '#5b8def' },
  { id: 'sem-prazo', nome: 'Sem prazo', cor: '#87909e' },
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
  const ctx = { equipe, hoje, statusPorLista, mostrarLista: true }

  return (
    <div className="space-y-4 p-4 md:p-6">
      <header className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-lg font-semibold">Minhas tarefas</h1>
        <Link href={comConcluidas ? '/inicio' : '/inicio?concluidas=1'} className="text-[13px] text-texto-2 hover:text-marca">
          {comConcluidas ? 'Ocultar concluídas' : 'Mostrar concluídas'}
        </Link>
      </header>
      {tarefas.length === 0 ? (
        <p className="text-[13px] text-texto-3">Nenhuma tarefa atribuída a você. 🎉</p>
      ) : (
        <VisaoLista
          grupos={GRUPOS.map((g) => ({ ...g, tarefas: planas.filter((t) => grupoDePrazo(t.prazo, t.concluidaEm, hoje) === g.id) })).filter((g) => g.tarefas.length)}
          ctx={ctx}
          euId={eu.id}
        />
      )}
    </div>
  )
}
