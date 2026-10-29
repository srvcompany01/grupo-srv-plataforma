'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import { criarVisaoAcao, duplicarVisaoAcao, excluirVisaoAcao, fixarVisaoAcao, renomearVisaoAcao } from '@/app/(app)/listas/acoes-visao'
import { Ic } from '@/componentes/app/Ic'
import { useConfirmar } from '@/componentes/ConfirmarProvider'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/componentes/ui/dialog'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/componentes/ui/dropdown-menu'
import { Popover, PopoverContent, PopoverTrigger } from '@/componentes/ui/popover'
import { CATALOGO_VISOES, type VisaoDaLista } from '@/dominio/visoes-lista'
import { botaoPrimario, botaoSecundario, campo } from '@/lib/ui'
import { avisar } from './avisar'
import { COR_VISAO, GLIFO_VISAO, IconeVisao } from './IconesVisao'

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
  const [fixar, setFixar] = useState(true)
  const [catalogo, setCatalogo] = useState(false)
  const [renomeando, setRenomeando] = useState<VisaoDaLista | null>(null)
  const [novoNome, setNovoNome] = useState('')
  const href = (id: string) => `${caminho}?v=${id}`
  const fixadas = visoes.filter((v) => v.fixada || v.id === atualId)
  const soltas = visoes.filter((v) => !fixadas.includes(v))
  const pode = (v: VisaoDaLista) => v.criadoPor === euId || podeGerir

  const adicionar = (tipo: string) =>
    iniciar(async () => {
      const r = await criarVisaoAcao({ listaId, tipo, privada, fixada: fixar })
      if (!avisar(r) || !r.id) return
      setCatalogo(false)
      setBusca('')
      router.push(href(r.id))
    })

  const itens = (grupo: 'popular' | 'mais') => CATALOGO_VISOES.filter((c) => c.grupo === grupo && (!busca || norm(`${c.titulo} ${c.descricao}`).includes(norm(busca))))
  const secao = (grupo: 'popular' | 'mais', titulo: string) => {
    const lista = itens(grupo)
    if (!lista.length) return null
    return (
      <div className="px-2 pb-1 pt-2">
        <p className="px-3 pb-1 text-[13px] text-texto-3">{titulo}</p>
        <div className="grid gap-x-2 sm:grid-cols-2">
          {lista.map((c) => (
            <button key={c.tipo} type="button" disabled={pendente} onClick={() => adicionar(c.tipo)} className="flex items-center gap-3 rounded-lg px-3 py-2 text-left hover:bg-[var(--bg-hover)] disabled:opacity-60">
              <span className="flex shrink-0 items-center justify-center rounded-[10px] text-white" style={{ width: 36, height: 36, background: COR_VISAO[c.tipo] }}><span className="material-icon" style={{ font: "22px/1 'Material Symbols Rounded'", fontVariationSettings: "'FILL' 1" }}>{GLIFO_VISAO[c.tipo]}</span></span>
              <span className="min-w-0"><span className="block truncate text-[15px] font-medium text-texto">{c.titulo}</span><span className="block truncate text-[13px] text-texto-3">{c.descricao}</span></span>
            </button>
          ))}
        </div>
      </div>
    )
  }

  const tab = (v: VisaoDaLista) => {
    const ativa = v.id === atualId
    return (
      <div key={v.id} className="flex shrink-0 items-stretch" style={{ borderBottom: `2px solid ${ativa ? 'var(--text)' : 'transparent'}`, height: 36 }}>
        <Link href={href(v.id)} scroll={false} role="tab" aria-selected={ativa} aria-current={ativa ? 'page' : undefined} className="hover:text-[var(--text)]" style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '0 4px 0 6px', fontSize: 13, whiteSpace: 'nowrap', fontWeight: ativa ? 600 : 400, color: ativa ? 'var(--text)' : 'inherit' }}>
          <IconeVisao visao={v.tipo} />{v.nome}{v.privada && <Ic n="lock" s={12} style={{ color: 'var(--text-3)' }} />}
        </Link>
        {ativa && pode(v) ? (
          <DropdownMenu>
            <DropdownMenuTrigger aria-label={`Ações de ${v.nome}`} className="mr-1 flex h-5 w-5 items-center justify-center self-center rounded text-texto-3 hover:bg-hover hover:text-texto"><Ic n="expand_more" s={14} /></DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-52">
              <DropdownMenuItem onSelect={() => { setRenomeando(v); setNovoNome(v.nome) }}><Ic n="edit" s={16} /> Renomear</DropdownMenuItem>
              <DropdownMenuItem onSelect={() => iniciar(async () => { const r = await duplicarVisaoAcao(v.id); if (avisar(r, true) && r.id) router.push(href(r.id)) })}><Ic n="content_copy" s={16} /> Duplicar</DropdownMenuItem>
              <DropdownMenuItem onSelect={() => iniciar(async () => void avisar(await fixarVisaoAcao(v.id, !v.fixada), true))}><Ic n="push_pin" s={16} /> {v.fixada ? 'Desafixar da barra' : 'Fixar na barra'}</DropdownMenuItem>
              {visoes.length > 1 && <DropdownMenuSeparator />}
              {visoes.length > 1 && (
                <DropdownMenuItem variant="destructive" onSelect={async () => {
                  if (!(await confirmar({ titulo: `Excluir a visualização "${v.nome}"?`, descricao: 'Os filtros e o agrupamento salvos nela se perdem. As tarefas não são afetadas.', confirmar: 'Excluir', perigo: true }))) return
                  iniciar(async () => { if (avisar(await excluirVisaoAcao(v.id, listaId), true)) router.push(caminho) })
                }}><Ic n="delete" s={16} /> Excluir</DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        ) : <span style={{ width: 4 }} />}
      </div>
    )
  }

  return (
    <>
      <nav role="tablist" aria-label="Visualizações da lista" className="flex min-w-0 items-stretch overflow-x-auto [scrollbar-width:none]" style={{ height: 36, gap: 4, padding: '0 10px', borderBottom: '1px solid var(--border)', color: 'var(--text-2)' }}>
        <Link href={`/listas/${listaId}/canal`} className="hover:text-[var(--text)]" style={{ height: 36, display: 'flex', alignItems: 'center', gap: 6, padding: '0 6px', fontSize: 13, whiteSpace: 'nowrap', color: 'inherit' }}><IconeVisao visao="canal" />Canal</Link>
        <div aria-hidden="true" style={{ width: 1, height: 16, background: 'var(--border)', margin: '10px 4px', flex: 'none' }} />
        {fixadas.map(tab)}
        {soltas.length > 0 && (
          <DropdownMenu>
            <DropdownMenuTrigger aria-label="Outras visualizações" title="Outras visualizações" className="flex h-7 w-7 shrink-0 items-center justify-center self-center rounded text-texto-3 hover:bg-hover hover:text-texto"><Ic n="more_horiz" s={16} /></DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-56">
              {soltas.map((v) => <DropdownMenuItem key={v.id} asChild><Link href={href(v.id)} scroll={false}><IconeVisao visao={v.tipo} />{v.nome}</Link></DropdownMenuItem>)}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
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
              {itens('popular').length + itens('mais').length === 0 && <p className="px-5 py-6 text-center text-[13px] text-texto-3">Nenhuma visualização encontrada.</p>}
            </div>
            <div className="flex items-center gap-5 border-t border-borda px-5 py-3 text-[14px]">
              <label className="flex cursor-pointer items-center gap-2"><input type="checkbox" className="ck" checked={privada} onChange={(e) => setPrivada(e.target.checked)} /><Ic n="lock" s={16} style={{ color: 'var(--text-3)' }} /> Visualização privada</label>
              <label className="flex cursor-pointer items-center gap-2"><input type="checkbox" className="ck" checked={fixar} onChange={(e) => setFixar(e.target.checked)} /><Ic n="push_pin" s={16} style={{ color: 'var(--text-3)' }} /> Fixar visualização</label>
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
