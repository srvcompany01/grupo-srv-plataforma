'use client'

import { DndContext, PointerSensor, closestCenter, useSensor, useSensors, type DragEndEvent } from '@dnd-kit/core'
import { SortableContext, arrayMove, horizontalListSortingStrategy, useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useId, useRef, useState, useTransition } from 'react'
import { toast } from 'sonner'
import { criarVisaoAcao, duplicarVisaoAcao, excluirVisaoAcao, fixarVisaoAcao, renomearVisaoAcao, reordenarVisoesAcao } from '@/app/(app)/listas/acoes-visao'
import { Ic } from '@/componentes/app/Ic'
import { useConfirmar } from '@/componentes/ConfirmarProvider'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/componentes/ui/dialog'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/componentes/ui/dropdown-menu'
import { Popover, PopoverContent, PopoverTrigger } from '@/componentes/ui/popover'
import { CATALOGO_VISOES, type ItemCatalogoVisao, type VisaoDaLista } from '@/dominio/visoes-lista'
import { botaoPrimario, botaoSecundario, campo } from '@/lib/ui'
import { avisar } from './avisar'
import { IconeVisao } from './IconesVisao'

const norm = (t: string) => t.toLocaleLowerCase('pt-BR').normalize('NFD').replace(/[̀-ͯ]/g, '')

/**
 * Abas da lista, como no ClickUp: só as que a pessoa adicionou (várias do mesmo tipo, cada uma com os seus filtros) e o "+ Visualização",
 * que abre o catálogo com busca, "Visualização privada" e "Fixar visualização". As não fixadas ficam no menu "…".
 */
export function AbasDaLista({ listaId, caminho, visoes, atualId, euId, podeGerir }: { listaId: string; caminho: string; visoes: VisaoDaLista[]; atualId: string; euId: string; podeGerir: boolean }) {
  const router = useRouter()
  const confirmar = useConfirmar()
  const [pendente, iniciar] = useTransition()
  const [busca, setBusca] = useState('')
  const [privada, setPrivada] = useState(false)
  const [fixar, setFixar] = useState(false)
  const [catalogo, setCatalogo] = useState(false)
  const [renomeando, setRenomeando] = useState<VisaoDaLista | null>(null)
  const [novoNome, setNovoNome] = useState('')
  const href = (id: string) => `${caminho}?v=${id}`
  const pode = (v: VisaoDaLista) => v.criadoPor === euId || podeGerir
  // Fixadas ficam na frente, na ordem da lista, e não se arrastam. Só as não fixadas trocam de lugar entre si (arrastar e soltar).
  const [ordemLocal, setOrdemLocal] = useState<string[] | null>(null)
  const fixadas = visoes.filter((v) => v.fixada)
  const naoFixadasBase = visoes.filter((v) => !v.fixada)
  const naoFixadas = ordemLocal ? ordemLocal.map((id) => naoFixadasBase.find((v) => v.id === id)).filter((v): v is VisaoDaLista => !!v).concat(naoFixadasBase.filter((v) => !ordemLocal.includes(v.id))) : naoFixadasBase
  const sensores = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }))
  const idDnd = useId()
  const acabouDeArrastar = useRef(false)
  const soltar = ({ active, over }: DragEndEvent) => {
    acabouDeArrastar.current = true
    setTimeout(() => { acabouDeArrastar.current = false }, 250)
    if (!over || active.id === over.id) return
    const ids = naoFixadas.map((v) => v.id)
    const nova = arrayMove(ids, ids.indexOf(String(active.id)), ids.indexOf(String(over.id)))
    setOrdemLocal(nova)
    iniciar(async () => {
      const r = await reordenarVisoesAcao([...fixadas.map((v) => v.id), ...nova])
      if (!avisar(r)) setOrdemLocal(null)
    })
  }

  const adicionar = (item: ItemCatalogoVisao) => {
    if (!item.disponivel || !item.tipo) {
      toast(`${item.titulo} ainda não está disponível na plataforma.`)
      return
    }
    const tipo = item.tipo
    iniciar(async () => {
      const r = await criarVisaoAcao({ listaId, tipo, privada, fixada: fixar })
      if (!avisar(r) || !r.id) return
      setCatalogo(false)
      setBusca('')
      router.push(href(r.id))
    })
  }

  const itens = (grupo: ItemCatalogoVisao['grupo']) => CATALOGO_VISOES.filter((c) => c.grupo === grupo && (!busca || norm(`${c.titulo} ${c.descricao}`).includes(norm(busca))))
  const secao = (grupo: ItemCatalogoVisao['grupo'], titulo: string) => {
    const lista = itens(grupo)
    if (!lista.length) return null
    return (
      <div className="px-2 pb-1 pt-2">
        <p className="px-3 pb-1 text-[13px] text-texto-3">{titulo}</p>
        <div className="grid gap-x-2 sm:grid-cols-2">
          {lista.map((c) => (
            <button key={c.chave} type="button" disabled={pendente} onClick={() => adicionar(c)} title={c.disponivel ? undefined : 'Ainda não disponível na plataforma'} className="flex items-center gap-3 rounded-lg px-3 py-2 text-left hover:bg-[var(--bg-hover)] disabled:opacity-60">
              <span className="flex shrink-0 items-center justify-center rounded-[10px]" style={{ width: 36, height: 36, background: c.estilo === 'claro' ? 'var(--bg-active)' : c.cor, color: c.estilo === 'claro' ? c.cor : c.cor === '#ffc53d' ? '#1c1c1e' : '#fff' }}><Ic n={c.glifo} s={22} fill /></span>
              <span className="min-w-0"><span className="block truncate text-[15px] font-medium text-texto">{c.titulo}</span><span className="block truncate text-[13px] text-texto-3">{c.descricao}</span></span>
            </button>
          ))}
        </div>
      </div>
    )
  }
  const algumItem = (['popular', 'mais', 'incorporacoes'] as const).some((g) => itens(g).length > 0)

  const tab = (v: VisaoDaLista, arrastavel: boolean) => <AbaItem key={v.id} v={v} arrastavel={arrastavel} ativa={v.id === atualId} href={href(v.id)} pode={pode(v)} total={visoes.length} acabouDeArrastar={acabouDeArrastar} aoRenomear={() => { setRenomeando(v); setNovoNome(v.nome) }} aoDuplicar={() => iniciar(async () => { const r = await duplicarVisaoAcao(v.id); if (avisar(r, true) && r.id) router.push(href(r.id)) })} aoFixar={() => iniciar(async () => void avisar(await fixarVisaoAcao(v.id, !v.fixada), true))} aoExcluir={async () => {
    if (!(await confirmar({ titulo: `Excluir a visualização "${v.nome}"?`, descricao: 'Os filtros e o agrupamento salvos nela se perdem. As tarefas não são afetadas.', confirmar: 'Excluir', perigo: true }))) return
    iniciar(async () => { if (avisar(await excluirVisaoAcao(v.id, listaId), true)) router.push(caminho) })
  }} />

  return (
    <>
      <nav role="tablist" aria-label="Visualizações da lista" className="flex min-w-0 items-stretch overflow-x-auto [scrollbar-width:none]" style={{ height: 36, gap: 4, padding: '0 10px', borderBottom: '1px solid var(--border)', color: 'var(--text-2)' }}>
        <Link href={`/listas/${listaId}/canal`} className="hover:text-[var(--text)]" style={{ height: 36, display: 'flex', alignItems: 'center', gap: 6, padding: '0 6px', fontSize: 13, whiteSpace: 'nowrap', color: 'inherit' }}><IconeVisao visao="canal" />Canal</Link>
        <div aria-hidden="true" style={{ width: 1, height: 16, background: 'var(--border)', margin: '10px 4px', flex: 'none' }} />
        {fixadas.map((v) => tab(v, false))}
        <DndContext id={idDnd} sensors={sensores} collisionDetection={closestCenter} onDragEnd={soltar}>
          <SortableContext items={naoFixadas.map((v) => v.id)} strategy={horizontalListSortingStrategy}>
            {naoFixadas.map((v) => tab(v, true))}
          </SortableContext>
        </DndContext>
        <div aria-hidden="true" style={{ width: 1, height: 16, background: 'var(--border)', margin: '10px 4px', flex: 'none' }} />
        <Popover open={catalogo} onOpenChange={setCatalogo}>
          <PopoverTrigger className="b-ghost self-center" style={{ color: 'var(--text-3)', padding: '0 8px' }}><Ic n="add" s={15} /> Visualização</PopoverTrigger>
          <PopoverContent align="start" className="w-[min(640px,calc(100vw-24px))] gap-0 overflow-hidden p-0">
            <div className="p-3 pb-2">
              <div className="relative">
                <Ic n="search" s={18} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-3)' }} />
                <input autoFocus value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Buscar visualizações" aria-label="Buscar visualizações" className={`${campo} h-9 pl-9`} />
              </div>
            </div>
            <div className="max-h-[min(60vh,520px)] overflow-y-auto pb-2">
              {secao('popular', 'Popular')}
              {itens('popular').length > 0 && itens('mais').length > 0 && <div className="mx-5 my-1 border-t border-borda" />}
              {secao('mais', 'Mais visualizações')}
              {itens('mais').length > 0 && itens('incorporacoes').length > 0 && <div className="mx-5 my-1 border-t border-borda" />}
              {secao('incorporacoes', 'Incorporações')}
              {!algumItem && <p className="px-5 py-6 text-center text-[13px] text-texto-3">Nenhuma visualização encontrada.</p>}
            </div>
            <div className="flex items-center gap-5 border-t border-borda px-5 py-3 text-[14px]">
              <label className="flex cursor-pointer items-center gap-2"><input type="checkbox" className="ck" checked={privada} onChange={(e) => setPrivada(e.target.checked)} /><Ic n="lock" s={16} style={{ color: 'var(--text-3)' }} /> Visualização privada</label>
              <label className="flex cursor-pointer items-center gap-2"><input type="checkbox" className="ck" checked={fixar} onChange={(e) => setFixar(e.target.checked)} /><Ic n="push_pin" s={16} style={{ color: 'var(--text-3)' }} /> Fixar visualização</label>
              <button type="button" onClick={() => toast('Modelos de visualização ainda não estão disponíveis.')} className="ml-auto flex items-center gap-2 text-[14px] text-texto hover:text-texto-2"><Ic n="auto_fix_high" s={16} /> Modelos</button>
            </div>
          </PopoverContent>
        </Popover>
      </nav>
      <Dialog open={!!renomeando} onOpenChange={(a) => !a && setRenomeando(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader><DialogTitle>Renomear visualização</DialogTitle><DialogDescription>O nome aparece na aba para quem vê esta visualização.</DialogDescription></DialogHeader>
          <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); if (!renomeando) return; iniciar(async () => { if (avisar(await renomearVisaoAcao(renomeando.id, novoNome), true)) setRenomeando(null) }) }}>
            <input autoFocus value={novoNome} onChange={(e) => setNovoNome(e.target.value)} maxLength={60} aria-label="Nome da visualização" className={campo} />
            <div className="flex justify-end gap-2"><button type="button" className={botaoSecundario} onClick={() => setRenomeando(null)}>Cancelar</button><button disabled={pendente || !novoNome.trim()} className={botaoPrimario}>Salvar</button></div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}

function AbaItem({ v, arrastavel, ativa, href, pode, total, acabouDeArrastar, aoRenomear, aoDuplicar, aoFixar, aoExcluir }: {
  v: VisaoDaLista; arrastavel: boolean; ativa: boolean; href: string; pode: boolean; total: number; acabouDeArrastar: { current: boolean }
  aoRenomear: () => void; aoDuplicar: () => void; aoFixar: () => void; aoExcluir: () => void
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: v.id, disabled: !arrastavel })
  return (
    <div ref={setNodeRef} {...(arrastavel ? attributes : {})} {...(arrastavel ? listeners : {})} tabIndex={-1} style={{ transform: CSS.Translate.toString(transform), transition, opacity: isDragging ? 0.6 : 1, borderBottom: `2px solid ${ativa ? 'var(--text)' : 'transparent'}`, height: 36, cursor: arrastavel ? 'grab' : 'default' }} className="flex shrink-0 items-stretch">
      <Link href={href} scroll={false} role="tab" aria-selected={ativa} aria-current={ativa ? 'page' : undefined} draggable={false} onClickCapture={(e) => { if (acabouDeArrastar.current) { e.preventDefault(); e.stopPropagation() } }} className="hover:text-[var(--text)]" style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '0 4px 0 6px', fontSize: 13, whiteSpace: 'nowrap', fontWeight: ativa ? 600 : 400, color: ativa ? 'var(--text)' : 'inherit' }}>
        <IconeVisao visao={v.tipo} />{v.nome}
        {v.fixada && <Ic n="push_pin" s={12} style={{ color: 'var(--text-3)' }} />}
        {v.privada && <Ic n="lock" s={12} style={{ color: 'var(--text-3)' }} />}
      </Link>
      {ativa && pode ? (
        <DropdownMenu>
          <DropdownMenuTrigger aria-label={`Ações de ${v.nome}`} className="mr-1 flex h-5 w-5 items-center justify-center self-center rounded text-texto-3 hover:bg-hover hover:text-texto"><Ic n="expand_more" s={14} /></DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-52">
            <DropdownMenuItem onSelect={aoRenomear}><Ic n="edit" s={16} /> Renomear</DropdownMenuItem>
            <DropdownMenuItem onSelect={aoDuplicar}><Ic n="content_copy" s={16} /> Duplicar</DropdownMenuItem>
            <DropdownMenuItem onSelect={aoFixar}><Ic n="push_pin" s={16} /> {v.fixada ? 'Desafixar' : 'Fixar na frente'}</DropdownMenuItem>
            {total > 1 && <DropdownMenuSeparator />}
            {total > 1 && <DropdownMenuItem variant="destructive" onSelect={aoExcluir}><Ic n="delete" s={16} /> Excluir</DropdownMenuItem>}
          </DropdownMenuContent>
        </DropdownMenu>
      ) : <span style={{ width: 4 }} />}
    </div>
  )
}
