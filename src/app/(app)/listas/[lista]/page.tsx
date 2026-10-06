import { notFound } from 'next/navigation'
import { AlternadorVisao } from '@/componentes/tarefas/AlternadorVisao'
import { BarraFiltros } from '@/componentes/tarefas/BarraFiltros'
import { EditorStatus } from '@/componentes/tarefas/EditorStatus'
import { VisaoKanban } from '@/componentes/tarefas/VisaoKanban'
import { VisaoLista } from '@/componentes/tarefas/VisaoLista'
import { dataDeHoje, lerFiltros } from '@/dominio/filtros'
import { rotuloMes } from '@/dominio/formatar'
import { agruparPorStatus, montarArvore } from '@/dominio/tarefas'
import { exigirEquipe } from '@/infra/supabase/sessao'
import { criarClienteServidor } from '@/infra/supabase/servidor'
import { buscarLista, listarTags } from '@/servicos/listas'
import { listarTarefas } from '@/servicos/tarefas'
import { listarEquipe } from '@/servicos/usuarios'

export default async function PaginaLista({ params, searchParams }: PageProps<'/listas/[lista]'>) {
  const { lista: id } = await params
  const eu = await exigirEquipe()
  const sb = await criarClienteServidor()
  const lista = await buscarLista(sb, id)
  if (!lista) notFound()

  const filtros = lerFiltros(await searchParams)
  const hoje = dataDeHoje(new Date())
  const [tarefas, equipe, tags] = await Promise.all([
    listarTarefas(sb, { listaId: id }, filtros, hoje),
    listarEquipe(sb),
    listarTags(sb, lista.espaco.id),
  ])
  const arvore = montarArvore(tarefas)
  const ctx = { equipe, hoje, statusPorLista: { [id]: lista.status }, mostrarLista: false }

  return (
    <div className="space-y-4 p-4 md:p-6">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[12px] text-texto-3">{lista.espaco.nome}</p>
          <h1 className="text-lg font-semibold">{lista.nome}</h1>
          <p className="text-[13px] text-texto-2">
            {lista.cliente.nome}
            {lista.mes && ` · ${rotuloMes(lista.mes)}`}
          </p>
        </div>
        {lista.podeGerir && <EditorStatus listaId={id} status={lista.status} />}
      </header>
      <AlternadorVisao caminho={`/listas/${id}`} filtros={filtros} />
      <BarraFiltros filtros={filtros} equipe={equipe} status={lista.status} tags={tags} />
      {filtros.visao === 'lista' && (
        <VisaoLista
          grupos={agruparPorStatus(arvore, lista.status).map((g) => ({ id: g.status.id, nome: g.status.nome, cor: g.status.cor, tarefas: g.tarefas, statusId: g.status.id }))}
          ctx={ctx}
          criarEm={id}
          euId={eu.id}
        />
      )}
      {filtros.visao === 'kanban' && (
        <VisaoKanban
          modo="status"
          colunas={lista.status.map((s) => ({ id: s.id, nome: s.nome, cor: s.cor }))}
          tarefas={Object.fromEntries(lista.status.map((s) => [s.id, arvore.filter((t) => t.statusId === s.id)]))}
          subtarefas={Object.fromEntries(arvore.map((t) => [t.id, t.filhos.length]))}
          ctx={ctx}
        />
      )}
    </div>
  )
}
