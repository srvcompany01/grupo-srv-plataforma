import Link from 'next/link'
import { notFound } from 'next/navigation'
import { AlternadorVisao } from '@/componentes/tarefas/AlternadorVisao'
import { BarraFiltros } from '@/componentes/tarefas/BarraFiltros'
import { CATEGORIAS } from '@/componentes/tarefas/categorias'
import { VisaoKanban } from '@/componentes/tarefas/VisaoKanban'
import { VisaoLista } from '@/componentes/tarefas/VisaoLista'
import { dataDeHoje, lerFiltros } from '@/dominio/filtros'
import { montarArvore, type Categoria } from '@/dominio/tarefas'
import { exigirEquipe } from '@/infra/supabase/sessao'
import { criarClienteServidor } from '@/infra/supabase/servidor'
import { listarClientes } from '@/servicos/clientes-plataforma'
import { listarEspacosComMembros } from '@/servicos/espacos'
import { buscarEstrutura } from '@/servicos/estrutura'
import { listarTags, statusDasListas } from '@/servicos/listas'
import { listarTarefas } from '@/servicos/tarefas'
import { listarEquipe } from '@/servicos/usuarios'
import { MembrosEspaco } from '../config/espacos/Espacos'
import { Estrutura } from './[espaco]/Estrutura'
import { IconeVisual } from '@/componentes/IconeVisual'

type Aba = 'tarefas' | 'estrutura' | 'membros'

/** Conteúdo de uma área fixa (espaço). `caminho` é a rota pública dela, usada nas abas e visões. */
export async function PaginaArea({ id, caminho, sp }: { id: string; caminho: string; sp: Record<string, string | string[] | undefined> }) {
  const eu = await exigirEquipe()
  const sb = await criarClienteServidor()
  const [{ data: espaco }, { data: podeGerir }, { count: filhos }] = await Promise.all([
    sb.from('spaces').select('id, name, description, color, icon, emoji').eq('id', id).is('archived_at', null).maybeSingle(),
    sb.rpc('is_space_manager', { space: id }),
    sb.from('spaces').select('id', { count: 'exact', head: true }).eq('parent_id', id),
  ])
  if (!espaco) notFound()
  const folha = !filhos
  const aba: Aba = podeGerir && (sp.aba === 'estrutura' || sp.aba === 'membros') ? sp.aba : 'tarefas'
  const abas: [Aba, string][] = [['tarefas', 'Tarefas'], ...(podeGerir ? ([...(folha ? [['estrutura', 'Pastas e listas']] : []), ['membros', 'Membros']] as [Aba, string][]) : [])]

  return (
    <div className="page-shell">
      <header className="flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl text-white ring-4 ring-fundo" style={{ background: espaco.color }}><IconeVisual icone={espaco.icon} emoji={espaco.emoji} className="h-5 w-5" /></span>
        <div>
          <p className="eyebrow">Área</p>
          <h1 className="page-title mt-1">{espaco.name}</h1>
          {espaco.description && <p className="mt-1 text-corpo text-texto-2">{espaco.description}</p>}
        </div>
      </header>
      {abas.length > 1 && (
        <nav className="flex gap-6 border-b border-borda">
          {abas.map(([a, rotulo]) => (
            <Link
              key={a}
              href={a === 'tarefas' ? caminho : `${caminho}?aba=${a}`}
              className={`-mb-px border-b-2 pb-2.5 text-corpo font-semibold ${aba === a ? 'border-texto text-texto' : 'border-transparent text-texto-2 hover:text-texto'}`}
            >
              {rotulo}
            </Link>
          ))}
        </nav>
      )}
      {aba === 'tarefas' && <Tarefas espacoId={id} caminho={caminho} sp={sp} euId={eu.id} />}
      {aba === 'estrutura' && <AbaEstrutura espacoId={id} />}
      {aba === 'membros' && <AbaMembros espacoId={id} podePromover={eu.papel === 'admin'} />}
    </div>
  )
}

async function Tarefas({ espacoId, caminho, sp, euId }: { espacoId: string; caminho: string; sp: Record<string, string | string[] | undefined>; euId: string }) {
  const sb = await criarClienteServidor()
  const filtros = lerFiltros(sp)
  const hoje = dataDeHoje(new Date())
  const [tarefas, equipe, clientes, tags] = await Promise.all([
    listarTarefas(sb, { espacoId }, filtros, hoje),
    listarEquipe(sb),
    listarClientes(sb),
    listarTags(sb, espacoId),
  ])
  const statusPorLista = await statusDasListas(sb, [...new Set(tarefas.map((t) => t.listaId))])
  const categoria = (t: { listaId: string; statusId: string }): Categoria =>
    statusPorLista[t.listaId]?.find((s) => s.id === t.statusId)?.categoria ?? 'todo'
  const arvore = montarArvore(tarefas)
  const ctx = { equipe, hoje, statusPorLista, mostrarLista: true }

  return (
    <div className="space-y-4">
      <AlternadorVisao caminho={caminho} filtros={filtros} />
      <BarraFiltros filtros={filtros} equipe={equipe} status={[]} tags={tags} clientes={clientes} comMes />
      {tarefas.length === 0 && <p className="text-corpo text-texto-3">Nenhuma tarefa encontrada.</p>}
      {filtros.visao === 'lista' ? (
        <VisaoLista grupos={CATEGORIAS.map((c) => ({ ...c, tarefas: arvore.filter((t) => categoria(t) === c.id) }))} ctx={ctx} euId={euId} />
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
  )
}

async function AbaEstrutura({ espacoId }: { espacoId: string }) {
  const sb = await criarClienteServidor()
  const [dados, clientes] = await Promise.all([buscarEstrutura(sb, espacoId), listarClientes(sb)])
  return <Estrutura espacoId={espacoId} dados={dados} clientes={clientes.filter((c) => c.status !== 'encerrado').map((c) => ({ id: c.id, nome: c.nome }))} />
}

async function AbaMembros({ espacoId, podePromover }: { espacoId: string; podePromover: boolean }) {
  const sb = await criarClienteServidor()
  const [espacos, equipe] = await Promise.all([listarEspacosComMembros(sb), listarEquipe(sb)])
  const espaco = espacos.find((e) => e.id === espacoId)
  if (!espaco) notFound()
  return (
    <div className="rounded-xl border border-borda bg-white p-5">
      <MembrosEspaco espaco={espaco} equipe={equipe} podePromover={podePromover} />
    </div>
  )
}
