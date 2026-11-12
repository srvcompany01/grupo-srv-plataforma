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
      <div>
        <p>{titulo}</p>
        <div>
          {lista.map((c) => (
            <button key={c.chave} type="button" disabled={pendente} onClick={() => adicionar(c)} title={c.disponivel ? undefined : 'Ainda não disponível na plataforma'}>
              <span style={{ width: 36, height: 36, background: c.estilo === 'claro' ? 'var(--bg-active)' : c.cor, color: c.estilo === 'claro' ? c.cor : c.cor === '#ffc53d' ? '#1c1c1e' : '#fff' }}><Ic n={c.glifo} s={22} fill /></span>
              <span><span>{c.titulo}</span><span>{c.descricao}</span></span>
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
      <nav role="tablist" aria-label="Visualizações da lista" className="ls-abas">
        <div className="ls-abas-capsula">
        <Link href={`/listas/${listaId}/canal`}><IconeVisao visao="canal" />Canal</Link>
        {fixadas.map((v) => tab(v, false))}
        <DndContext id={idDnd} sensors={sensores} collisionDetection={closestCenter} onDragEnd={soltar}>
          <SortableContext items={naoFixadas.map((v) => v.id)} strategy={horizontalListSortingStrategy}>
            {naoFixadas.map((v) => tab(v, true))}
          </SortableContext>
        </DndContext>
        </div>
        <Popover open={catalogo} onOpenChange={setCatalogo}>
          <PopoverTrigger style={{ color: 'var(--text-3)', padding: '0 12px' }}><Ic n="add" s={15} /> Visualização</PopoverTrigger>
          <PopoverContent align="start">
            <div>
              <div>
                <Ic n="search" s={18} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-3)' }} />
                <input autoFocus value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Buscar visualizações" aria-label="Buscar visualizações" />
              </div>
            </div>
            <div>
              {secao('popular', 'Popular')}
              {itens('popular').length > 0 && itens('mais').length > 0 && <div />}
              {secao('mais', 'Mais visualizações')}
              {itens('mais').length > 0 && itens('incorporacoes').length > 0 && <div />}
              {secao('incorporacoes', 'Incorporações')}
              {!algumItem && <p>Nenhuma visualização encontrada.</p>}
            </div>
            <div>
              <label><input type="checkbox" checked={privada} onChange={(e) => setPrivada(e.target.checked)} /><Ic n="lock" s={16} style={{ color: 'var(--text-3)' }} /> Visualização privada</label>
              <label><input type="checkbox" checked={fixar} onChange={(e) => setFixar(e.target.checked)} /><Ic n="push_pin" s={16} style={{ color: 'var(--text-3)' }} /> Fixar visualização</label>
              <button type="button" onClick={() => toast('Modelos de visualização ainda não estão disponíveis.')}><Ic n="auto_fix_high" s={16} /> Modelos</button>
            </div>
          </PopoverContent>
        </Popover>
      </nav>
      <Dialog open={!!renomeando} onOpenChange={(a) => !a && setRenomeando(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Renomear visualização</DialogTitle><DialogDescription>O nome aparece na aba para quem vê esta visualização.</DialogDescription></DialogHeader>
          <form onSubmit={(e) => { e.preventDefault(); if (!renomeando) return; iniciar(async () => { if (avisar(await renomearVisaoAcao(renomeando.id, novoNome), true)) setRenomeando(null) }) }}>
            <input autoFocus value={novoNome} onChange={(e) => setNovoNome(e.target.value)} maxLength={60} aria-label="Nome da visualização" />
            <div><button type="button" onClick={() => setRenomeando(null)}>Cancelar</button><button disabled={pendente || !novoNome.trim()}>Salvar</button></div>
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
    <div ref={setNodeRef} {...(arrastavel ? attributes : {})} {...(arrastavel ? listeners : {})} tabIndex={-1} style={{ transform: CSS.Translate.toString(transform), transition, opacity: isDragging ? 0.6 : 1, cursor: arrastavel ? 'grab' : 'default' }} data-ativa={ativa || undefined}>
      <Link href={href} scroll={false} role="tab" aria-selected={ativa} aria-current={ativa ? 'page' : undefined} draggable={false} onClickCapture={(e) => { if (acabouDeArrastar.current) { e.preventDefault(); e.stopPropagation() } }} style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'inherit', fontWeight: 'inherit' }}>
        <IconeVisao visao={v.tipo} />{v.nome}
        {v.fixada && <Ic n="push_pin" s={12} style={{ color: 'var(--text-3)' }} />}
        {v.privada && <Ic n="lock" s={12} style={{ color: 'var(--text-3)' }} />}
      </Link>
      {ativa && pode ? (
        <DropdownMenu>
          <DropdownMenuTrigger aria-label={`Ações de ${v.nome}`}><Ic n="expand_more" s={14} /></DropdownMenuTrigger>
          <DropdownMenuContent align="start">
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
