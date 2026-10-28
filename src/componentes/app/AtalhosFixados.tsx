'use client'

import { Plus, X } from 'lucide-react'
import Link from 'next/link'
import { usePathname, useSearchParams } from 'next/navigation'
import { useMemo, useSyncExternalStore } from 'react'

type Fixado = { nome: string; href: string }

const CHAVE = 'srv:atalhos-fixados'
const PADRAO: Fixado[] = [
  { nome: 'Minhas tarefas', href: '/inicio' },
  { nome: 'Agenda', href: '/agenda' },
  { nome: 'Clientes', href: '/clientes' },
  { nome: 'Projetos', href: '/projetos' },
  { nome: 'Financeiro', href: '/financeiro' },
  { nome: 'Reuniões', href: '/reunioes' },
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
    <nav aria-label="Atalhos fixados" className="sticky top-10 z-30 hidden h-8 shrink-0 items-center gap-0.5 overflow-x-auto bg-[var(--bg-frame)] px-3 [scrollbar-width:none] md:flex">
      {itens.map((i) => (
        <span key={i.href} className="group/f relative flex shrink-0 items-center">
          <Link href={i.href} className={`flex h-[26px] items-center rounded px-2 text-corpo transition-colors hover:bg-hover ${i.href === atual ? 'font-semibold text-texto' : 'text-texto-2'}`}>{i.nome}</Link>
          <button type="button" aria-label={`Remover atalho ${i.nome}`} onClick={() => gravar(itens.filter((x) => x.href !== i.href))} className="absolute -right-0.5 -top-0.5 hidden h-3.5 w-3.5 items-center justify-center rounded-full bg-[var(--bg-active)] text-texto-3 group-hover/f:flex hover:text-texto"><X className="h-2.5 w-2.5" /></button>
        </span>
      ))}
      <button type="button" onClick={fixar} aria-label="Fixar esta tela" title="Fixar esta tela" className="flex h-[26px] w-[26px] shrink-0 items-center justify-center rounded text-texto-3 hover:bg-hover hover:text-texto"><Plus className="h-3.5 w-3.5" /></button>
    </nav>
  )
}
