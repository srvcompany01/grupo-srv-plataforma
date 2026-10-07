import { formatarData, formatarDuracao } from './formatar'
import { formatarValorCampo, type DefinicaoCampo } from './personalizacao'
import type { Json } from '@/infra/supabase/tipos'
import { ROTULO_PRIORIDADE, type Prioridade } from './tarefas'

export type Atividade = {
  action: string
  field: string | null
  old_value: unknown
  new_value: unknown
  /** Nome de quem fez; null = sistema. */
  ator: string | null
}

export type NomesAtividade = {
  status: Record<string, string>
  usuarios: Record<string, string>
  tags: Record<string, string>
  campos?: Record<string, Pick<DefinicaoCampo, 'nome' | 'tipo' | 'configuracao'>>
}

const CAMPOS: Record<string, string> = {
  title: 'o título',
  status_id: 'o status',
  priority: 'a prioridade',
  start_date: 'a data de início',
  due_date: 'o prazo',
  estimate_minutes: 'a estimativa',
}

function duracao(min: number): string {
  const h = Math.floor(min / 60)
  const m = min % 60
  return h ? `${h}h${m ? String(m).padStart(2, '0') : ''}` : `${m}min`
}

function valorCampo(campo: string, v: unknown, nomes: NomesAtividade): string {
  if (v === null || v === undefined || v === '') return '—'
  switch (campo) {
    case 'title':
      return `"${v}"`
    case 'status_id':
      return nomes.status[String(v)] ?? 'outro status'
    case 'priority':
      return ROTULO_PRIORIDADE[v as Prioridade] ?? String(v)
    case 'start_date':
    case 'due_date':
      return formatarData(String(v))
    case 'estimate_minutes':
      return duracao(Number(v))
    default:
      return String(v)
  }
}

const chave = (v: unknown, k: string) => (v && typeof v === 'object' ? String((v as Record<string, unknown>)[k]) : '')

export function descreverAtividade(a: Atividade, nomes: NomesAtividade): string {
  const quem = a.ator ?? 'Sistema'
  const usuario = (v: unknown) => nomes.usuarios[chave(v, 'user_id')] ?? 'alguém'
  const tag = (v: unknown) => nomes.tags[chave(v, 'tag_id')] ?? 'removida'
  switch (a.action) {
    case 'created':
      return `${quem} criou a tarefa`
    case 'moved':
      return `${quem} moveu a tarefa`
    case 'archived':
      return `${quem} arquivou a tarefa`
    case 'assignee_added':
      return `${quem} adicionou ${usuario(a.new_value)} como responsável`
    case 'assignee_removed':
      return `${quem} removeu ${usuario(a.old_value)} dos responsáveis`
    case 'tag_added':
      return `${quem} adicionou a etiqueta ${tag(a.new_value)}`
    case 'tag_removed':
      return `${quem} removeu a etiqueta ${tag(a.old_value)}`
    case 'time_logged':
      return `${quem} registrou ${formatarDuracao(Number(chave(a.new_value, 'seconds')) || 0)}`
    case 'field_set': {
      const campo = nomes.campos?.[a.field ?? '']
      if (!campo) return `${quem} alterou um campo`
      if (a.new_value === null || a.new_value === undefined) return `${quem} limpou ${campo.nome}`
      return `${quem} definiu ${campo.nome} como ${formatarValorCampo(campo, a.new_value as Json)}`
    }
  }
  const campo = a.field ?? ''
  if (campo === 'description') return `${quem} editou a descrição`
  if (campo === 'visible_to_client') {
    return a.new_value ? `${quem} deixou a tarefa visível para o cliente` : `${quem} ocultou a tarefa do cliente`
  }
  const rotulo = CAMPOS[campo] ?? campo
  return `${quem} mudou ${rotulo} de ${valorCampo(campo, a.old_value, nomes)} para ${valorCampo(campo, a.new_value, nomes)}`
}
