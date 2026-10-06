'use client'

import {
  CheckSquare,
  ChevronDown,
  ChevronRight,
  Folder,
  Home,
  Layers3,
  List,
  LogOut,
  Menu,
  Plus,
  Settings,
  Users,
} from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, type ComponentType } from 'react'
import { Avatar } from '@/componentes/Avatar'
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from '@/componentes/ui/sheet'
import type { ItemLista, NoEspaco, NoPasta } from '@/dominio/arvore-espacos'
import { rotuloMes } from '@/dominio/formatar'
import { sair } from '@/app/(auth)/login/acoes'

type Props = { arvore: NoEspaco[]; nome: string; papel: string }
type IconeLucide = ComponentType<{ className?: string }>

const item =
  'flex h-8 items-center gap-2 rounded-md px-2 text-[12px] text-[#65676b] transition-colors hover:bg-[#ededee] hover:text-[#292a2d]'
const ativo = 'bg-[#e4e4e6] font-semibold text-[#292a2d] hover:bg-[#dedee0] hover:text-[#292a2d]'

function iniciais(nome: string) {
  return nome
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((parte) => parte[0]?.toUpperCase())
    .join('')
}

function listasDoEspaco(espaco: NoEspaco): string[] {
  return [
    ...espaco.listas.map((lista) => lista.id),
    ...espaco.pastas.flatMap((pasta) => pasta.listas.map((lista) => lista.id)),
    ...espaco.filhos.flatMap(listasDoEspaco),
  ]
}

function LinkLista({ lista, nivel }: { lista: ItemLista; nivel: number }) {
  const caminho = usePathname()
  const href = `/listas/${lista.id}`
  const detalhe = [lista.clienteNome, lista.mes && rotuloMes(lista.mes)].filter(Boolean).join(' · ')

  return (
    <Link
      href={href}
      className={`${item} ${caminho === href ? ativo : ''}`}
      style={{ paddingLeft: 10 + nivel * 14 }}
      title={detalhe ? `${lista.nome} · ${detalhe}` : lista.nome}
    >
      <List className="h-3.5 w-3.5 shrink-0 text-[#929398]" />
      <span className="truncate">{lista.nome}</span>
      {detalhe && <span className="ml-auto max-w-16 truncate text-[9px] text-[#a1a2a6]">{detalhe}</span>}
    </Link>
  )
}

function Pasta({ pasta, nivel }: { pasta: NoPasta; nivel: number }) {
  const [aberta, setAberta] = useState(true)

  return (
    <div>
      <button
        type="button"
        onClick={() => setAberta(!aberta)}
        className={`${item} w-full text-left`}
        style={{ paddingLeft: 6 + nivel * 14 }}
        aria-expanded={aberta}
      >
        <ChevronRight className={`h-3 w-3 shrink-0 text-[#999a9f] transition-transform ${aberta ? 'rotate-90' : ''}`} />
        <Folder className="h-3.5 w-3.5 shrink-0 text-[#77787d]" />
        <span className="truncate">{pasta.nome}</span>
        <span className="ml-auto text-[9px] tabular-nums text-[#a1a2a6]">{pasta.listas.length}</span>
      </button>
      {aberta && pasta.listas.map((lista) => <LinkLista key={lista.id} lista={lista} nivel={nivel + 1} />)}
    </div>
  )
}

function Espaco({ espaco, nivel }: { espaco: NoEspaco; nivel: number }) {
  const caminho = usePathname()
  const [aberto, setAberto] = useState(true)
  const href = `/espacos/${espaco.id}`
  const temConteudo = espaco.filhos.length + espaco.pastas.length + espaco.listas.length > 0

  return (
    <div>
      <div className={`${item} group ${caminho === href ? ativo : ''}`} style={{ paddingLeft: 6 + nivel * 14 }}>
        <button
          type="button"
          onClick={() => temConteudo && setAberto(!aberto)}
          aria-label={aberto ? 'Recolher espaço' : 'Expandir espaço'}
          aria-expanded={aberto}
          className={`rounded p-0.5 hover:bg-black/5 ${temConteudo ? '' : 'invisible'}`}
        >
          <ChevronRight className={`h-3 w-3 transition-transform ${aberto ? 'rotate-90' : ''}`} />
        </button>
        <span
          className="flex h-4 w-4 shrink-0 items-center justify-center rounded-[4px] text-[8px] font-bold text-white"
          style={{ background: espaco.cor }}
        >
          {iniciais(espaco.nome).slice(0, 1)}
        </span>
        <Link href={href} className="min-w-0 flex-1 truncate">
          {espaco.nome}
        </Link>
      </div>

      {aberto && (
        <div>
          {espaco.filhos.map((filho) => <Espaco key={filho.id} espaco={filho} nivel={nivel + 1} />)}
          {espaco.pastas.map((pasta) => <Pasta key={pasta.id} pasta={pasta} nivel={nivel + 1} />)}
          {espaco.listas.map((lista) => <LinkLista key={lista.id} lista={lista} nivel={nivel + 1} />)}
        </div>
      )}
    </div>
  )
}

function Trilho({ arvore, papel }: Pick<Props, 'arvore' | 'papel'>) {
  const caminho = usePathname()
  const departamentos = arvore.slice(0, 5)
  const hrefEspacos = departamentos[0] ? `/espacos/${departamentos[0].id}` : '/inicio'

  const link = (href: string, rotulo: string, Icone: IconeLucide, estaAtivo: boolean) => (
    <Link
      href={href}
      aria-label={rotulo}
      title={rotulo}
      className={`group flex min-h-12 w-full flex-col items-center justify-center gap-0.5 px-1 py-1 text-center text-[8px] font-semibold leading-tight transition-colors ${
        estaAtivo ? 'bg-white/15 text-white' : 'text-white/75 hover:bg-white/10 hover:text-white'
      }`}
    >
      <Icone className="h-[18px] w-[18px]" />
      <span className="line-clamp-1 max-w-12">{rotulo}</span>
    </Link>
  )

  return (
    <div className="flex h-full w-14 shrink-0 flex-col overflow-hidden bg-[#075e57] text-white">
      <Link href="/inicio" aria-label="Grupo SRV" className="flex h-12 shrink-0 items-center justify-center border-b border-white/10">
        <span className="flex h-8 w-8 items-center justify-center rounded-[8px] bg-white font-[var(--font-plus-jakarta)] text-xs font-extrabold text-[#075e57]">
          S
        </span>
      </Link>

      <nav className="min-h-0 flex-1 overflow-y-auto py-1">
        {link('/inicio', 'Início', Home, caminho.startsWith('/inicio'))}
        {link('/clientes', 'Clientes', Users, caminho.startsWith('/clientes'))}
        <div className="mx-2 my-1 border-t border-white/15" />
        {link(hrefEspacos, 'Espaços', Layers3, caminho.startsWith('/espacos') || caminho.startsWith('/listas'))}
        {departamentos.map((espaco) => {
          const listaIds = listasDoEspaco(espaco)
          const selecionado = caminho === `/espacos/${espaco.id}` || listaIds.some((id) => caminho === `/listas/${id}`)
          return (
            <Link
              key={espaco.id}
              href={`/espacos/${espaco.id}`}
              aria-label={espaco.nome}
              title={espaco.nome}
              className={`group flex min-h-12 w-full flex-col items-center justify-center gap-0.5 px-1 py-1 text-[8px] font-semibold leading-tight transition-colors ${
                selecionado ? 'bg-white/15 text-white' : 'text-white/75 hover:bg-white/10 hover:text-white'
              }`}
            >
              <span className="flex h-[19px] w-[19px] items-center justify-center rounded-[5px] text-[8px] font-extrabold text-white" style={{ background: espaco.cor }}>
                {iniciais(espaco.nome).slice(0, 2)}
              </span>
              <span className="line-clamp-1 max-w-12">{espaco.nome}</span>
            </Link>
          )
        })}
      </nav>

      <nav className="border-t border-white/10 py-1">
        {papel === 'admin' && link('/config', 'Ajustes', Settings, caminho.startsWith('/config'))}
      </nav>
    </div>
  )
}

function Painel({ arvore, nome, papel }: Props) {
  const caminho = usePathname()

  const link = (href: string, rotulo: string, Icone: IconeLucide) => (
    <Link href={href} className={`${item} ${caminho.startsWith(href) ? ativo : ''}`}>
      <Icone className="h-3.5 w-3.5 text-[#7d7e83]" />
      <span className="truncate">{rotulo}</span>
    </Link>
  )

  return (
    <div className="flex h-full min-w-0 flex-1 flex-col bg-[#f7f7f8]">
      <div className="flex h-12 shrink-0 items-center gap-2 border-b border-[#e2e2e4] px-3">
        <span className="flex h-6 w-6 items-center justify-center rounded-[6px] bg-marca text-[9px] font-extrabold text-white">S</span>
        <p className="min-w-0 flex-1 truncate text-[12px] font-semibold text-[#303136]">Grupo SRV</p>
        <ChevronDown className="h-3.5 w-3.5 text-[#8d8e93]" />
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-2 py-2">
        <div className="flex h-8 items-center px-2">
          <h2 className="text-[14px] font-semibold tracking-[-0.02em] text-[#292a2d]">Início</h2>
        </div>
        <nav className="space-y-0.5">
          {link('/inicio', 'Minhas tarefas', CheckSquare)}
          {link('/clientes', 'Clientes', Users)}
          {papel === 'admin' && link('/config', 'Configurações', Settings)}
        </nav>

        <div className="mx-2 my-3 border-t border-[#e1e1e3]" />

        <div className="flex h-8 items-center px-2">
          <h2 className="min-w-0 flex-1 text-[11px] font-semibold text-[#626368]">Espaços</h2>
          {papel === 'admin' && (
            <Link
              href="/config/espacos"
              aria-label="Gerenciar espaços"
              title="Gerenciar espaços"
              className="rounded-[5px] p-1 text-[#8a8b90] transition hover:bg-[#e5e5e7] hover:text-[#303136]"
            >
              <Plus className="h-3.5 w-3.5" />
            </Link>
          )}
        </div>

        <nav className="space-y-0.5">
          {arvore.length === 0 && <p className="px-2 py-2 text-[11px] leading-5 text-[#8d8e93]">Você ainda não faz parte de nenhum departamento.</p>}
          {arvore.map((espaco) => <Espaco key={espaco.id} espaco={espaco} nivel={0} />)}
        </nav>
      </div>

      <div className="shrink-0 border-t border-[#e2e2e4] p-2">
        <div className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-[#ededee]">
          <Avatar nome={nome || '?'} tamanho="h-6 w-6 text-[9px]" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-[11px] font-semibold text-[#35363a]">{nome}</p>
            <p className="truncate text-[9px] capitalize text-[#96979b]">{papel}</p>
          </div>
          <form action={sair}>
            <button aria-label="Sair" title="Sair" className="rounded-[5px] p-1.5 text-[#8b8c90] transition hover:bg-white hover:text-[#303136]">
              <LogOut className="h-3.5 w-3.5" />
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}

export function BarraLateral(props: Props) {
  return (
    <>
      <aside className="sticky top-0 hidden h-screen w-[296px] shrink-0 border-r border-[#dfdfe1] md:flex">
        <Trilho arvore={props.arvore} papel={props.papel} />
        <Painel {...props} />
      </aside>

      <div className="sticky top-0 z-40 flex h-12 items-center gap-2 border-b border-borda bg-white/95 px-3 backdrop-blur md:hidden">
        <Sheet>
          <SheetTrigger aria-label="Abrir menu" className="rounded-md p-1.5 hover:bg-hover">
            <Menu className="h-5 w-5" />
          </SheetTrigger>
          <SheetContent side="left" className="w-[280px] border-r-borda bg-[#f7f7f8] p-0">
            <SheetTitle className="sr-only">Menu</SheetTitle>
            <Painel {...props} />
          </SheetContent>
        </Sheet>
        <span className="flex h-6 w-6 items-center justify-center rounded-[6px] bg-[#075e57] text-[9px] font-extrabold text-white">S</span>
        <span className="text-[13px] font-semibold">Grupo SRV</span>
      </div>
    </>
  )
}
