import { CircleCheck, ClipboardList, Loader } from 'lucide-react'
import { AlternadorVisao } from '@/componentes/tarefas/AlternadorVisao'
import { BarraFiltros } from '@/componentes/tarefas/BarraFiltros'
import { CATEGORIAS } from '@/componentes/tarefas/categorias'
import { VisaoKanban } from '@/componentes/tarefas/VisaoKanban'
import { VisaoLista } from '@/componentes/tarefas/VisaoLista'
import { EstadoVazio } from '@/componentes/EstadoVazio'
import { TabelaResumo } from '@/componentes/TabelaResumo'
import { dataDeHoje, lerFiltros } from '@/dominio/filtros'
import { resumirPor } from '@/dominio/resumo'
import { montarArvore, type Categoria } from '@/dominio/tarefas'
import { exigirEquipe } from '@/infra/supabase/sessao'
import { criarClienteServidor } from '@/infra/supabase/servidor'
import { listarClientes } from '@/servicos/clientes-plataforma'
import { statusDasListas } from '@/servicos/listas'
import { listarTarefas } from '@/servicos/tarefas'
import { listarEquipe } from '@/servicos/usuarios'

const CAMINHO = '/painel-de-gestao'
const pct = (parte: number, total: number) => (total ? Math.round((parte / total) * 100) : 0)

function Metrica({ icone: Icone, rotulo, valor, detalhe, tom }: { icone: typeof ClipboardList; rotulo: string; valor: number; detalhe?: string; tom: string }) {
  return (
    <div className="flex items-center gap-4 rounded-lg border border-borda bg-white p-4 shadow-cartao">
      <span className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full ${tom}`}><Icone className="h-6 w-6" aria-hidden="true" /></span>
      <div className="min-w-0 flex-1">
        <p className="text-rotulo font-semibold text-texto-2">{rotulo}</p>
        <p className="font-display text-[40px] font-bold tracking-tight leading-none text-texto">{valor}</p>
      </div>
      {detalhe && <p className="shrink-0 text-right text-rotulo text-texto-3">{detalhe}</p>}
    </div>
  )
}

// Visão geral de toda a operação: as tarefas de todas as áreas, agrupadas por etapa (a fazer, em andamento, concluído).
export default async function PainelDeGestao({ searchParams }: PageProps<'/painel-de-gestao'>) {
  const eu = await exigirEquipe()
  const sp = await searchParams
  const sb = await criarClienteServidor()
  const filtros = lerFiltros(sp)
  const hoje = dataDeHoje(new Date())
  const [tarefas, equipe, clientes] = await Promise.all([listarTarefas(sb, { todas: true }, filtros, hoje), listarEquipe(sb), listarClientes(sb)])
  const statusPorLista = await statusDasListas(sb, [...new Set(tarefas.map((t) => t.listaId))])
  const categoria = (t: { listaId: string; statusId: string }): Categoria => statusPorLista[t.listaId]?.find((s) => s.id === t.statusId)?.categoria ?? 'todo'
  const arvore = montarArvore(tarefas)
  const emAndamento = arvore.filter((t) => categoria(t) === 'in_progress').length
  const concluidas = arvore.filter((t) => categoria(t) === 'done').length
  const ctx = { equipe, hoje, statusPorLista, mostrarLista: true }
  // Visão geral: o mesmo núcleo (etapa, prazo, conclusão) cortado por departamento e por cliente.
  const raizes = tarefas.filter((t) => !t.paiId)
  const porDepartamento = resumirPor(raizes, (t) => ({ id: t.listaId, nome: t.listaNome }), categoria, hoje)
  const porCliente = resumirPor(raizes, (t) => ({ id: t.clienteId, nome: t.clienteNome }), categoria, hoje)
  const dataExtenso = new Intl.DateTimeFormat('pt-BR', { timeZone: 'America/Belem', weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).format(new Date())

  return (
    <div className="page-shell relatorio">
      <header>
        <p className="text-rotulo text-texto-3">Visão geral</p>
        <h1 className="page-title mt-1">Painel de Gestão</h1>
        <p className="mt-1 text-corpo capitalize text-texto-3">{dataExtenso}</p>
      </header>

      <section aria-label="Indicadores" className="grid gap-3 md:grid-cols-3">
        <Metrica icone={ClipboardList} rotulo="Tarefas no quadro" valor={arvore.length} tom="bg-marca-fundo text-marca" />
        <Metrica icone={Loader} rotulo="Em andamento" valor={emAndamento} detalhe={`${pct(emAndamento, arvore.length)}% do total`} tom="bg-azul-fundo text-azul" />
        <Metrica icone={CircleCheck} rotulo="Concluídas" valor={concluidas} detalhe={`${pct(concluidas, arvore.length)}% do total`} tom="bg-sucesso-fundo text-sucesso" />
      </section>

      <section aria-label="Resumo" className="grid gap-3 lg:grid-cols-2">
        <TabelaResumo titulo="Por departamento" descricao="Onde o trabalho está concentrado" linhas={porDepartamento} href={(l) => `/listas/${l.id}`} />
        <TabelaResumo titulo="Por cliente" descricao="Quanto cada cliente tem em andamento" linhas={porCliente} href={(l) => `/clientes/${l.id}`} clientes />
      </section>

      <div className="space-y-4">
        <AlternadorVisao caminho={CAMINHO} filtros={filtros} />
        <BarraFiltros filtros={filtros} equipe={equipe} status={[]} clientes={clientes} comMes />
        {tarefas.length === 0 ? (
          <EstadoVazio icone={ClipboardList} titulo="Nenhuma tarefa encontrada" descricao="Crie tarefas dentro de Social & Conteúdo ou Tráfego & Performance e elas aparecem aqui." />
        ) : filtros.visao === 'lista' ? (
          <VisaoLista grupos={CATEGORIAS.map((c) => ({ ...c, tarefas: arvore.filter((t) => categoria(t) === c.id) }))} ctx={ctx} euId={eu.id} />
        ) : (
          <VisaoKanban
            modo="categoria"
            colunas={CATEGORIAS}
            tarefas={Object.fromEntries(CATEGORIAS.map((c) => [c.id, arvore.filter((t) => categoria(t) === c.id)]))}
            subtarefas={Object.fromEntries(arvore.map((t) => [t.id, t.filhos.length]))}
            ctx={ctx}
          />
        )}
      </div>
    </div>
  )
}
