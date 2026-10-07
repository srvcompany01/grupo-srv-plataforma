import { ChevronRight } from 'lucide-react'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { IconeVisual } from '@/componentes/IconeVisual'
import { CompartilharLista, CriarTarefaTopo } from '@/componentes/tarefas/AcoesLista'
import { AlternadorVisao } from '@/componentes/tarefas/AlternadorVisao'
import { BarraFiltros } from '@/componentes/tarefas/BarraFiltros'
import { EditorStatus } from '@/componentes/tarefas/EditorStatus'
import { GerenciarCampos } from '@/componentes/tarefas/GerenciarCampos'
import { VisaoCalendario } from '@/componentes/tarefas/VisaoCalendario'
import { VisaoKanban } from '@/componentes/tarefas/VisaoKanban'
import { VisaoLista } from '@/componentes/tarefas/VisaoLista'
import { agruparTarefas, TIPOS_AGRUPAVEIS } from '@/dominio/agrupamento'
import { dataDeHoje, lerFiltros } from '@/dominio/filtros'
import { rotuloMes } from '@/dominio/formatar'
import { montarArvore } from '@/dominio/tarefas'
import { exigirEquipe } from '@/infra/supabase/sessao'
import { criarClienteServidor } from '@/infra/supabase/servidor'
import { buscarLista, listarTags } from '@/servicos/listas'
import { carregarValoresPersonalizados, listarCamposDaLista, listarCamposDoContexto } from '@/servicos/campos-personalizados'
import { listarTarefas } from '@/servicos/tarefas'
import { listarEquipe } from '@/servicos/usuarios'
import { listarClientes } from '@/servicos/clientes-plataforma'

export default async function PaginaLista({ params, searchParams }: PageProps<'/listas/[lista]'>) {
  const { lista: id } = await params
  const eu = await exigirEquipe()
  const sb = await criarClienteServidor()
  const lista = await buscarLista(sb, id)
  if (!lista) notFound()

  const filtros = lerFiltros(await searchParams)
  const hoje = dataDeHoje(new Date())
  const [tarefasBrutas, equipe, tags, camposDaLista, camposDoEspaco, clientes] = await Promise.all([
    listarTarefas(sb, { listaId: id }, filtros, hoje),
    listarEquipe(sb),
    listarTags(sb, lista.espaco.id),
    listarCamposDaLista(sb, id),
    listarCamposDoContexto(sb, lista.espaco.id),
    listarClientes(sb),
  ])
  const tarefas = await carregarValoresPersonalizados(sb, tarefasBrutas, camposDaLista)
  const arvore = montarArvore(tarefas)
  const tagsCliente = clientes
    .filter((cliente) => cliente.status !== 'encerrado' || cliente.id === lista.cliente.id)
    .map((cliente) => ({ id: cliente.id, nome: cliente.nome, cor: cliente.cor }))
  const ctx = {
    equipe,
    hoje,
    statusPorLista: { [id]: lista.status },
    mostrarLista: false,
    camposPersonalizados: camposDaLista,
    tagsCliente,
    podeGerirTagCliente: lista.podeGerir,
    podeEditarCampos: eu.papel === 'admin',
    gerirCampos: lista.podeGerir ? { listaId: id, espacoId: lista.espaco.id, camposDaLista, camposDoEspaco } : undefined,
  }
  const camposAgrupaveis = camposDaLista.filter((campo) => TIPOS_AGRUPAVEIS.includes(campo.tipo))
  // Agrupar por um campo que saiu da lista (URL antiga) volta para status.
  const agrupamento = filtros.agrupamento.startsWith('campo:') && !camposAgrupaveis.some((campo) => `campo:${campo.id}` === filtros.agrupamento) ? 'status' : filtros.agrupamento
  const grupos = agruparTarefas(arvore, agrupamento, { status: lista.status, campos: camposAgrupaveis, equipe })
  const coresStatus = Object.fromEntries(lista.status.map((item) => [item.id, item.cor]))

  return (
    <div className="min-h-full bg-white">
      <header className="border-b border-borda bg-white">
        <div
          className="flex min-h-14 flex-wrap items-center justify-between gap-3 px-4 py-2.5 md:px-5"
          style={{ background: `linear-gradient(100deg, ${lista.espaco.cor}12, #fffcf8 42%, ${lista.cor}0d)` }}
        >
          <div className="min-w-0">
            <nav className="flex min-w-0 items-center gap-1.5 text-rotulo text-texto-2" aria-label="Localização da lista">
              {lista.espaco.id ? (
                <Link href={`/espacos/${lista.espaco.id}`} className="flex min-w-0 items-center gap-1.5 rounded-md px-1 py-1 hover:bg-white/80 hover:text-texto">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-[5px] text-white" style={{ background: lista.espaco.cor }}><IconeVisual icone={lista.espaco.icone} emoji={lista.espaco.emoji} className="h-3 w-3" /></span>
                  <span className="truncate">{lista.espaco.nome}</span>
                </Link>
              ) : (
                <span className="flex items-center gap-1.5"><span className="flex h-5 w-5 items-center justify-center rounded-[5px] bg-marca text-white"><IconeVisual icone="layers-3" className="h-3 w-3" /></span>Itens soltos</span>
              )}
              {lista.pasta && <><ChevronRight className="h-3.5 w-3.5 shrink-0 text-texto-3" /><span className="flex min-w-0 items-center gap-1.5"><span style={{ color: lista.pasta.cor }}><IconeVisual icone={lista.pasta.icone} emoji={lista.pasta.emoji} className="h-4 w-4" /></span><span className="truncate">{lista.pasta.nome}</span></span></>}
              <ChevronRight className="h-3.5 w-3.5 shrink-0 text-texto-3" />
              <h1 className="flex min-w-0 items-center gap-1.5 font-bold text-texto"><span style={{ color: lista.cor }}><IconeVisual icone={lista.icone} emoji={lista.emoji} className="h-4 w-4" /></span><span className="truncate">{lista.nome}</span></h1>
            </nav>
            <div className="mt-1 flex flex-wrap items-center gap-1.5 pl-1 text-legenda">
              <span className="inline-flex items-center gap-1 rounded-full border px-2 py-0.5 font-semibold" style={{ color: lista.cliente.cor, borderColor: `${lista.cliente.cor}50`, backgroundColor: `${lista.cliente.cor}12` }}><span>#</span>{lista.cliente.nome}</span>
              {lista.mes && <span className="rounded-full bg-aviso-fundo px-2 py-0.5 font-medium text-aviso-forte">{rotuloMes(lista.mes)}</span>}
            </div>
          </div>
          <div className="flex flex-wrap items-center justify-end gap-1.5">
            <CompartilharLista nome={lista.nome} />
            {lista.podeGerir && <GerenciarCampos listaId={id} espacoId={lista.espaco.id} camposDaLista={camposDaLista} camposDoEspaco={camposDoEspaco} />}
            {lista.podeGerir && <EditorStatus listaId={id} status={lista.status} />}
          </div>
        </div>
        <AlternadorVisao caminho={`/listas/${id}`} filtros={filtros} visoes={['lista', 'calendario', 'kanban']} abas />
      </header>
      <div className="flex flex-wrap items-center gap-2 border-b border-borda bg-fundo/45 px-4 py-2.5 md:px-5">
        <div className="min-w-0 flex-1"><BarraFiltros filtros={filtros} equipe={equipe} status={lista.status} tags={tags} comAgrupamento={filtros.visao === 'lista'} camposAgrupaveis={camposAgrupaveis.map((campo) => ({ id: campo.id, nome: campo.nome }))} /></div>
        <CriarTarefaTopo listaId={id} euId={eu.id} status={lista.status} />
      </div>
      <main className="p-4 md:p-5">
        {filtros.visao === 'lista' && <VisaoLista grupos={grupos} ctx={ctx} criarEm={agrupamento === 'status' || agrupamento === 'nenhum' ? id : undefined} euId={eu.id} chaveLarguras={`lista:${id}`} />}
        {filtros.visao === 'calendario' && <VisaoCalendario tarefas={tarefas} hoje={hoje} mesInicial={lista.mes} coresStatus={coresStatus} />}
        {filtros.visao === 'kanban' && (
          <VisaoKanban
            modo="status"
            colunas={lista.status.map((s) => ({ id: s.id, nome: s.nome, cor: s.cor }))}
            tarefas={Object.fromEntries(lista.status.map((s) => [s.id, arvore.filter((t) => t.statusId === s.id)]))}
            subtarefas={Object.fromEntries(arvore.map((t) => [t.id, t.filhos.length]))}
            ctx={ctx}
          />
        )}
      </main>
    </div>
  )
}
