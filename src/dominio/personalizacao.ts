import type { Json } from '@/infra/supabase/tipos'

export const CORES_PERSONALIZACAO = [
  '#ef4444', '#f97316', '#f59e0b', '#84cc16', '#10b981', '#14b8a6',
  '#06b6d4', '#3b82f6', '#6366f1', '#70262d', '#a855f7', '#ec4899',
  '#64748b', '#073f3b',
] as const

export function corDaOpcao(config: ConfigCampo, opcao: string): string {
  const indice = Math.max(0, (config.options ?? []).indexOf(opcao))
  return config.optionColors?.[opcao] ?? CORES_PERSONALIZACAO[indice % CORES_PERSONALIZACAO.length]
}

/** Valor de `icone` para "sem ícone": o campo aparece só com o nome (na cor escolhida). */
export const ICONE_NENHUM = 'nenhum'

export const ICONES_PERSONALIZACAO = [
  'layers-3', 'folder', 'list', 'briefcase', 'building-2', 'megaphone', 'palette',
  'rocket', 'target', 'chart-no-axes-combined', 'users', 'heart', 'star', 'zap',
  'globe-2', 'shopping-bag', 'badge-dollar-sign', 'bot', 'sparkles', 'camera',
  'clapperboard', 'messages-square', 'calendar-days', 'circle-check',
] as const

export const EMOJIS_PERSONALIZACAO = [
  '💼', '📁', '📋', '🚀', '🎯', '📣', '🎨', '💡', '📈', '💰', '🛒', '🤝',
  '❤️', '⭐', '⚡', '🌎', '📱', '🎬', '📷', '🤖', '✨', '🧠', '🏆', '✅',
] as const

export type TipoCampoPersonalizado =
  | 'dropdown'
  | 'text'
  | 'date'
  | 'long_text'
  | 'number'
  | 'labels'
  | 'files'
  | 'signature'
  | 'rating'
  | 'button'
  | 'checkbox'
  | 'money'
  | 'email'
  | 'formula'
  | 'location'
  | 'people'
  | 'progress_auto'
  | 'progress_manual'
  | 'relationship'
  | 'site'
  | 'tasks'
  | 'phone'
  | 'vote'
  | 'instagram'
  | 'tiktok'

export type ConfigCampo = {
  currency?: string
  locale?: string
  decimals?: number
  options?: string[]
  /** Cor (#rrggbb) de cada opção, pelo texto da opção. Sem entrada, usa a cor padrão da paleta. */
  optionColors?: Record<string, string>
  max?: number
  buttonLabel?: string
  buttonUrl?: string
  formula?: string
  operation?: 'sum' | 'average' | 'difference' | 'product'
  sourceFields?: string[]
  placeholder?: string
}

export type DefinicaoCampo = {
  id: string
  espacoId: string | null
  nome: string
  tipo: TipoCampoPersonalizado
  configuracao: ConfigCampo
  cor: string
  icone: string
  valor?: Json | null
}

export type ItemCatalogoCampo = {
  tipo: TipoCampoPersonalizado
  nome: string
  descricao: string
  icone: string
  cor: string
  popular?: boolean
}

export const CATALOGO_CAMPOS: ItemCatalogoCampo[] = [
  { tipo: 'dropdown', nome: 'Lista suspensa', descricao: 'Uma opção entre valores configurados', icone: 'list-collapse', cor: '#0f8a5f', popular: true },
  { tipo: 'text', nome: 'Texto', descricao: 'Texto curto em uma linha', icone: 'type', cor: '#1677d2', popular: true },
  { tipo: 'date', nome: 'Data', descricao: 'Data com filtro e agrupamento temporal', icone: 'calendar-days', cor: '#0f8a5f', popular: true },
  { tipo: 'long_text', nome: 'Área de texto', descricao: 'Texto longo em várias linhas', icone: 'text-cursor-input', cor: '#1677d2', popular: true },
  { tipo: 'number', nome: 'Número', descricao: 'Valor numérico agregável', icone: 'hash', cor: '#111111', popular: true },
  { tipo: 'labels', nome: 'Rótulos', descricao: 'Seleção múltipla de rótulos', icone: 'tags', cor: '#168b58', popular: true },
  { tipo: 'files', nome: 'Arquivos', descricao: 'Referências de arquivos anexados', icone: 'paperclip', cor: '#d11a22' },
  { tipo: 'signature', nome: 'Assinatura', descricao: 'Assinatura ou aceite registrado', icone: 'pen-line', cor: '#e73578' },
  { tipo: 'rating', nome: 'Avaliação', descricao: 'Nota configurável com estrelas', icone: 'star', cor: '#d11a22' },
  { tipo: 'button', nome: 'Botão', descricao: 'Ação para uma URL configurada', icone: 'badge', cor: '#d11a22' },
  { tipo: 'checkbox', nome: 'Caixa de seleção', descricao: 'Sim ou não', icone: 'square-check-big', cor: '#d11a22' },
  { tipo: 'money', nome: 'Dinheiro', descricao: 'Valor monetário com moeda e casas decimais', icone: 'badge-dollar-sign', cor: '#111111' },
  { tipo: 'email', nome: 'E-mail', descricao: 'Endereço validado e clicável', icone: 'mail', cor: '#e73578' },
  { tipo: 'formula', nome: 'Fórmula', descricao: 'Resultado numérico calculado', icone: 'function-square', cor: '#111111' },
  { tipo: 'location', nome: 'Localização', descricao: 'Endereço ou coordenadas', icone: 'map-pin', cor: '#e73578' },
  { tipo: 'people', nome: 'Pessoas', descricao: 'Uma ou mais pessoas da equipe', icone: 'users', cor: '#e73578' },
  { tipo: 'progress_auto', nome: 'Progresso automático', descricao: 'Percentual calculado pelas subtarefas', icone: 'list-checks', cor: '#f05a00' },
  { tipo: 'progress_manual', nome: 'Progresso manual', descricao: 'Percentual definido manualmente', icone: 'minus-square', cor: '#f05a00' },
  { tipo: 'relationship', nome: 'Relacionamento', descricao: 'Relaciona registros entre listas', icone: 'arrow-up-right', cor: '#915224' },
  { tipo: 'site', nome: 'Site', descricao: 'URL validada e clicável', icone: 'globe-2', cor: '#e73578' },
  { tipo: 'tasks', nome: 'Tarefas', descricao: 'Relaciona outras tarefas', icone: 'layers-3', cor: '#915224' },
  { tipo: 'phone', nome: 'Telefone', descricao: 'Telefone clicável', icone: 'phone', cor: '#e73578' },
  { tipo: 'vote', nome: 'Votação', descricao: 'Contador de votos', icone: 'chart-no-axes-column-increasing', cor: '#d11a22' },
  { tipo: 'instagram', nome: 'Instagram', descricao: 'Usuário ou URL do Instagram', icone: 'instagram', cor: '#e73578' },
  { tipo: 'tiktok', nome: 'TikTok', descricao: 'Usuário ou URL do TikTok', icone: 'music-2', cor: '#202020' },
]

export const TIPOS_CAMPO = new Set<TipoCampoPersonalizado>(CATALOGO_CAMPOS.map((item) => item.tipo))

export function configuracaoPadrao(tipo: TipoCampoPersonalizado): ConfigCampo {
  if (tipo === 'money') return { currency: 'BRL', locale: 'pt-BR', decimals: 2 }
  if (tipo === 'rating') return { max: 5 }
  if (tipo === 'dropdown' || tipo === 'labels') return { options: ['Opção 1', 'Opção 2'] }
  if (tipo === 'button') return { buttonLabel: 'Abrir', buttonUrl: 'https://' }
  return {}
}

export function formatarValorCampo(campo: Pick<DefinicaoCampo, 'tipo' | 'configuracao'>, valor: Json | null | undefined): string {
  if (valor == null || valor === '') return '—'
  if (campo.tipo === 'money' && typeof valor === 'number') {
    return new Intl.NumberFormat(campo.configuracao.locale ?? 'pt-BR', {
      style: 'currency',
      currency: campo.configuracao.currency ?? 'BRL',
      minimumFractionDigits: campo.configuracao.decimals ?? 2,
      maximumFractionDigits: campo.configuracao.decimals ?? 2,
    }).format(valor)
  }
  if (campo.tipo === 'number' && typeof valor === 'number') return new Intl.NumberFormat('pt-BR').format(valor)
  if (campo.tipo === 'date' && typeof valor === 'string') return new Intl.DateTimeFormat('pt-BR', { timeZone: 'UTC' }).format(new Date(`${valor}T00:00:00Z`))
  if (campo.tipo === 'checkbox' && typeof valor === 'boolean') return valor ? 'Sim' : 'Não'
  if ((campo.tipo === 'progress_auto' || campo.tipo === 'progress_manual') && typeof valor === 'number') return `${valor}%`
  if (campo.tipo === 'rating' && typeof valor === 'number') return `${valor}/${campo.configuracao.max ?? 5}`
  if (Array.isArray(valor)) return valor.map(String).join(', ')
  return String(valor)
}

export function calcularFormula(configuracao: ConfigCampo, valores: Map<string, Json | null>): number | null {
  const numeros = (configuracao.sourceFields ?? [])
    .map((id) => valores.get(id))
    .filter((valor): valor is number => typeof valor === 'number' && Number.isFinite(valor))
  if (!numeros.length) return null
  if (configuracao.operation === 'average') return numeros.reduce((soma, valor) => soma + valor, 0) / numeros.length
  if (configuracao.operation === 'difference') return numeros.slice(1).reduce((total, valor) => total - valor, numeros[0])
  if (configuracao.operation === 'product') return numeros.reduce((total, valor) => total * valor, 1)
  return numeros.reduce((soma, valor) => soma + valor, 0)
}

export function campoVazio(c: DefinicaoCampo): boolean {
  if (c.tipo === 'formula') return false
  const v = c.valor
  return v === undefined || v === null || v === '' || (Array.isArray(v) && v.length === 0)
}

export function separarCamposVazios(campos: DefinicaoCampo[]): { preenchidos: DefinicaoCampo[]; vazios: DefinicaoCampo[] } {
  return { preenchidos: campos.filter((c) => !campoVazio(c)), vazios: campos.filter(campoVazio) }
}
