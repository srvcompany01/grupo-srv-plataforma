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

/** Catálogo do botão "+ Visualização": nome, descrição e o grupo em que aparece. */
export const CATALOGO_VISOES: { tipo: VisaoTarefas; titulo: string; descricao: string; grupo: 'popular' | 'mais' }[] = [
  { tipo: 'lista', titulo: 'Lista', descricao: 'Acompanhe tarefas, posts e pessoas', grupo: 'popular' },
  { tipo: 'calendario', titulo: 'Calendário', descricao: 'Planeje, agende e delegue', grupo: 'popular' },
  { tipo: 'kanban', titulo: 'Quadro – Kanban', descricao: 'Mova tarefas entre colunas', grupo: 'popular' },
  { tipo: 'painel', titulo: 'Painéis', descricao: 'Acompanhe métricas e insights', grupo: 'popular' },
  { tipo: 'galeria', titulo: 'Galeria', descricao: 'Galeria de tarefas', grupo: 'popular' },
  { tipo: 'documentos', titulo: 'Documento', descricao: 'Colabore e documente qualquer coisa', grupo: 'popular' },
  { tipo: 'tabela', titulo: 'Tabela', descricao: 'Formato de tabela estruturada', grupo: 'mais' },
  { tipo: 'cronograma', titulo: 'Linha do tempo', descricao: 'Veja as tarefas por data de início e fim', grupo: 'mais' },
  { tipo: 'atividade', titulo: 'Atividade', descricao: 'Feed de atividades em tempo real', grupo: 'mais' },
  { tipo: 'carga', titulo: 'Carga de trabalho', descricao: 'Visualize a capacidade da equipe', grupo: 'mais' },
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
