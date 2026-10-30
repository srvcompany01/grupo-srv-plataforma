import Link from 'next/link'
import { Ic } from '@/componentes/app/Ic'
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
    <div>
      <header className="sticky top-0 z-10 flex h-10 items-center gap-3 border-b border-borda-fraca bg-white px-3">
        <h1 className="text-destaque font-semibold">Minhas tarefas</h1>
        <span className="text-rotulo text-texto-3">{abertas} abertas · <span className={emAtraso ? 'text-[var(--red)]' : ''}>{emAtraso} em atraso</span></span>
        <Link href={comConcluidas ? '/inicio' : '/inicio?concluidas=1'} role="switch" aria-checked={comConcluidas} className="ml-auto inline-flex items-center gap-2 text-rotulo text-texto-2">
          Mostrar publicadas
          <span className={`flex h-4 w-7 items-center rounded-full px-0.5 transition-colors ${comConcluidas ? 'bg-petroleo' : 'bg-[var(--border-strong)]'}`}><span className={`h-3 w-3 rounded-full bg-[var(--bg)] transition-transform ${comConcluidas ? 'translate-x-3' : ''}`} /></span>
        </Link>
      </header>
      <div>
      {tarefas.length === 0 ? (
        <div style={{ padding: '60px 16px', display: 'flex', justifyContent: 'center' }}>
          <div style={{ maxWidth: 320, textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 40, height: 40, borderRadius: 8, border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-2)' }}><Ic n="task_alt" s={20} /></div>
            <div style={{ fontSize: 14, fontWeight: 600 }}>Nada atribuído a você</div>
            <div style={{ fontSize: 13, color: 'var(--text-2)' }}>Quando alguém atribuir uma tarefa ou post, ele aparece aqui organizado por vencimento.</div>
          </div>
        </div>
      ) : (
        <div style={{ maxWidth: 1200, padding: '4px 16px 80px', overflowX: 'auto' }}>
          {GRUPOS.map((g) => ({ ...g, tarefas: planas.filter((t) => grupoDePrazo(t.prazo, t.concluidaEm, hoje) === g.id) })).filter((g) => g.tarefas.length).map((g) => (
            <details key={g.id} open style={{ marginTop: 10 }}>
              <summary style={{ height: 32, display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', listStyle: 'none' }}>
                <Ic n="expand_more" s={16} style={{ color: 'var(--text-3)' }} />
                <span style={{ fontSize: 13, fontWeight: 600, color: g.id === 'atrasadas' ? 'var(--red)' : undefined }}>{g.nome}</span>
                <span style={{ fontSize: 12, color: 'var(--text-3)' }}>{g.tarefas.length}</span>
              </summary>
              <div style={{ minWidth: 760 }}>
                {g.tarefas.map((t) => {
                  const opcoes = statusPorLista[t.listaId] ?? []
                  const atrasada = !!t.prazo && t.prazo < hoje && !t.concluidaEm
                  return (
                    <div key={t.id} className="hover:bg-[var(--bg-hover)]" style={{ display: 'grid', gridTemplateColumns: '28px minmax(240px,1fr) 200px 136px 90px 96px', height: 36, alignItems: 'center', borderBottom: '1px solid var(--border-soft)' }}>
                      <div style={{ display: 'flex', justifyContent: 'center' }}><SeletorStatus tarefaId={t.id} statusId={t.statusId} opcoes={opcoes} /></div>
                      <Link href={`/tarefas/${t.id}`} scroll={false} style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0, paddingRight: 12 }}>
                        <span className="truncate hover:underline" style={{ fontSize: 13 }}>{t.titulo}</span>
                        {t.clienteNome && <span style={{ flex: 'none', height: 18, display: 'inline-flex', alignItems: 'center', padding: '0 6px', borderRadius: 4, background: 'var(--client-soft)', color: 'var(--client)', fontSize: 12, fontWeight: 700, whiteSpace: 'nowrap' }}>{t.clienteNome}</span>}
                      </Link>
                      <span className="truncate" style={{ fontSize: 12, color: 'var(--text-3)', paddingRight: 8 }}>{t.listaNome}</span>
                      <div><SeletorStatus tarefaId={t.id} statusId={t.statusId} opcoes={opcoes} comNome /></div>
                      <div style={{ color: atrasada ? 'var(--red)' : undefined, fontSize: 13 }}><EditorVencimento tarefaId={t.id} prazo={t.prazo} concluida={!!t.concluidaEm} hoje={hoje} /></div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 13, color: 'var(--text-2)', padding: '0 6px' }}><Ic n="flag" s={15} fill style={{ color: COR_PRIO[t.prioridade] }} />{ROTULO_PRIORIDADE[t.prioridade]}</div>
                    </div>
                  )
                })}
              </div>
            </details>
          ))}
        </div>
      )}
      </div>
    </div>
  )
}
