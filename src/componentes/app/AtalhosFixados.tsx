'use client'

import { Ic } from './Ic'
import Link from 'next/link'
import { usePathname, useSearchParams } from 'next/navigation'
import { useMemo, useSyncExternalStore } from 'react'

type Fixado = { nome: string; href: string; icone?: string }

const CHAVE = 'srv:atalhos-fixados'
const PADRAO: Fixado[] = [
  { nome: 'Minhas tarefas', href: '/inicio', icone: 'task_alt' },
  { nome: 'Agenda', href: '/agenda', icone: 'calendar_month' },
  { nome: 'Clientes', href: '/clientes', icone: 'storefront' },
  { nome: 'Projetos', href: '/projetos', icone: 'work' },
  { nome: 'Financeiro', href: '/financeiro', icone: 'payments' },
  { nome: 'Reuniões', href: '/reunioes', icone: 'videocam' },
]

const EVENTO = 'srv:atalhos-fixados'
const assinar = (aviso: () => void) => {
  window.addEventListener(EVENTO, aviso)
  window.addEventListener('storage', aviso)
  return () => { window.removeEventListener(EVENTO, aviso); window.removeEventListener('storage', aviso) }
}
const texto = () => { try { return localStorage.getItem(CHAVE) ?? '' } catch { return '' } }

function ler(texto: string): Fixado[] {
  try {
    const bruto = JSON.parse(texto || 'null')
    if (Array.isArray(bruto)) return bruto.filter((f): f is Fixado => typeof f?.nome === 'string' && typeof f?.href === 'string' && f.href.startsWith('/'))
  } catch {}
  return PADRAO
}

/** Faixa de 32px sob o topo: atalhos para telas e visualizações fixadas pela pessoa. "+" fixa a tela atual; × remove. A escolha fica no navegador. */
export function AtalhosFixados() {
  const caminho = usePathname()
  const busca = useSearchParams().toString()
  const bruto = useSyncExternalStore(assinar, texto, () => '')
  const itens = useMemo(() => ler(bruto), [bruto])
  const atual = busca ? `${caminho}?${busca}` : caminho
  const gravar = (novos: Fixado[]) => {
    try { localStorage.setItem(CHAVE, JSON.stringify(novos)) } catch {}
    window.dispatchEvent(new Event(EVENTO))
  }
  const fixar = () => {
    if (itens.some((i) => i.href === atual)) return
    const nome = window.prompt('Nome do atalho', document.title.split(' · ')[0] || 'Atalho')?.trim().slice(0, 40)
    if (nome) gravar([...itens, { nome, href: atual }])
  }
  return (
    <nav aria-label="Atalhos fixados" className="hidden md:flex" style={{ flex: '1 1 0', minWidth: 0, alignItems: 'center', gap: 2, marginLeft: 6, overflowX: 'auto', scrollbarWidth: 'none', color: 'var(--text-2)' }}>
      {itens.map((i) => (
        <span key={i.href} className="group/f" style={{ position: 'relative', display: 'flex', flex: 'none' }}>
          <Link href={i.href} className="hover-bg" style={{ height: 26, display: 'flex', alignItems: 'center', gap: 6, padding: '0 8px', borderRadius: 6, color: i.href === atual ? 'var(--text)' : 'inherit', fontSize: 13, whiteSpace: 'nowrap', textDecoration: 'none', fontWeight: i.href === atual ? 600 : 400 }}>
            <Ic n={i.icone ?? 'bookmark'} s={15} style={{ color: 'var(--text-3)' }} />{i.nome}
          </Link>
          <button type="button" aria-label={`Remover atalho ${i.nome}`} onClick={() => gravar(itens.filter((x) => x.href !== i.href))} className="hidden group-hover/f:flex" style={{ position: 'absolute', right: -2, top: -2, width: 14, height: 14, alignItems: 'center', justifyContent: 'center', borderRadius: '50%', border: 0, background: 'var(--bg-active)', color: 'var(--text-3)', cursor: 'pointer' }}><Ic n="close" s={10} /></button>
        </span>
      ))}
      <button type="button" onClick={fixar} aria-label="Fixar visualização" title="Fixar visualização" className="hover-bg" style={{ width: 26, height: 26, flex: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', border: 0, borderRadius: 6, background: 'transparent', color: 'var(--text-3)', cursor: 'pointer' }}><Ic n="add" s={15} /></button>
    </nav>
  )
}
