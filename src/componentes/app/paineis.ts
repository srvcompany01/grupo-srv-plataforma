/**
 * Painel lateral por módulo: cada ícone da faixa abre, ao lado, as opções e atalhos daquele módulo.
 * Módulo novo entra em um grupo daqui (ou ganha um grupo novo). O que não casa com nenhum grupo cai no painel de Início (espaços).
 * `icone` = nome do Material Symbols Rounded; `visao` = visão da Agenda (a página lê ?visao=).
 */
export type ItemPainel = { rotulo: string; href: string; icone: string; visao?: string; admin?: boolean; /** Só fica ativo no caminho exato (não nos de baixo dele). */ exato?: boolean }
export type SecaoPainel = { titulo?: string; itens: ItemPainel[] }
export type PainelModulo = { id: string; titulo: string; /** Caminhos (prefixos) que ativam este painel. */ rotas: string[]; secoes: SecaoPainel[]; /** Mostra os canais do chat. */ canais?: boolean }

export const PAINEIS: PainelModulo[] = [
  {
    id: 'chat',
    titulo: 'Chat',
    rotas: ['/chat'],
    canais: true,
    secoes: [{ itens: [{ rotulo: 'Mensagens diretas', href: '/chat', icone: 'forum', exato: true }, { rotulo: 'Reuniões', href: '/reunioes', icone: 'videocam' }] }],
  },
  {
    id: 'planejador',
    titulo: 'Planejador',
    rotas: ['/agenda', '/agendamentos', '/reunioes', '/caixa-de-entrada'],
    secoes: [
      {
        titulo: 'Agenda',
        itens: [
          { rotulo: 'Dia', href: '/agenda?visao=dia', icone: 'today', visao: 'dia' },
          { rotulo: 'Semana', href: '/agenda', icone: 'view_week', visao: 'semana' },
          { rotulo: 'Mês', href: '/agenda?visao=mes', icone: 'calendar_month', visao: 'mes' },
        ],
      },
      {
        titulo: 'Relacionados',
        itens: [
          { rotulo: 'Posts agendados', href: '/agendamentos', icone: 'event_available' },
          { rotulo: 'Reuniões', href: '/reunioes', icone: 'videocam' },
          { rotulo: 'Caixa de entrada', href: '/caixa-de-entrada', icone: 'move_to_inbox' },
          { rotulo: 'Minhas tarefas', href: '/inicio', icone: 'task_alt' },
        ],
      },
    ],
  },
  {
    id: 'equipes',
    titulo: 'Equipes',
    rotas: ['/time'],
    secoes: [
      {
        itens: [
          { rotulo: 'Time', href: '/time', icone: 'groups' },
          { rotulo: 'Relatórios', href: '/relatorios', icone: 'summarize' },
          { rotulo: 'Performance', href: '/performance', icone: 'trending_up' },
          { rotulo: 'Usuários', href: '/config/usuarios', icone: 'manage_accounts', admin: true },
        ],
      },
    ],
  },
  {
    id: 'documentos',
    titulo: 'Documentos',
    rotas: ['/documentos', '/quadros', '/editor-blog'],
    secoes: [
      {
        itens: [
          { rotulo: 'Todos os documentos', href: '/documentos', icone: 'description' },
          { rotulo: 'Quadros', href: '/quadros', icone: 'draw' },
          { rotulo: 'Blog', href: '/editor-blog', icone: 'article' },
        ],
      },
    ],
  },
  {
    id: 'paineis',
    titulo: 'Painéis',
    rotas: ['/painel-de-gestao', '/performance', '/insights', '/relatorios', '/projetos', '/financeiro'],
    secoes: [
      {
        itens: [
          { rotulo: 'Painel de gestão', href: '/painel-de-gestao', icone: 'monitoring' },
          { rotulo: 'Performance', href: '/performance', icone: 'trending_up' },
          { rotulo: 'Insights', href: '/insights', icone: 'insights' },
          { rotulo: 'Relatórios', href: '/relatorios', icone: 'summarize' },
          { rotulo: 'Projetos', href: '/projetos', icone: 'work' },
          { rotulo: 'Financeiro', href: '/financeiro', icone: 'payments', admin: true },
        ],
      },
    ],
  },
  {
    id: 'clientes',
    titulo: 'Clientes',
    rotas: ['/clientes', '/estrategia', '/social-conteudo'],
    secoes: [
      {
        itens: [
          { rotulo: 'Todos os clientes', href: '/clientes', icone: 'storefront' },
          { rotulo: 'Relatório do cliente', href: '/clientes/relatorio', icone: 'summarize' },
          { rotulo: 'Estratégia', href: '/estrategia', icone: 'explore' },
        ],
      },
    ],
  },
  {
    id: 'marketing',
    titulo: 'Marketing',
    rotas: ['/anuncios', '/trafego-performance', '/gmn', '/biolytics', '/funis', '/redes'],
    secoes: [
      {
        itens: [
          { rotulo: 'Anúncios', href: '/anuncios', icone: 'campaign' },
          { rotulo: 'Tráfego e performance', href: '/trafego-performance', icone: 'query_stats' },
          { rotulo: 'Google Meu Negócio', href: '/gmn', icone: 'location_on' },
          { rotulo: 'Biolytics', href: '/biolytics', icone: 'radar' },
          { rotulo: 'Funis', href: '/funis', icone: 'filter_alt' },
          { rotulo: 'Redes sociais', href: '/redes', icone: 'share' },
        ],
      },
    ],
  },
  {
    id: 'config',
    titulo: 'Configurações',
    rotas: ['/config'],
    secoes: [
      {
        itens: [
          { rotulo: 'Geral', href: '/config', icone: 'settings', exato: true },
          { rotulo: 'Usuários', href: '/config/usuarios', icone: 'manage_accounts' },
          { rotulo: 'Espaços', href: '/config/espacos', icone: 'format_list_bulleted' },
          { rotulo: 'Campos', href: '/config/campos', icone: 'tune' },
          { rotulo: 'Campos de clientes', href: '/config/campos-clientes', icone: 'storefront' },
          { rotulo: 'Formulários', href: '/config/formularios', icone: 'assignment' },
          { rotulo: 'Integrações', href: '/config/integracoes', icone: 'extension' },
          { rotulo: 'Personalização', href: '/config/personalizacao', icone: 'palette' },
          { rotulo: 'Design', href: '/config/design', icone: 'brush' },
          { rotulo: 'Custos', href: '/config/custos', icone: 'receipt_long' },
          { rotulo: 'Armazenamento', href: '/config/armazenamento', icone: 'cloud' },
        ],
      },
    ],
  },
]

const casa = (caminho: string, rota: string) => caminho === rota || caminho.startsWith(`${rota}/`)

/** Painel do módulo aberto; `null` = painel de Início (espaços, atalhos, canais). */
export function painelDoCaminho(caminho: string): PainelModulo | null {
  return PAINEIS.find((p) => p.rotas.some((r) => casa(caminho, r))) ?? null
}
