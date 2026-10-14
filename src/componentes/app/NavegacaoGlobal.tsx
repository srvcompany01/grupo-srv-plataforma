'use client'

import {
  CalendarDays,
  ChartColumn,
  ClipboardList,
  Clock,
  Ellipsis,
  FileText,
  Home,
  Layers,
  MessageCircle,
  PenTool,
  Settings,
  Trophy,
  UsersRound,
  Users,
  Video,
} from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import type { ComponentType } from 'react'
import { Marca } from '@/componentes/Marca'

type Icone = ComponentType<{ className?: string; 'aria-hidden'?: boolean }>
type Item = { rotulo: string; icone: Icone; href?: string; ativoEm?: string[] }

// href ausente = módulo ainda não construído: aparece desabilitado, com "Em breve".
const ITENS: Item[] = [
  { rotulo: 'Início', icone: Home, href: '/inicio' },
  { rotulo: 'Espaços', icone: Layers, href: '/painel-de-gestao', ativoEm: ['/painel-de-gestao', '/espacos', '/listas', '/tarefas'] },
  { rotulo: 'Clientes', icone: Users, href: '/clientes' },
  { rotulo: 'Chat', icone: MessageCircle },
  { rotulo: 'Planejado', icone: CalendarDays },
  { rotulo: 'Equipes', icone: UsersRound },
  { rotulo: 'Documentos', icone: FileText, href: '/documentos' },
  { rotulo: 'Painéis', icone: ChartColumn },
  { rotulo: 'Quadros', icone: PenTool },
  // Formulários já existe, mas a gestão fica em Configurações (só admin).
  { rotulo: 'Formulários', icone: ClipboardList, href: '/config/formularios' },
  { rotulo: 'Clipes', icone: Video },
  { rotulo: 'Metas', icone: Trophy },
  { rotulo: 'Planilhas', icone: Clock },
  { rotulo: 'Mais', icone: Ellipsis },
]

const base = 'flex w-full flex-col items-center gap-0.5 rounded-lg px-0 py-1.5 text-micro font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70'

/** Primeira camada da navegação: faixa fixa de 64px na cor de ação do tema, só ícones e rótulos curtos. */
export function NavegacaoGlobal({ admin }: { admin: boolean }) {
  const caminho = usePathname()
  // Só o admin gerencia formulários; para os demais o item fica como "Em breve".
  const itens = ITENS.map((i) => (i.href === '/config/formularios' && !admin ? { ...i, href: undefined } : i))
  const ativo = (i: Item) => (i.ativoEm ?? (i.href ? [i.href] : [])).some((p) => caminho === p || caminho.startsWith(`${p}/`))

  return (
    <nav aria-label="Navegação principal" className="sticky top-0 z-30 hidden h-dvh w-16 shrink-0 flex-col items-center gap-0.5 overflow-y-auto bg-petroleo px-1 pb-2 text-white md:flex">
      <Link href="/inicio" aria-label="Grupo SRV, ir para o início" className="mb-1 flex h-14 w-full shrink-0 items-center justify-center rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70">
        <Marca tamanho="h-8 w-8" />
      </Link>
      {itens.map((i) => {
        const Icone = i.icone
        const conteudo = (
          <>
            <Icone className="h-4 w-4" aria-hidden />
            <span className="max-w-full truncate">{i.rotulo}</span>
          </>
        )
        if (!i.href) {
          return (
            <span key={i.rotulo} role="link" aria-disabled="true" title={`${i.rotulo}: em breve`} className={`${base} cursor-not-allowed text-white/45`}>
              {conteudo}
            </span>
          )
        }
        return (
          <Link key={i.rotulo} href={i.href} aria-current={ativo(i) ? 'page' : undefined} className={`${base} ${ativo(i) ? 'bg-white/15 text-white' : 'text-white/80 hover:bg-white/10 hover:text-white'}`}>
            {conteudo}
          </Link>
        )
      })}
      {admin && (
        <Link href="/config" aria-current={caminho.startsWith('/config') ? 'page' : undefined} className={`${base} mt-auto ${caminho.startsWith('/config') ? 'bg-white/15 text-white' : 'text-white/80 hover:bg-white/10 hover:text-white'}`}>
          <Settings className="h-4 w-4" aria-hidden />
          <span>Config.</span>
        </Link>
      )}
    </nav>
  )
}
