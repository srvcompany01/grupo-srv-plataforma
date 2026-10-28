import { ChevronRight } from 'lucide-react'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { IconeVisual } from '@/componentes/IconeVisual'
import { ListaConteudoToggle } from '@/componentes/conteudo/ListaConteudoToggle'
import { NovoPostDialog } from '@/componentes/conteudo/NovoPostDialog'
import { CompartilharLista, CriarTarefaTopo } from '@/componentes/tarefas/AcoesLista'
import { AlternadorVisao } from '@/componentes/tarefas/AlternadorVisao'
import { BarraFiltros } from '@/componentes/tarefas/BarraFiltros'
import { EditorStatus } from '@/componentes/tarefas/EditorStatus'
import { GerenciarCampos } from '@/componentes/tarefas/GerenciarCampos'
import { VisaoDocumentos } from '@/componentes/documentos/VisaoDocumentos'
import { PainelDoEscopo } from '@/componentes/projetos/PainelDoEscopo'
import { VisaoCalendario } from '@/componentes/tarefas/VisaoCalendario'
import { VisaoKanban } from '@/componentes/tarefas/VisaoKanban'
import { VisaoLista } from '@/componentes/tarefas/VisaoLista'
import { SalvarVisao } from '@/componentes/tarefas/SalvarVisao'
import { agruparTarefas, TIPOS_AGRUPAVEIS } from '@/dominio/agrupamento'
import { dataDeHoje, lerFiltros } from '@/dominio/filtros'
import { rotuloMes } from '@/dominio/formatar'
import { iconeDoStatus } from '@/dominio/status-icone'
import { resolverVisao } from '@/dominio/visao-salva'
import { montarArvore } from '@/dominio/tarefas'
import { exigirEquipe } from '@/infra/supabase/sessao'
import { criarClienteServidor } from '@/infra/supabase/servidor'
import { buscarLista, listarTags, tipoDaLista } from '@/servicos/listas'
import { carregarValoresPersonalizados, listarCamposDaLista, listarCamposDoContexto } from '@/servicos/campos-personalizados'
import { listarTarefas } from '@/servicos/tarefas'
import { listarDocumentos, listarDocumentosDaLista } from '@/servicos/documentos'
import { listarEquipe } from '@/servicos/usuarios'
import { buscarVisaoSalva } from '@/servicos/visoes'
import { listarClientes } from '@/servicos/clientes-plataforma'
import { tarefasMaeDeConteudo } from '@/servicos/conteudo'

/** Tela de uma lista. `caminho` é a rota pública dela (`/listas/<id>` ou a rota fixa da área). `rotuloPainel` nomeia as linhas do Painel. */
export async function PaginaLista({ id, caminho, sp, rotuloPainel }: { id: string; caminho: string; sp: Record<string, string | string[] | undefined>; rotuloPainel?: string }) {
  const eu = await exigirEquipe()
  const sb = await criarClienteServidor()
  const lista = await buscarLista(sb, id)
  if (!lista) notFound()
  const tipo = await tipoDaLista(sb, id)

  // Sem nada escolhido na URL, a lista abre como a pessoa salvou (ou no original). Qualquer escolha na tela vale como está.
  const salva = await buscarVisaoSalva(sb, id).catch(() => null) // sem a migration das visões salvas a lista abre normalmente
  const { spEfetivo, atual, alterada } = resolverVisao(sp, salva)
  const filtros = lerFiltros(spEfetivo)
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
  // Lista de conteúdo: as tarefas-mãe onde os posts nascem como subtarefas.
  const maes = tipo === 'conteudo' ? (await tarefasMaeDeConteudo(sb).catch(() => [])).filter((m) => m.listaId === id) : []
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
  // Documentos só são buscados na visualização que os mostra (e a lista abre normalmente sem a migration de documentos).
  const [documentosDaLista, todosDocumentos] = filtros.visao === 'documentos'
    ? await Promise.all([listarDocumentosDaLista(sb, id), listarDocumentos(sb)]).catch(() => [[], []] as [Awaited<ReturnType<typeof listarDocumentosDaLista>>, Awaited<ReturnType<typeof listarDocumentos>>])
    : [[], []]
  const coresStatus = Object.fromEntries(lista.status.map((item) => [item.id, item.cor]))

  return (
    <div className="min-h-full bg-white">
      <header className="border-b border-borda bg-white">
        <div
          className="flex min-h-10 flex-wrap items-center justify-between gap-3 px-4 py-1 md:px-5"
        >
          <div className="min-w-0">
            <nav className="flex min-w-0 items-center gap-1.5 text-rotulo text-texto-2" aria-label="Localização da lista">
              {lista.espaco.id ? (
                <Link href={`/espacos/${lista.espaco.id}`} className="flex min-w-0 items-center gap-1.5 rounded-md px-1 py-1 hover:bg-white/80 hover:text-texto">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-[5px] text-claro" style={{ background: lista.espaco.cor }}><IconeVisual icone={lista.espaco.icone} emoji={lista.espaco.emoji} className="h-3 w-3" /></span>
                  <span className="truncate">{lista.espaco.nome}</span>
                </Link>
              ) : (
                <span className="flex items-center gap-1.5"><span className="flex h-5 w-5 items-center justify-center rounded-[5px] bg-marca text-claro"><IconeVisual icone="layers-3" className="h-3 w-3" /></span>Itens soltos</span>
              )}
              {lista.pasta && <><ChevronRight className="h-3.5 w-3.5 shrink-0 text-texto-3" /><span className="flex min-w-0 items-center gap-1.5"><span style={{ color: lista.pasta.cor }}><IconeVisual icone={lista.pasta.icone} emoji={lista.pasta.emoji} className="h-4 w-4" /></span><span className="truncate">{lista.pasta.nome}</span></span></>}
              <ChevronRight className="h-3.5 w-3.5 shrink-0 text-texto-3" />
              <h1 className="flex min-w-0 items-center gap-1.5 font-bold text-texto"><span style={{ color: lista.cor }}><IconeVisual icone={lista.icone} emoji={lista.emoji} className="h-4 w-4" /></span><span className="truncate">{lista.nome}</span></h1>
            </nav>
            {lista.mes && (
              <div className="mt-1 flex flex-wrap items-center gap-1.5 pl-1 text-legenda">
                <span className="rounded-full bg-aviso-fundo px-2 py-0.5 font-medium text-aviso-forte">{rotuloMes(lista.mes)}</span>
              </div>
            )}
          </div>
          <div className="flex flex-wrap items-center justify-end gap-1.5">
            <CompartilharLista nome={lista.nome} />
            {lista.podeGerir && <GerenciarCampos listaId={id} espacoId={lista.espaco.id} camposDaLista={camposDaLista} camposDoEspaco={camposDoEspaco} />}
            {lista.podeGerir && <EditorStatus listaId={id} status={lista.status} />}
            {lista.podeGerir && <ListaConteudoToggle listaId={id} ligado={tipo === 'conteudo'} />}
          </div>
        </div>
        <AlternadorVisao caminho={caminho} filtros={filtros} visoes={['lista', 'calendario', 'kanban', 'painel', 'documentos']} abas />
      </header>
      {filtros.visao !== 'documentos' && filtros.visao !== 'painel' && (
      <div className="flex flex-wrap items-center gap-2 border-b border-borda bg-fundo/45 px-4 py-2.5 md:px-5">
        <div className="min-w-0 flex-1"><BarraFiltros filtros={filtros} equipe={equipe} status={lista.status} tags={tags} comAgrupamento={filtros.visao === 'lista'} camposAgrupaveis={camposAgrupaveis.map((campo) => ({ id: campo.id, nome: campo.nome }))} /></div>
        <SalvarVisao listaId={id} caminho={caminho} params={atual} alterada={alterada} temSalva={salva !== null} />
        {tipo === 'conteudo' && <NovoPostDialog listaId={id} clientes={tagsCliente.map((c) => ({ id: c.id, nome: c.nome }))} maes={maes} />}
        <CriarTarefaTopo listaId={id} euId={eu.id} status={lista.status} />
      </div>
      )}
      <main className="p-4 md:p-5">
        {filtros.visao === 'lista' && <VisaoLista grupos={grupos} ctx={ctx} criarEm={agrupamento === 'status' || agrupamento === 'nenhum' ? id : undefined} euId={eu.id} chaveLarguras={`lista:${id}`} />}
        {filtros.visao === 'calendario' && <VisaoCalendario tarefas={tarefas} hoje={hoje} mesInicial={lista.mes} coresStatus={coresStatus} caminho={caminho} filtros={filtros} campos={camposDaLista} equipe={equipe} />}
        {filtros.visao === 'painel' && <PainelDoEscopo escopo={{ listaId: id, cor: lista.cor }} caminho={caminho} sp={spEfetivo} euId={eu.id} rotulo={rotuloPainel} />}
        {filtros.visao === 'documentos' && (
          <VisaoDocumentos
            listaId={id}
            docs={documentosDaLista}
            candidatos={todosDocumentos.filter((d) => !d.arquivadoEm && !documentosDaLista.some((x) => x.id === d.id)).map((d) => ({ id: d.id, titulo: d.titulo, donoNome: d.donoNome }))}
            clientes={tagsCliente.map((c) => ({ id: c.id, nome: c.nome }))}
            clienteDaLista={lista.cliente.id || null}
          />
        )}
        {filtros.visao === 'kanban' && (
          <VisaoKanban
            modo="status"
            colunas={lista.status.map((s) => ({ id: s.id, nome: s.nome, cor: s.cor, icone: iconeDoStatus(lista.status, s.id) }))}
            tarefas={Object.fromEntries(lista.status.map((s) => [s.id, arvore.filter((t) => t.statusId === s.id)]))}
            subtarefas={Object.fromEntries(arvore.map((t) => [t.id, t.filhos.length]))}
            ctx={ctx}
          />
        )}
      </main>
    </div>
  )
}
