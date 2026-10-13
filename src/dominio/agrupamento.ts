import { rotuloMes } from './formatar'
import { corDaOpcao, CORES_PERSONALIZACAO, type DefinicaoCampo, type TipoCampoPersonalizado } from './personalizacao'
import { PRIORIDADES, ROTULO_PRIORIDADE, type No, type Pessoa, type StatusLista, type TarefaResumo } from './tarefas'

export const AGRUPAMENTOS_BASICOS = ['nenhum', 'status', 'prioridade', 'mes', 'cliente', 'responsavel', 'etiqueta'] as const
export const ROTULO_AGRUPAMENTO: Record<(typeof AGRUPAMENTOS_BASICOS)[number], string> = {
  nenhum: 'Nenhum',
  status: 'Status',
  prioridade: 'Prioridade',
  mes: 'Mês do prazo',
  cliente: 'Tag do cliente',
  responsavel: 'Responsável',
  etiqueta: 'Etiqueta',
}

/** Campos que fazem sentido como grupo: valores discretos. Votação, número, fórmula, etc. ficam de fora. */
export const TIPOS_AGRUPAVEIS: readonly TipoCampoPersonalizado[] = ['dropdown', 'labels', 'people', 'date', 'checkbox', 'rating']

const CAMPO = /^campo:[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

/** Valor da URL (`?grupo=`) já validado: um agrupamento básico ou `campo:<uuid>`; senão 'status'. */
export function lerAgrupamento(valor: string): string {
  return (AGRUPAMENTOS_BASICOS as readonly string[]).includes(valor) || CAMPO.test(valor) ? valor : 'status'
}

export type GrupoTarefas = { id: string; nome: string; cor: string; tarefas: No<TarefaResumo>[]; statusId?: string; semCabecalho?: boolean }

type Chave = { id: string; nome: string; cor: string }
type Regra = { chaves: (tarefa: TarefaResumo) => Chave[]; ordem?: string[]; semValor?: boolean }

const COR_PRIORIDADE = { urgente: '#e5484d', alta: '#f59e0b', normal: '#38bdf8', baixa: '#10b981' } as const
const COR_NEUTRA = '#87909e'
const corDaPaleta = (i: number) => CORES_PERSONALIZACAO[i % CORES_PERSONALIZACAO.length]
const SEM_VALOR = '__sem-valor'

function porMes(prazo: string | null | undefined): Chave[] {
  if (!prazo) return []
  const mes = prazo.slice(0, 7)
  return [{ id: mes, nome: rotuloMes(`${mes}-01`), cor: corDaPaleta(Number(mes.slice(5, 7))) }]
}

function regraDoCampo(campo: DefinicaoCampo, equipe: Pessoa[]): Regra | null {
  const valor = (t: TarefaResumo) => t.camposPersonalizados?.[campo.id]
  const opcao = (o: string): Chave => ({ id: o, nome: o, cor: corDaOpcao(campo.configuracao, o) })
  switch (campo.tipo) {
    case 'dropdown':
      return { ordem: campo.configuracao.options, chaves: (t) => { const v = valor(t); return typeof v === 'string' && v ? [opcao(v)] : [] } }
    case 'labels':
      return { ordem: campo.configuracao.options, chaves: (t) => { const v = valor(t); return Array.isArray(v) ? v.map((o) => opcao(String(o))) : [] } }
    case 'people':
      return {
        ordem: equipe.map((p) => p.id),
        chaves: (t) => {
          const v = valor(t)
          if (!Array.isArray(v)) return []
          return v.flatMap((id) => {
            const i = equipe.findIndex((p) => p.id === id)
            return i < 0 ? [] : [{ id: equipe[i].id, nome: equipe[i].nome, cor: corDaPaleta(i) }]
          })
        },
      }
    case 'date':
      return { chaves: (t) => { const v = valor(t); return typeof v === 'string' ? porMes(v) : [] } }
    case 'checkbox':
      return { ordem: ['sim', 'nao'], semValor: false, chaves: (t) => [valor(t) === true ? { id: 'sim', nome: 'Sim', cor: '#10b981' } : { id: 'nao', nome: 'Não', cor: COR_NEUTRA }] }
    case 'rating': {
      const max = campo.configuracao.max ?? 5
      return {
        ordem: Array.from({ length: max }, (_, i) => String(max - i)),
        chaves: (t) => { const v = valor(t); return typeof v === 'number' && v > 0 ? [{ id: String(v), nome: `${v}/${max}`, cor: corDaPaleta(v) }] : [] },
      }
    }
    default:
      return null
  }
}

function regraDe(agrupamento: string, campos: DefinicaoCampo[], equipe: Pessoa[]): Regra | null {
  switch (agrupamento) {
    case 'prioridade':
      return { ordem: [...PRIORIDADES], chaves: (t) => [{ id: t.prioridade, nome: ROTULO_PRIORIDADE[t.prioridade], cor: COR_PRIORIDADE[t.prioridade] }] }
    case 'mes':
      return { chaves: (t) => porMes(t.prazo) }
    case 'cliente':
      return { chaves: (t) => [t.clienteId ? { id: t.clienteId, nome: `@${t.clienteNome}`, cor: t.clienteCor } : { id: 'sem-cliente', nome: 'Sem cliente', cor: '#87909e' }] }
    case 'responsavel':
      return { chaves: (t) => t.responsaveis.map((p, i) => ({ id: p.id, nome: p.nome, cor: corDaPaleta(i) })) }
    case 'etiqueta':
      return { chaves: (t) => t.tags.map((tag) => ({ id: tag.id, nome: tag.nome, cor: tag.cor })) }
  }
  const campo = agrupamento.startsWith('campo:') ? campos.find((c) => `campo:${c.id}` === agrupamento) : undefined
  return campo ? regraDoCampo(campo, equipe) : null
}

/**
 * Divide as tarefas raiz em grupos. Tarefa com vários valores (rótulos, pessoas, etiquetas) aparece em cada grupo dela;
 * sem valor vai para "Sem valor", sempre por último. Agrupamento desconhecido cai em status.
 */
export function agruparTarefas(raizes: No<TarefaResumo>[], agrupamento: string, ctx: { status: StatusLista[]; campos: DefinicaoCampo[]; equipe: Pessoa[] }): GrupoTarefas[] {
  if (agrupamento === 'nenhum') return [{ id: 'todas', nome: 'Todas as tarefas', cor: COR_NEUTRA, tarefas: raizes, semCabecalho: true }]
  const regra = regraDe(agrupamento, ctx.campos, ctx.equipe)
  if (!regra) {
    return ctx.status.map((s) => ({ id: s.id, nome: s.nome, cor: s.cor, tarefas: raizes.filter((t) => t.statusId === s.id), statusId: s.id }))
  }
  const grupos = new Map<string, GrupoTarefas>()
  const semValor: No<TarefaResumo>[] = []
  for (const tarefa of raizes) {
    const chaves = regra.chaves(tarefa)
    if (!chaves.length) semValor.push(tarefa)
    for (const c of chaves) {
      const grupo = grupos.get(c.id) ?? { id: c.id, nome: c.nome, cor: c.cor, tarefas: [] }
      grupo.tarefas.push(tarefa)
      grupos.set(c.id, grupo)
    }
  }
  const posicao = (id: string) => {
    const i = regra.ordem?.indexOf(id) ?? -1
    return i < 0 ? Number.MAX_SAFE_INTEGER : i
  }
  const ordenados = [...grupos.values()].sort((a, b) => posicao(a.id) - posicao(b.id) || a.id.localeCompare(b.id, 'pt-BR', { numeric: true }))
  if (semValor.length && regra.semValor !== false) ordenados.push({ id: SEM_VALOR, nome: 'Sem valor', cor: COR_NEUTRA, tarefas: semValor })
  return ordenados
}
