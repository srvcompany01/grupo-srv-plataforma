'use client'

import { CheckSquare, ChevronRight, Folder, List, LogOut, Menu, Settings, Users } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import { Avatar } from '@/componentes/Avatar'
import { Marca } from '@/componentes/Marca'
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from '@/componentes/ui/sheet'
import type { ItemLista, NoEspaco } from '@/dominio/arvore-espacos'
import { rotuloMes } from '@/dominio/formatar'
import { sair } from '@/app/(auth)/login/acoes'

type Props = { arvore: NoEspaco[]; nome: string; papel: string }

const item = 'flex h-9 items-center gap-2 rounded-lg px-2.5 text-[13px] text-texto-2 transition-all duration-150 hover:bg-white hover:text-texto'
const ativo = 'border border-borda bg-white font-semibold text-texto shadow-[0_1px_2px_rgba(0,0,0,0.03)] hover:bg-white hover:text-texto'

function LinkLista({ lista, nivel }: { lista: ItemLista; nivel: number }) {
  const caminho = usePathname()
  const href = `/listas/${lista.id}`
  const detalhe = [lista.clienteNome, lista.mes && rotuloMes(lista.mes)].filter(Boolean).join(' · ')
  return (
    <Link href={href} className={`${item} ${caminho === href ? ativo : ''}`} style={{ paddingLeft: 8 + nivel * 14 }} title={`${lista.nome} · ${detalhe}`}>
      <List className="h-3.5 w-3.5 shrink-0 text-texto-3" />
      <span className="truncate">{lista.nome}</span>
      {detalhe && <span className="ml-auto max-w-20 truncate text-[10px] text-texto-3">{detalhe}</span>}
    </Link>
  )
}

function Espaco({ espaco, nivel }: { espaco: NoEspaco; nivel: number }) {
  const caminho = usePathname()
  const [aberto, setAberto] = useState(true)
  const href = `/espacos/${espaco.id}`
  return (
    <div>
      <div className={`${item} group ${caminho === href ? ativo : ''}`} style={{ paddingLeft: 6 + nivel * 14 }}>
        <button onClick={() => setAberto(!aberto)} aria-label={aberto ? 'Recolher' : 'Expandir'} className="rounded p-0.5 hover:bg-black/5">
          <ChevronRight className={`h-3.5 w-3.5 transition ${aberto ? 'rotate-90' : ''}`} />
        </button>
        <span className="h-2.5 w-2.5 shrink-0 rounded-full ring-2 ring-white" style={{ background: espaco.cor }} />
        <Link href={href} className="flex-1 truncate">
          {espaco.nome}
        </Link>
      </div>
      {aberto && (
        <div>
          {espaco.filhos.map((f) => (
            <Espaco key={f.id} espaco={f} nivel={nivel + 1} />
          ))}
          {espaco.pastas.map((p) => (
            <div key={p.id}>
              <div className={item} style={{ paddingLeft: 8 + (nivel + 1) * 14 }}>
                <Folder className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate">{p.nome}</span>
              </div>
              {p.listas.map((l) => (
                <LinkLista key={l.id} lista={l} nivel={nivel + 2} />
              ))}
            </div>
          ))}
          {espaco.listas.map((l) => (
            <LinkLista key={l.id} lista={l} nivel={nivel + 1} />
          ))}
        </div>
      )}
    </div>
  )
}

function Conteudo({ arvore, nome, papel }: Props) {
  const caminho = usePathname()
  const link = (href: string, rotulo: string, Icone: typeof Users) => (
    <Link href={href} className={`${item} ${caminho.startsWith(href) ? ativo : ''}`}>
      <Icone className="h-4 w-4" />
      {rotulo}
    </Link>
  )
  return (
    <div className="flex h-full flex-col">
      <div className="flex h-16 items-center gap-3 border-b border-borda px-4">
        <Marca tamanho="h-8 w-8 text-xs" />
        <div className="min-w-0">
          <p className="truncate font-[var(--font-plus-jakarta)] text-sm font-bold tracking-[-0.025em]">Grupo SRV</p>
          <p className="font-mono text-[9px] uppercase tracking-[0.08em] text-texto-3">Workspace</p>
        </div>
      </div>
      <nav className="px-3 pt-3">{link('/inicio', 'Minhas tarefas', CheckSquare)}</nav>
      <div className="eyebrow mt-5 px-4">Espaços</div>
      <nav className="mt-1.5 min-h-0 flex-1 overflow-y-auto px-3 pb-3">
        {arvore.length === 0 && <p className="px-2 py-1 text-[13px] text-texto-3">Você ainda não faz parte de nenhum departamento.</p>}
        {arvore.map((e) => (
          <Espaco key={e.id} espaco={e} nivel={0} />
        ))}
      </nav>
      <nav className="space-y-1 border-t border-borda px-3 py-3">
        {link('/clientes', 'Clientes', Users)}
        {papel === 'admin' && link('/config', 'Configurações', Settings)}
        <div className="mt-2 flex items-center gap-2.5 rounded-xl border border-borda bg-white p-2.5">
          <Avatar nome={nome || '?'} tamanho="h-7 w-7 text-[10px]" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-[12px] font-semibold text-texto">{nome}</p>
            <p className="truncate text-[10px] capitalize text-texto-3">{papel}</p>
          </div>
          <form action={sair}>
            <button aria-label="Sair" title="Sair" className="rounded-full p-1.5 text-texto-3 transition hover:bg-hover hover:text-texto">
              <LogOut className="h-4 w-4" />
            </button>
          </form>
        </div>
      </nav>
    </div>
  )
}

export function BarraLateral(props: Props) {
  return (
    <>
      <aside className="sticky top-0 hidden h-screen w-[272px] shrink-0 border-r border-borda bg-sidebar md:block">
        <Conteudo {...props} />
      </aside>
      <div className="sticky top-0 z-40 flex h-14 items-center gap-2 border-b border-borda bg-white/95 px-3 backdrop-blur md:hidden">
        <Sheet>
          <SheetTrigger aria-label="Abrir menu" className="rounded p-1.5 hover:bg-hover">
            <Menu className="h-5 w-5" />
          </SheetTrigger>
          <SheetContent side="left" className="w-72 border-r-borda bg-sidebar p-0">
            <SheetTitle className="sr-only">Menu</SheetTitle>
            <Conteudo {...props} />
          </SheetContent>
        </Sheet>
        <Marca tamanho="h-6 w-6 text-[10px]" />
        <span className="text-sm font-semibold">Grupo SRV</span>
      </div>
    </>
  )
}
