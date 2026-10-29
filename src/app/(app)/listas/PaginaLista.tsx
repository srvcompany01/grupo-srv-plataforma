import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ListaConteudoToggle } from '@/componentes/conteudo/ListaConteudoToggle'
import { NovoPostDialog } from '@/componentes/conteudo/NovoPostDialog'
import { CriarTarefaTopo } from '@/componentes/tarefas/AcoesLista'
import { Ic } from '@/componentes/app/Ic'
import { AlternadorVisao } from '@/componentes/tarefas/AlternadorVisao'
import { BarraFiltros } from '@/componentes/tarefas/BarraFiltros'
import { EditorStatus } from '@/componentes/tarefas/EditorStatus'
import { GerenciarCampos } from '@/componentes/tarefas/GerenciarCampos'
import { VisaoDocumentos } from '@/componentes/documentos/VisaoDocumentos'
import { PainelDoEscopo } from '@/componentes/projetos/PainelDoEscopo'
import { ModoEu, PainelVisao } from '@/componentes/tarefas/PainelVisao'
import { VisaoCalendario } from '@/componentes/tarefas/VisaoCalendario'
import { VisaoAtividade } from '@/componentes/tarefas/VisaoAtividade'
import { VisaoCarga } from '@/componentes/tarefas/VisaoCarga'
import { VisaoGaleria } from '@/componentes/tarefas/VisaoGaleria'
import { VisaoLinhaDoTempo } from '@/componentes/tarefas/VisaoLinhaDoTempo'
import { VisaoTabela } from '@/componentes/tarefas/VisaoTabela'
import { VisaoKanban } from '@/componentes/tarefas/VisaoKanban'
import { VisaoLista } from '@/componentes/tarefas/VisaoLista'
import { SalvarVisao } from '@/componentes/tarefas/SalvarVisao'
import { agruparTarefas, TIPOS_AGRUPAVEIS } from '@/dominio/agrupamento'
import { dataDeHoje, escreverFiltros, lerFiltros } from '@/dominio/filtros'
import { iconeDoStatus } from '@/dominio/status-icone'
import { resolverVisao } from '@/dominio/visao-salva'
import { montarArvore } from '@/dominio/tarefas'
import { exigirEquipe } from '@/infra/supabase/sessao'
import { criarClienteServidor } from '@/infra/supabase/servidor'
import { buscarLista, listarTags, tipoDaLista } from '@/servicos/listas'
import { carregarValoresPersonalizados, listarCamposDaLista, listarCamposDoContexto } from '@/servicos/campos-personalizados'
import { CompartilharDialog, EstrelaLista, MenuLista } from '@/componentes/tarefas/CabecalhoListaAcoes'
import { listasFavoritas } from '@/servicos/visoes'
import { listarEspacosComMembros } from '@/servicos/espacos'
import { listarAtividadeDaLista, listarTarefas } from '@/servicos/tarefas'
import { listarDocumentos, listarDocumentosDaLista } from '@/servicos/documentos'
import { listarEquipe } from '@/servicos/usuarios'
import { garantirVisoesIniciais, listarVisoes } from '@/servicos/visoes-lista'
import { AbasDaLista } from '@/componentes/tarefas/AbasDaLista'
import { listarModelos } from '@/servicos/modelos'
import { buscarVisaoSalva, listarFiltrosSalvos } from '@/servicos/visoes'
import { FiltrosSalvos } from '@/componentes/tarefas/FiltrosSalvos'
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
  // Abas da lista (várias do mesmo tipo, cada uma com os seus filtros). Sem a migration, vale o comportamento antigo (abas fixas).
  let abas = await listarVisoes(sb, id)
  if (abas && abas.length === 0) abas = await garantirVisoesIniciais(sb, id, eu.id)
  // Link antigo com ?visao=<tipo> (ex.: Documentos): abre a primeira aba desse tipo.
  const fPedido = lerFiltros(sp)
  const vistaAtual = abas?.find((v) => v.id === fPedido.vista) ?? (sp.visao ? abas?.find((v) => v.tipo === fPedido.visao) : undefined) ?? abas?.[0] ?? null
  const salva = vistaAtual ? vistaAtual.params || null : await buscarVisaoSalva(sb, id).catch(() => null) // sem a migration das visões salvas a lista abre normalmente
  const resolvida = resolverVisao(sp, salva)
  const { spEfetivo } = resolvida
  const modelosDeTarefa = await listarModelos(sb)
  const filtrosSalvos = await listarFiltrosSalvos(sb, id).catch(() => []) // idem: sem a migration, a lista abre sem filtros salvos
  const filtros = vistaAtual ? { ...lerFiltros(spEfetivo), visao: vistaAtual.tipo, vista: vistaAtual.id } : lerFiltros(spEfetivo)
  // Com abas, a aba define o tipo; "alterada" compara a tela com o que a aba guarda (sem o id da aba).
  const comoNaAba = (texto: string) => escreverFiltros({ ...lerFiltros(Object.fromEntries(new URLSearchParams(texto))), visao: vistaAtual?.tipo ?? 'lista', vista: '' }).toString()
  const atual = vistaAtual ? comoNaAba(escreverFiltros(filtros).toString()) : resolvida.atual
  const alterada = vistaAtual ? atual !== comoNaAba(vistaAtual.params) : resolvida.alterada
  const hoje = dataDeHoje(new Date())
  const [tarefasBrutas, equipe, tags, camposDaLista, camposDoEspaco, clientes] = await Promise.all([
    listarTarefas(sb, { listaId: id }, filtros, hoje),
    listarEquipe(sb),
    listarTags(sb, lista.espaco.id),
    listarCamposDaLista(sb, id),
    listarCamposDoContexto(sb, lista.espaco.id),
    listarClientes(sb),
  ])
  const todasAsTarefas = await carregarValoresPersonalizados(sb, tarefasBrutas, camposDaLista)
  // "Ocultar tarefas concluídas" (painel Personalizar visualização) vale para todas as visualizações.
  const tarefas = filtros.semConcluidas ? todasAsTarefas.filter((t) => !t.concluidaEm) : todasAsTarefas
  // Lista de conteúdo: as tarefas-mãe onde os posts nascem como subtarefas.
  const maes = tipo === 'conteudo' ? (await tarefasMaeDeConteudo(sb).catch(() => [])).filter((m) => m.listaId === id) : []
  // "Subtarefas como tarefas principais": só as subtarefas entram, soltas e sem as mães, para olhar os posts de forma unificada
  // (e agrupar por formato, mês etc.). Cada uma guarda o título da mãe de origem.
  const tituloDaMae = new Map(tarefas.map((t) => [t.id, t.titulo]))
  const arvore = filtros.subtarefas === 'planas'
    ? montarArvore(tarefas.filter((t) => t.paiId).map((t) => ({ ...t, paiTitulo: tituloDaMae.get(t.paiId as string), paiId: null })))
    : montarArvore(tarefas)
  const tagsCliente = clientes
    .filter((cliente) => cliente.status !== 'encerrado' || cliente.id === lista.cliente.id)
    .map((cliente) => ({ id: cliente.id, nome: cliente.nome, cor: cliente.cor }))
  const ctx = {
    equipe,
    hoje,
    statusPorLista: { [id]: lista.status },
    mostrarLista: false,
    subtarefasAbertas: filtros.expandidas,
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
  const favorita = (await listasFavoritas(sb).catch(() => [])).some((f) => f.id === id) // sem a migration, a estrela abre apagada
  const membrosDoEspaco = lista.espaco.id ? ((await listarEspacosComMembros(sb).catch(() => [])).find((e) => e.id === lista.espaco.id)?.membros ?? []) : []
  const atividade = filtros.visao === 'atividade' ? await listarAtividadeDaLista(sb, id).catch(() => []) : []
  const nomesAtividade = {
    status: Object.fromEntries(lista.status.map((x) => [x.id, x.nome])),
    usuarios: Object.fromEntries(equipe.map((u) => [u.id, u.nome])),
    tags: Object.fromEntries(tags.map((g) => [g.id, g.nome])),
    campos: Object.fromEntries(camposDaLista.map((c) => [c.id, { nome: c.nome, tipo: c.tipo, configuracao: c.configuracao }])),
  }
  const coresStatus = Object.fromEntries(lista.status.map((item) => [item.id, item.cor]))

  return (
    <div className="flex min-h-full flex-col bg-[var(--bg)]">
      <div className="sticky top-0 z-20 flex shrink-0 items-center gap-2 bg-[var(--bg)]" style={{ height: 40, padding: '0 10px 0 12px', borderBottom: '1px solid var(--border-soft)' }}>
        <nav aria-label="Localização da lista" className="flex min-w-0 flex-1 items-center overflow-hidden" style={{ gap: 2, flexBasis: 160 }}>
          {lista.espaco.id ? (
            <Link href={`/espacos/${lista.espaco.id}`} className="b-ghost hidden md:inline-flex" style={{ height: 24, padding: '0 6px', borderRadius: 4 }}>
              <span style={{ width: 16, height: 16, borderRadius: 4, background: lista.espaco.cor, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Ic n="check_circle" s={12} fill w={500} /></span>
              {lista.espaco.nome}
            </Link>
          ) : (
            <span className="b-ghost hidden md:inline-flex" style={{ height: 24, padding: '0 6px' }}>Itens soltos</span>
          )}
          {lista.pasta && <><span className="hidden text-[13px] text-texto-3 md:inline">/</span><span className="b-ghost hidden md:inline-flex" style={{ height: 24, padding: '0 6px', borderRadius: 4 }}><Ic n="folder" s={16} style={{ color: '#1d6fe0' }} />{lista.pasta.nome}</span></>}
          <span className="hidden text-[13px] text-texto-3 md:inline">/</span>
          <span style={{ width: 16, height: 16, flex: 'none', marginLeft: 6, borderRadius: '50%', background: 'var(--text)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--bg)' }} /></span>
          <h1 className="truncate" style={{ fontWeight: 600, fontSize: 14, padding: '0 4px 0 6px', whiteSpace: 'nowrap' }}>{lista.nome}</h1>
          <EstrelaLista listaId={id} favorita={favorita} />
          <MenuLista listaId={id} nome={lista.nome} podeGerir={lista.podeGerir} />
        </nav>
        <div className="flex shrink-0 items-center gap-1">
          <div className="mr-1 hidden xl:flex">
            {membrosDoEspaco.slice(0, 2).map((m, i) => (
              <span key={m.id} title={m.nome} style={{ width: 22, height: 22, marginLeft: i ? -6 : 0, borderRadius: '50%', background: i ? '#0d9488' : '#d80d12', color: '#fff', fontSize: 9, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 0 2px var(--bg)' }}>{m.nome.split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase()}</span>
            ))}
            {membrosDoEspaco.length > 2 && <span style={{ width: 22, height: 22, marginLeft: -6, borderRadius: '50%', background: 'var(--bg-active)', color: 'var(--text-2)', fontSize: 9, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 0 2px var(--bg)' }}>+{membrosDoEspaco.length - 2}</span>}
          </div>
          <CompartilharDialog nome={lista.nome} membros={membrosDoEspaco} />
          <div className="hidden items-center gap-1 xl:flex">
            {lista.podeGerir && <GerenciarCampos listaId={id} espacoId={lista.espaco.id} camposDaLista={camposDaLista} camposDoEspaco={camposDoEspaco} />}
            {lista.podeGerir && <EditorStatus listaId={id} status={lista.status} />}
            <div style={{ width: 1, height: 16, background: 'var(--border)', margin: '0 6px' }} />
            {lista.podeGerir && <ListaConteudoToggle listaId={id} ligado={tipo === 'conteudo'} />}
          </div>
        </div>
      </div>
      {abas && vistaAtual ? <AbasDaLista listaId={id} caminho={caminho} visoes={abas} atualId={vistaAtual.id} euId={eu.id} podeGerir={lista.podeGerir} /> : <AlternadorVisao caminho={caminho} filtros={filtros} visoes={['lista', 'calendario', 'kanban', 'tabela', 'galeria', 'cronograma', 'carga', 'atividade', 'painel', 'documentos']} abas />}
      {filtros.visao !== 'documentos' && filtros.visao !== 'painel' && (
      <div className="flex shrink-0 items-center gap-1" style={{ height: 44, padding: '0 10px 0 12px', color: 'var(--text-2)' }}>
        <div className="flex min-w-0 flex-1 items-center gap-1 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
          <BarraFiltros filtros={filtros} equipe={equipe} status={lista.status} tags={tags} comAgrupamento={filtros.visao === 'lista'} camposAgrupaveis={camposAgrupaveis.map((campo) => ({ id: campo.id, nome: campo.nome }))} />
          <FiltrosSalvos listaId={id} filtros={filtros} salvos={filtrosSalvos} />
          <ModoEu caminho={caminho} filtros={filtros} euId={eu.id} />
          <PainelVisao caminho={caminho} filtros={filtros} euId={eu.id} camposAgrupaveis={camposAgrupaveis.map((c) => ({ id: c.id, nome: c.nome }))} />
          <SalvarVisao listaId={id} caminho={caminho} params={atual} alterada={alterada} temSalva={vistaAtual ? vistaAtual.params !== '' : salva !== null} vistaId={vistaAtual?.id} />
          {tipo === 'conteudo' && (<><div style={{ width: 1, height: 16, background: 'var(--border)', margin: '0 4px', flex: 'none' }} /><NovoPostDialog listaId={id} clientes={tagsCliente.map((c) => ({ id: c.id, nome: c.nome }))} maes={maes} /></>)}
          <div className="ml-0.5 flex shrink-0"><CriarTarefaTopo listaId={id} euId={eu.id} status={lista.status} modelos={modelosDeTarefa} /></div>
        </div>
      </div>
      )}
      <main className="min-h-0 flex-1 p-0" style={{ borderTop: '1px solid var(--border-soft)' }}>
        {filtros.visao === 'lista' && <VisaoLista grupos={grupos} ctx={ctx} criarEm={agrupamento === 'status' || agrupamento === 'nenhum' ? id : undefined} euId={eu.id} chaveLarguras={`lista:${id}`} />}
        {filtros.visao === 'calendario' && <VisaoCalendario tarefas={tarefas} hoje={hoje} mesInicial={lista.mes} coresStatus={coresStatus} caminho={caminho} filtros={filtros} campos={camposDaLista} equipe={equipe} />}
        {filtros.visao === 'tabela' && <VisaoTabela tarefas={arvore} ctx={ctx} />}
        {filtros.visao === 'galeria' && <VisaoGaleria grupos={grupos} ctx={ctx} />}
        {filtros.visao === 'cronograma' && <VisaoLinhaDoTempo tarefas={arvore} ctx={ctx} />}
        {filtros.visao === 'carga' && <VisaoCarga tarefas={tarefas} hoje={hoje} />}
        {filtros.visao === 'atividade' && <VisaoAtividade itens={atividade} nomes={nomesAtividade} />}
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
