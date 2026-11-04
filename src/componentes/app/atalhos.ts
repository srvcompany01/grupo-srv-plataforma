import {
  Briefcase,
  CalendarClock,
  CalendarDays,
  CheckSquare,
  ClipboardList,
  FileText,
  ChartNoAxesCombined,
  Filter,
  LayoutDashboard,
  Megaphone,
  MessagesSquare,
  Mic,
  Newspaper,
  House,
  PenTool,
  Settings,
  Users,
  UsersRound,
  Wallet,
  TrendingUp,
  MapPin,
  Radar,
  Inbox,
} from 'lucide-react'
import type { ComponentType } from 'react'

export type IconeLucide = ComponentType<{ className?: string }>

export type Atalho = { id: string; href: string; rotulo: string; curto: string; Icone: IconeLucide; contador?: number }

/** Atalhos dos módulos: na faixa de ícones (desktop) e no topo do menu (celular). `curto` = rótulo da faixa. */
export function atalhosDoInicio(papel: string, chatNaoLidas: number): Atalho[] {
  return [
    { id: 'home', href: '/home', rotulo: 'Home', curto: 'Início', Icone: House },
    { id: 'tarefas', href: '/inicio', rotulo: 'Minhas tarefas', curto: 'Tarefas', Icone: CheckSquare },
    { id: 'chat', href: '/chat', rotulo: 'Chat', curto: 'Chat', Icone: MessagesSquare, contador: chatNaoLidas },
    { id: 'agenda', href: '/agenda', rotulo: 'Agenda', curto: 'Planejador', Icone: CalendarDays },
    { id: 'agendamentos', href: '/agendamentos', rotulo: 'Agendamentos', curto: 'Posts', Icone: CalendarClock },
    { id: 'caixa', href: '/caixa-de-entrada', rotulo: 'Caixa de entrada', curto: 'Caixa', Icone: Inbox },
    { id: 'painel', href: '/painel-de-gestao', rotulo: 'Painel de Gestão', curto: 'Painéis', Icone: LayoutDashboard },
    { id: 'clientes', href: '/clientes', rotulo: 'Clientes', curto: 'Clientes', Icone: Users },
    { id: 'anuncios', href: '/anuncios', rotulo: 'Anúncios', curto: 'Anúncios', Icone: Megaphone },
    { id: 'insights', href: '/insights', rotulo: 'Insights', curto: 'Insights', Icone: ChartNoAxesCombined },
    { id: 'gmn', href: '/gmn', rotulo: 'Google Meu Negócio', curto: 'GMN', Icone: MapPin },
    { id: 'biolytics', href: '/biolytics', rotulo: 'Biolytics', curto: 'Biolytics', Icone: Radar },
    { id: 'performance', href: '/performance', rotulo: 'Performance', curto: 'Perform.', Icone: TrendingUp },
    { id: 'projetos', href: '/projetos', rotulo: 'Projetos', curto: 'Projetos', Icone: Briefcase },
    { id: 'reunioes', href: '/reunioes', rotulo: 'Reuniões', curto: 'Reuniões', Icone: Mic },
    { id: 'time', href: '/time', rotulo: 'Time', curto: 'Equipes', Icone: UsersRound },
    { id: 'blog', href: '/editor-blog', rotulo: 'Blog', curto: 'Blog', Icone: Newspaper },
    { id: 'documentos', href: '/documentos', rotulo: 'Documentos', curto: 'Docum.', Icone: FileText },
    { id: 'quadros', href: '/quadros', rotulo: 'Quadros', curto: 'Quadros', Icone: PenTool },
    { id: 'funis', href: '/funis', rotulo: 'Funis', curto: 'Funis', Icone: Filter },
    ...(papel === 'admin'
      ? [
          { id: 'financeiro', href: '/financeiro', rotulo: 'Financeiro', curto: 'Financeiro', Icone: Wallet },
          { id: 'formularios', href: '/config/formularios', rotulo: 'Formulários', curto: 'Formulár.', Icone: ClipboardList },
          { id: 'config', href: '/config', rotulo: 'Configurações', curto: 'Config.', Icone: Settings },
        ]
      : []),
  ]
}

export const estaEm = (caminho: string, href: string) => caminho === href || caminho.startsWith(`${href}/`)

/**
 * Barra única de navegação (a "dock"): os de uso diário ficam soltos; o resto abre pela setinha do divisor.
 * Módulo novo entra em atalhosDoInicio e aqui, em NO_TOPO ou em GRUPOS_FAIXA.
 */
export const NO_TOPO = ['home', 'tarefas', 'agenda', 'chat', 'painel', 'documentos', 'quadros', 'time']
export const GRUPOS_FAIXA: { id: string; itens: string[] }[] = [
  { id: 'mais', itens: ['agendamentos', 'reunioes', 'caixa', 'clientes', 'projetos', 'financeiro', 'anuncios', 'insights', 'gmn', 'performance', 'biolytics', 'blog', 'funis', 'formularios'] },
]

/** Nome do ícone (Material Symbols Rounded) de cada módulo, usado na paleta de comandos e no painel. */
export const ICONE_MS: Record<string, string> = {
  home: 'home', espacos: 'grid_view', chat: 'chat_bubble', agenda: 'event_note', time: 'groups', documentos: 'description', painel: 'monitoring', quadros: 'draw', formularios: 'assignment',
  tarefas: 'task_alt', agendamentos: 'event_available', caixa: 'move_to_inbox', reunioes: 'videocam', clientes: 'storefront', projetos: 'work', financeiro: 'payments', anuncios: 'campaign', insights: 'insights',
  gmn: 'location_on', performance: 'trending_up', biolytics: 'radar', blog: 'article', funis: 'filter_alt', config: 'settings',
}

