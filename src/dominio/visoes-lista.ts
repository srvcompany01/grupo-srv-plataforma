import { VISOES, type VisaoTarefas } from './filtros'

/** Uma aba da lista: cada lista pode ter várias, inclusive várias do mesmo tipo, cada uma com os seus filtros, agrupamento e colunas. */
export type VisaoDaLista = {
  id: string
  tipo: VisaoTarefas
  nome: string
  /** Query string normalizada (filtros, agrupamento, colunas). Vazio = o original do tipo. */
  params: string
  privada: boolean
  fixada: boolean
  criadoPor: string
}

export const NOME_DO_TIPO: Record<VisaoTarefas, string> = {
  lista: 'Lista',
  calendario: 'Calendário',
  kanban: 'Quadro',
  tabela: 'Tabela',
  galeria: 'Galeria',
  cronograma: 'Linha do tempo',
  carga: 'Carga de trabalho',
  atividade: 'Atividade',
  painel: 'Painéis',
  documentos: 'Documento',
}

/** Item do catálogo "+ Visualização". `disponivel: false` = aparece na lista (como no ClickUp) mas ainda não existe na plataforma. */
export type ItemCatalogoVisao = {
  chave: string
  /** Só nos itens disponíveis: o tipo gravado na aba. */
  tipo?: VisaoTarefas
  titulo: string
  descricao: string
  grupo: 'popular' | 'mais' | 'incorporacoes'
  glifo: string
  cor: string
  /** Fundo do ícone: 'cor' = ladrilho colorido com glifo branco; 'claro' = ladrilho cinza com glifo colorido (incorporações). */
  estilo?: 'cor' | 'claro'
  disponivel: boolean
}

export const CATALOGO_VISOES: ItemCatalogoVisao[] = [
  { chave: 'lista', tipo: 'lista', titulo: 'Lista', descricao: 'Acompanhe tarefas, posts e pessoas', grupo: 'popular', glifo: 'format_list_bulleted', cor: '#7a7a82', disponivel: true },
  { chave: 'gantt', titulo: 'Gantt', descricao: 'Planeje dependências e tempo', grupo: 'popular', glifo: 'align_horizontal_left', cor: '#e5484d', disponivel: false },
  { chave: 'calendario', tipo: 'calendario', titulo: 'Calendário', descricao: 'Planeje, agende e delegue', grupo: 'popular', glifo: 'calendar_month', cor: '#f76808', disponivel: true },
  { chave: 'documentos', tipo: 'documentos', titulo: 'Documento', descricao: 'Colabore e documente qualquer coisa', grupo: 'popular', glifo: 'article', cor: '#0091ff', disponivel: true },
  { chave: 'kanban', tipo: 'kanban', titulo: 'Quadro – Kanban', descricao: 'Mova tarefas entre colunas', grupo: 'popular', glifo: 'view_kanban', cor: '#3e63dd', disponivel: true },
  { chave: 'formulario', titulo: 'Formulário', descricao: 'Colete, monitore e faça o relatório', grupo: 'popular', glifo: 'assignment_turned_in', cor: '#6e56cf', disponivel: false },
  { chave: 'painel', tipo: 'painel', titulo: 'Painéis', descricao: 'Acompanhe métricas e insights', grupo: 'popular', glifo: 'bar_chart', cor: '#ab4aba', disponivel: true },
  { chave: 'galeria', tipo: 'galeria', titulo: 'Galeria', descricao: 'Galeria de tarefas', grupo: 'popular', glifo: 'grid_view', cor: '#6e56cf', disponivel: true },
  { chave: 'tabela', tipo: 'tabela', titulo: 'Tabela', descricao: 'Formato de tabela estruturada', grupo: 'mais', glifo: 'table_rows', cor: '#30a46c', disponivel: true },
  { chave: 'whiteboard', titulo: 'Whiteboard', descricao: 'Visualize e faça um brainstorming', grupo: 'mais', glifo: 'draw', cor: '#ffc53d', disponivel: false },
  { chave: 'cronograma', tipo: 'cronograma', titulo: 'Linha do tempo', descricao: 'Veja as tarefas por data de início e fim', grupo: 'mais', glifo: 'timeline', cor: '#f76808', disponivel: true },
  { chave: 'atividade', tipo: 'atividade', titulo: 'Atividade', descricao: 'Feed de atividades em tempo real', grupo: 'mais', glifo: 'monitor_heart', cor: '#0090ff', disponivel: true },
  { chave: 'carga', tipo: 'carga', titulo: 'Carga de trabalho', descricao: 'Visualize a capacidade da equipe', grupo: 'mais', glifo: 'stacked_bar_chart', cor: '#12a594', disponivel: true },
  { chave: 'mapa-mental', titulo: 'Mapa mental', descricao: 'Brainstorming visual de ideias', grupo: 'mais', glifo: 'device_hub', cor: '#d6409f', disponivel: false },
  { chave: 'equipe', titulo: 'Equipe', descricao: 'Monitore o trabalho que está sendo feito', grupo: 'mais', glifo: 'grid_view', cor: '#ab4aba', disponivel: false },
  { chave: 'mapa', titulo: 'Mapa', descricao: 'Tarefas visualizadas por endereço', grupo: 'mais', glifo: 'location_on', cor: '#f76808', disponivel: false },
  { chave: 'site', titulo: 'Qualquer site', descricao: 'Insira qualquer conteúdo da Web', grupo: 'incorporacoes', glifo: 'language', cor: '#52525b', estilo: 'claro', disponivel: false },
  { chave: 'sheets', titulo: 'Google Sheets', descricao: 'Sincronize planilhas', grupo: 'incorporacoes', glifo: 'table_chart', cor: '#188038', estilo: 'claro', disponivel: false },
  { chave: 'docs', titulo: 'Google Docs', descricao: 'Sincronize documentos', grupo: 'incorporacoes', glifo: 'description', cor: '#1a73e8', estilo: 'claro', disponivel: false },
  { chave: 'agenda', titulo: 'Google Agenda', descricao: 'Sincronize eventos do Google Agenda', grupo: 'incorporacoes', glifo: 'calendar_month', cor: '#1a73e8', estilo: 'claro', disponivel: false },
  { chave: 'maps', titulo: 'Google Maps', descricao: 'Localize-se', grupo: 'incorporacoes', glifo: 'location_on', cor: '#ea4335', estilo: 'claro', disponivel: false },
  { chave: 'youtube', titulo: 'YouTube', descricao: 'Compartilhe seus vídeos favoritos', grupo: 'incorporacoes', glifo: 'smart_display', cor: '#e5484d', estilo: 'claro', disponivel: false },
  { chave: 'figma', titulo: 'Figma', descricao: 'Visualize seus designs incríveis', grupo: 'incorporacoes', glifo: 'design_services', cor: '#a259ff', estilo: 'claro', disponivel: false },
]

/** Abas que uma lista nova (ou uma lista que ainda não tinha abas) ganha. */
export const VISOES_INICIAIS: VisaoTarefas[] = ['lista', 'calendario', 'kanban']

export const ehTipoDeVisao = (v: string): v is VisaoTarefas => (VISOES as readonly string[]).includes(v)

/** Nome sugerido para uma aba nova: o do tipo, com número se já houver outra com o mesmo nome ("Lista 2"). */
export function nomeParaNovaVisao(tipo: VisaoTarefas, existentes: { nome: string }[]): string {
  const base = NOME_DO_TIPO[tipo]
  const nomes = new Set(existentes.map((v) => v.nome.toLocaleLowerCase('pt-BR')))
  if (!nomes.has(base.toLocaleLowerCase('pt-BR'))) return base
  for (let n = 2; n < 100; n++) if (!nomes.has(`${base} ${n}`.toLocaleLowerCase('pt-BR'))) return `${base} ${n}`
  return base
}
