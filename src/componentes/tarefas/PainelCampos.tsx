'use client'

import { DndContext, PointerSensor, closestCenter, useSensor, useSensors, type DragEndEvent } from '@dnd-kit/core'
import { SortableContext, arrayMove, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import Link from 'next/link'
import { useEffect, useId, useMemo, useState, useTransition } from 'react'
import { adicionarCampoExistente, criarCampoPersonalizado } from '@/app/(app)/acoes-campos'
import { Ic } from '@/componentes/app/Ic'
import { IconeVisual } from '@/componentes/IconeVisual'
import { configuracaoPadrao, type ConfigCampo, type DefinicaoCampo, type ItemCatalogoCampo } from '@/dominio/personalizacao'
import { botaoPrimario, botaoSecundario, campo, rotulo } from '@/lib/ui'
import { AparenciaCampo } from './AparenciaCampo'
import { avisar } from './avisar'
import { Catalogo, ConfiguracaoCampo } from './GerenciarCampos'

/** Propriedades que toda tarefa tem. `ms` = ícone Material; `pronta` = já existe como coluna na lista. */
const PROPRIEDADES: { id: string; nome: string; ms: string; pronta: boolean }[] = [
  { id: 'comentarios', nome: 'Comentários', ms: 'chat_bubble_outline', pronta: true },
  { id: 'comentarios_atribuidos', nome: 'Comentários atribuídos', ms: 'forum', pronta: false },
  { id: 'criado_por', nome: 'Criado por', ms: 'person', pronta: true },
  { id: 'data_criada', nome: 'Data criada', ms: 'event', pronta: true },
  { id: 'data_atualizacao', nome: 'Data de atualização', ms: 'event', pronta: true },
  { id: 'data_conclusao', nome: 'Data de conclusão', ms: 'event_available', pronta: true },
  { id: 'data_encerramento', nome: 'Data de encerramento', ms: 'event_busy', pronta: false },
  { id: 'prazo', nome: 'Data de vencimento', ms: 'event', pronta: true },
  { id: 'data_inicial', nome: 'Data inicial', ms: 'event', pronta: true },
  { id: 'dependencias', nome: 'Dependências', ms: 'account_tree', pronta: false },
  { id: 'documentos_vinculados', nome: 'Documentos vinculados', ms: 'description', pronta: false },
  { id: 'estimativa', nome: 'Estimativa de tempo', ms: 'hourglass_empty', pronta: true },
  { id: 'etiquetas', nome: 'Etiquetas', ms: 'sell', pronta: true },
  { id: 'id_tarefa', nome: 'ID da tarefa', ms: 'badge', pronta: true },
  { id: 'ids_personalizados', nome: 'IDs da tarefa personalizada', ms: 'badge', pronta: false },
  { id: 'linha_tempo', nome: 'Linha do tempo', ms: 'date_range', pronta: true },
  { id: 'lista', nome: 'Listas', ms: 'format_list_bulleted', pronta: true },
  { id: 'prioridade', nome: 'Prioridade', ms: 'flag', pronta: true },
  { id: 'responsavel', nome: 'Responsável', ms: 'person', pronta: true },
  { id: 'status', nome: 'Status', ms: 'adjust', pronta: true },
  { id: 'solicitacoes_pull', nome: 'Solicitações Pull', ms: 'merge_type', pronta: false },
  { id: 'sprints', nome: 'Sprints', ms: 'play_circle', pronta: false },
  { id: 'tarefas_vinculadas', nome: 'Tarefas vinculadas', ms: 'task_alt', pronta: false },
  { id: 'tagcliente', nome: 'Cliente', ms: 'storefront', pronta: true },
  { id: 'tempo_rastreado', nome: 'Tempo rastreado', ms: 'timer', pronta: true },
  { id: 'tipo_tarefa', nome: 'Tipo de tarefa', ms: 'deployed_code', pronta: false },
  { id: 'ultimos_comentarios', nome: 'Últimos comentários', ms: 'chat_bubble_outline', pronta: false },
]
const PROP = new Map(PROPRIEDADES.map((p) => [p.id, p]))
const norm = (t: string) => t.toLocaleLowerCase('pt-BR').normalize('NFD').replace(/[̀-ͯ]/g, '')

function Toggle({ ligado, aoAlternar, desabilitado = false, rotuloA11y }: { ligado: boolean; aoAlternar: () => void; desabilitado?: boolean; rotuloA11y: string }) {
  return (
    <button type="button" role="switch" aria-checked={ligado} aria-label={rotuloA11y} disabled={desabilitado} onClick={aoAlternar} style={{ width: 36, height: 20, flex: 'none', borderRadius: 10, border: 0, padding: 0, position: 'relative', cursor: desabilitado ? 'not-allowed' : 'pointer', opacity: desabilitado ? 0.5 : 1, background: ligado ? 'var(--primary)' : 'var(--border-strong)', transition: 'background 150ms' }}>
      <span style={{ position: 'absolute', top: 2, left: ligado ? 18 : 2, width: 16, height: 16, borderRadius: '50%', background: 'var(--bg)', transition: 'left 150ms' }} />
    </button>
  )
}

function Secao({ titulo, total, aberta, aoAlternar }: { titulo: string; total: number; aberta: boolean; aoAlternar: () => void }) {
  return (
    <button type="button" onClick={aoAlternar} className="flex h-9 w-full items-center gap-1 px-4 text-left text-[13px] text-texto-3 hover:text-texto-2">
      <span>{titulo}</span><Ic n={aberta ? 'arrow_drop_down' : 'arrow_right'} s={18} /><span className="flex-1" /><span>{total}</span>
    </button>
  )
}

type Linha = { id: string; nome: string; icone: React.ReactNode; campoId?: string; travada?: boolean }

function LinhaMostrada({ linha, aoAlternar, aoConfigurar }: { linha: Linha; aoAlternar: () => void; aoConfigurar?: () => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: linha.id, disabled: linha.travada })
  return (
    <div ref={setNodeRef} style={{ transform: CSS.Translate.toString(transform), transition, opacity: isDragging ? 0.6 : 1 }} className="group mx-2 flex h-9 items-center gap-2 rounded px-2 hover:bg-[var(--bg-hover)]">
      <span {...(linha.travada ? {} : attributes)} {...(linha.travada ? {} : listeners)} className={`flex w-4 shrink-0 justify-center text-texto-3 ${linha.travada ? 'invisible' : 'cursor-grab opacity-0 group-hover:opacity-100'}`} aria-label="Arrastar para reordenar"><Ic n="drag_indicator" s={16} /></span>
      <span className="flex w-5 shrink-0 justify-center text-texto-2">{linha.icone}</span>
      <span className={`min-w-0 flex-1 truncate text-[14px] ${linha.travada ? 'text-texto-3' : ''}`}>{linha.nome}</span>
      {aoConfigurar && <button type="button" onClick={aoConfigurar} aria-label={`Configurar ${linha.nome}`} title="Configurar campo" className="hidden h-6 w-6 items-center justify-center rounded text-texto-2 hover:bg-[var(--bg-active)] group-hover:flex"><Ic n="edit" s={15} /></button>}
      <Toggle ligado aoAlternar={aoAlternar} desabilitado={linha.travada} rotuloA11y={`Ocultar ${linha.nome}`} />
    </div>
  )
}

/**
 * Painel lateral "Campos" (botão de colunas da barra da Lista): escolhe e ordena as colunas da lista e, para quem gerencia, cria campos
 * personalizados ou adiciona os que já existem no espaço. A visibilidade das colunas é por pessoa e por lista (guardada no navegador).
 */
export function PainelCampos({ aberto, aoFechar, listaId, espacoId, camposDaLista, camposDoEspaco, podeGerir, colunas, alternar, reordenar, aoConfigurar }: {
  aberto: boolean
  aoFechar: () => void
  listaId: string
  espacoId: string | null
  camposDaLista: DefinicaoCampo[]
  camposDoEspaco: DefinicaoCampo[]
  podeGerir: boolean
  /** Colunas visíveis hoje, na ordem (nativas pelo id; campos como `campo:<id>`). */
  colunas: string[]
  /** Liga/desliga uma coluna (id bruto: o da nativa ou o do campo). */
  alternar: (id: string) => void
  /** Nova ordem das colunas visíveis (ids brutos). */
  reordenar: (ids: string[]) => void
  aoConfigurar: (campoId: string) => void
}) {
  const [aba, setAba] = useState<'novo' | 'existente'>('existente')
  const [busca, setBusca] = useState('')
  const [abertas, setAbertas] = useState({ mostrados: true, propriedades: true, espaco: false, herdados: false })
  const [selecionado, setSelecionado] = useState<ItemCatalogoCampo | null>(null)
  const [nome, setNome] = useState('')
  const [corNova, setCorNova] = useState('#70262d')
  const [iconeNovo, setIconeNovo] = useState('')
  const [config, setConfig] = useState<ConfigCampo>({})
  const [pendente, iniciar] = useTransition()
  const idDnd = useId()
  const sensores = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }))

  useEffect(() => {
    if (!aberto) return
    const esc = (e: KeyboardEvent) => { if (e.key === 'Escape') aoFechar() }
    window.addEventListener('keydown', esc)
    return () => window.removeEventListener('keydown', esc)
  }, [aberto, aoFechar])

  const porCampo = useMemo(() => new Map(camposDaLista.map((c) => [c.id, c])), [camposDaLista])
  const mostradas: Linha[] = useMemo(() => [
    { id: 'nome', nome: 'Nome da tarefa', icone: <Ic n="text_fields" s={18} />, travada: true },
    ...colunas.map((c): Linha => {
      if (c.startsWith('campo:')) {
        const f = porCampo.get(c.slice(6))
        return { id: c, nome: f?.nome ?? 'Campo', campoId: f?.id, icone: f ? <span style={{ color: f.cor }}><IconeVisual icone={f.icone} className="h-4 w-4" /></span> : <Ic n="tune" s={18} /> }
      }
      const p = PROP.get(c)
      return { id: c, nome: p?.nome ?? c, icone: <Ic n={p?.ms ?? 'view_column'} s={18} /> }
    }),
  ], [colunas, porCampo])

  const q = norm(busca)
  const filtra = (nomeLinha: string) => !q || norm(nomeLinha).includes(q)
  const mostradasVis = mostradas.filter((l) => filtra(l.nome))
  const idsVisiveis = new Set(colunas)
  const propriedades = PROPRIEDADES.filter((p) => !idsVisiveis.has(p.id) && filtra(p.nome))
  const vinculados = new Set(camposDaLista.map((c) => c.id))
  const doEspaco = camposDoEspaco.filter((c) => !vinculados.has(c.id) && filtra(c.nome))
  const herdados = doEspaco.filter((c) => c.espacoId && espacoId && c.espacoId !== espacoId)
  const doEspacoProprios = doEspaco.filter((c) => !herdados.includes(c))
  const camposForaDaTela = camposDaLista.filter((c) => !idsVisiveis.has(`campo:${c.id}`) && filtra(c.nome))

  const soltar = ({ active, over }: DragEndEvent) => {
    if (!over || active.id === over.id) return
    const ids = colunas
    const de = ids.indexOf(String(active.id))
    const para = ids.indexOf(String(over.id))
    if (de < 0 || para < 0) return
    reordenar(arrayMove(ids, de, para).map((c) => (c.startsWith('campo:') ? c.slice(6) : c)))
  }

  const escolher = (item: ItemCatalogoCampo) => {
    setSelecionado(item); setNome(item.nome); setCorNova(item.cor); setIconeNovo(item.icone); setConfig(configuracaoPadrao(item.tipo))
  }
  const criar = () => iniciar(async () => {
    if (!selecionado) return
    const r = await criarCampoPersonalizado({ espacoId, listaId, nome, tipo: selecionado.tipo, configuracao: config, cor: corNova, icone: iconeNovo || selecionado.icone })
    if (!avisar(r)) return
    setSelecionado(null)
    setAba('existente')
  })
  const adicionar = (id: string) => iniciar(async () => void avisar(await adicionarCampoExistente(listaId, id)))

  if (!aberto) return null
  return (
    <aside aria-label="Campos" className="fixed bottom-2 right-2 top-10 z-40 flex w-[min(400px,calc(100vw-16px))] flex-col overflow-hidden border border-borda bg-[var(--bg)] max-md:inset-0 max-md:w-auto" style={{ borderRadius: 10, boxShadow: 'var(--shadow-panel)' }}>
      <header className="flex h-14 shrink-0 items-center gap-2 px-4">
        <h2 className="flex-1 text-[16px] font-semibold">Campos</h2>
        <Link href="/config/campos" title="Gerenciar campos personalizados" aria-label="Gerenciar campos personalizados" className="flex h-8 w-8 items-center justify-center rounded-md text-texto-2 hover:bg-hover"><Ic n="settings" s={19} /></Link>
        <button type="button" onClick={aoFechar} aria-label="Fechar" className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--bg-active)] text-texto-2 hover:bg-[var(--border)]"><Ic n="close" s={18} /></button>
      </header>
      <div className="shrink-0 px-4 pb-3">
        <input value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Pesquisar campos de tarefa" aria-label="Pesquisar campos de tarefa" autoFocus className="h-10 w-full rounded-md border border-borda bg-[var(--bg)] px-3 text-[14px] outline-none focus:border-[var(--focus)] focus:ring-3 focus:ring-[var(--focus-ring)]" />
      </div>
      {podeGerir && (
        <div role="tablist" className="flex shrink-0 gap-6 border-b border-borda px-4 text-[15px]">
          {([['novo', 'Criar novo'], ['existente', 'Adicionar um existente']] as const).map(([k, r]) => (
            <button key={k} type="button" role="tab" aria-selected={aba === k} onClick={() => setAba(k)} className="h-11" style={{ borderBottom: `2px solid ${aba === k ? 'var(--text)' : 'transparent'}`, fontWeight: aba === k ? 600 : 400, color: aba === k ? 'var(--text)' : 'var(--text-2)' }}>{r}</button>
          ))}
        </div>
      )}

      <div className="min-h-0 flex-1 overflow-y-auto pb-6">
        {podeGerir && aba === 'novo' ? (
          selecionado ? (
            <form className="space-y-4 p-4" onSubmit={(e) => { e.preventDefault(); criar() }}>
              <button type="button" className="text-[12px] font-semibold text-[var(--client)] hover:underline" onClick={() => setSelecionado(null)}>← Voltar aos tipos</button>
              <label className="block space-y-1"><span className={rotulo}>Nome do campo</span><input autoFocus required className={campo} value={nome} onChange={(e) => setNome(e.target.value)} /></label>
              <ConfiguracaoCampo item={selecionado} config={config} onChange={setConfig} campos={camposDoEspaco} />
              <AparenciaCampo cor={corNova} aoMudarCor={setCorNova} icone={iconeNovo} aoMudarIcone={setIconeNovo} iconePadrao={selecionado.icone} />
              <div className="flex justify-end gap-2"><button type="button" className={botaoSecundario} onClick={() => setSelecionado(null)}>Cancelar</button><button disabled={pendente || !nome.trim()} className={botaoPrimario}>{pendente ? 'Criando…' : 'Criar e adicionar'}</button></div>
            </form>
          ) : (
            <div className="p-3"><Catalogo busca={busca} onSelect={escolher} /></div>
          )
        ) : (
          <>
            <Secao titulo="Mostrados" total={mostradas.length} aberta={abertas.mostrados} aoAlternar={() => setAbertas((a) => ({ ...a, mostrados: !a.mostrados }))} />
            {abertas.mostrados && (
              <DndContext id={idDnd} sensors={sensores} collisionDetection={closestCenter} onDragEnd={soltar}>
                <SortableContext items={mostradas.map((l) => l.id)} strategy={verticalListSortingStrategy}>
                  {mostradasVis.map((l) => (
                    <LinhaMostrada key={l.id} linha={l} aoAlternar={() => alternar(l.id.startsWith('campo:') ? l.id.slice(6) : l.id)} aoConfigurar={l.campoId && podeGerir ? () => aoConfigurar(l.campoId as string) : undefined} />
                  ))}
                </SortableContext>
              </DndContext>
            )}
            <div className="my-2 border-t border-borda" />
            <Secao titulo="Propriedades" total={PROPRIEDADES.length - PROPRIEDADES.filter((p) => idsVisiveis.has(p.id)).length} aberta={abertas.propriedades} aoAlternar={() => setAbertas((a) => ({ ...a, propriedades: !a.propriedades }))} />
            {abertas.propriedades && propriedades.map((p) => (
              <div key={p.id} className="mx-2 flex h-9 items-center gap-2 rounded px-2 hover:bg-[var(--bg-hover)]" title={p.pronta ? undefined : 'Ainda não disponível nesta plataforma'}>
                <span className="w-4 shrink-0" />
                <span className="flex w-5 shrink-0 justify-center text-texto-2"><Ic n={p.ms} s={18} /></span>
                <span className={`min-w-0 flex-1 truncate text-[14px] ${p.pronta ? '' : 'text-texto-3'}`}>{p.nome}</span>
                <Toggle ligado={false} desabilitado={!p.pronta} aoAlternar={() => alternar(p.id)} rotuloA11y={`Mostrar ${p.nome}`} />
              </div>
            ))}
            {camposForaDaTela.length > 0 && (
              <>
                <div className="my-2 border-t border-borda" />
                <Secao titulo="Campos da lista ocultos" total={camposForaDaTela.length} aberta aoAlternar={() => {}} />
                {camposForaDaTela.map((c) => (
                  <div key={c.id} className="mx-2 flex h-9 items-center gap-2 rounded px-2 hover:bg-[var(--bg-hover)]">
                    <span className="w-4 shrink-0" />
                    <span className="flex w-5 shrink-0 justify-center" style={{ color: c.cor }}><IconeVisual icone={c.icone} className="h-4 w-4" /></span>
                    <span className="min-w-0 flex-1 truncate text-[14px]">{c.nome}</span>
                    <Toggle ligado={false} aoAlternar={() => alternar(c.id)} rotuloA11y={`Mostrar ${c.nome}`} />
                  </div>
                ))}
              </>
            )}
            {podeGerir && (
              <>
                <div className="my-2 border-t border-borda" />
                <Secao titulo="Campos personalizados herdados" total={herdados.length} aberta={abertas.herdados} aoAlternar={() => setAbertas((a) => ({ ...a, herdados: !a.herdados }))} />
                {abertas.herdados && herdados.map((c) => <CampoDoEspaco key={c.id} c={c} pendente={pendente} adicionar={adicionar} />)}
                <div className="my-2 border-t border-borda" />
                <Secao titulo="Campos personalizados no Espaço de trabalho" total={doEspacoProprios.length} aberta={abertas.espaco} aoAlternar={() => setAbertas((a) => ({ ...a, espaco: !a.espaco }))} />
                {abertas.espaco && doEspacoProprios.map((c) => <CampoDoEspaco key={c.id} c={c} pendente={pendente} adicionar={adicionar} />)}
              </>
            )}
          </>
        )}
      </div>
    </aside>
  )
}

function CampoDoEspaco({ c, pendente, adicionar }: { c: DefinicaoCampo; pendente: boolean; adicionar: (id: string) => void }) {
  return (
    <div className="mx-2 flex h-9 items-center gap-2 rounded px-2 hover:bg-[var(--bg-hover)]">
      <span className="w-4 shrink-0" />
      <span className="flex w-5 shrink-0 justify-center" style={{ color: c.cor }}><IconeVisual icone={c.icone} className="h-4 w-4" /></span>
      <span className="min-w-0 flex-1 truncate text-[14px]">{c.nome}</span>
      <Toggle ligado={false} desabilitado={pendente} aoAlternar={() => adicionar(c.id)} rotuloA11y={`Adicionar ${c.nome} à lista`} />
    </div>
  )
}
