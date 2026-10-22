import type { Categoria } from '@/dominio/tarefas'
import { dataDeHoje } from '@/dominio/filtros'
import { montarPainel, type LinhaBase, type Painel, type RegistroPainel, type TarefaPainel } from '@/dominio/painel-projetos'
import type { Supabase } from '@/infra/supabase/servidor'
import { criarLista } from './estrutura'
import { statusDasListas } from './listas'
import { dados } from './resultado'

export type ListaProjetos = { id: string; nome: string; cor: string }
export type Projeto = { id: string; nome: string; cor: string; clienteId: string | null; clienteNome: string | null }

/** A lista marcada como "de projetos" (null se ainda não foi configurada ou sem a migration). */
export async function listaDeProjetos(sb: Supabase): Promise<ListaProjetos | null> {
  const { data, error } = await sb.from('lists').select('id, name, color').eq('is_projects', true).is('archived_at', null).maybeSingle()
  if (error) throw error
  return data ? { id: data.id, nome: data.name, cor: data.color } : null
}

/** Marca a lista solta "Projetos" que já existir ou cria uma (já vem com os status padrão). */
export async function configurarProjetos(sb: Supabase): Promise<string> {
  const { data: existente, error } = await sb.from('lists').select('id').ilike('name', 'projetos').is('space_id', null).is('archived_at', null).limit(1).maybeSingle()
  if (error) throw error
  const id = existente?.id ?? (await criarLista(sb, { espacoId: null, pastaId: null, nome: 'Projetos', mes: null, cor: '#073f3b', icone: 'briefcase' }))
  dados(await sb.from('lists').update({ is_projects: true }).eq('id', id).select('id'))
  return id
}

/** Listas (projetos) do espaço, sem as arquivadas, na ordem da navegação. */
export async function projetosDoEspaco(sb: Supabase, espacoId: string): Promise<Projeto[]> {
  const linhas = dados(await sb.from('lists').select('id, name, color, client_id, clients(name)').eq('space_id', espacoId).is('archived_at', null).order('position'))
  return linhas.map((l) => ({ id: l.id, nome: l.name, cor: l.color, clienteId: l.client_id, clienteNome: l.clients?.name ?? null }))
}

/**
 * Tarefas (com subtarefas) e registros de tempo das listas. `usuarioId` filtra o tempo de uma pessoa
 * (as tarefas são do projeto todo). A RLS só devolve o que a pessoa pode ver.
 */
export async function dadosDoPainel(sb: Supabase, listaIds: string[], usuarioId: string | null): Promise<{ tarefas: TarefaPainel[]; registros: RegistroPainel[] }> {
  if (!listaIds.length) return { tarefas: [], registros: [] }
  let qTempo = sb.from('time_entries').select('task_id, user_id, started_at, ended_at, duration_seconds, tasks!inner(list_id)').in('tasks.list_id', listaIds)
  if (usuarioId) qTempo = qTempo.eq('user_id', usuarioId)
  const [linhas, status, tempo] = await Promise.all([
    sb.from('tasks').select('id, parent_task_id, list_id, title, status_id, completed_at, due_date').in('list_id', listaIds).is('archived_at', null).then(dados),
    statusDasListas(sb, listaIds),
    qTempo.then(dados),
  ])
  const categoria = new Map(Object.values(status).flat().map((s) => [s.id, s.categoria as Categoria]))
  return {
    tarefas: linhas.map((t) => ({ id: t.id, paiId: t.parent_task_id, listaId: t.list_id, titulo: t.title, categoria: categoria.get(t.status_id) ?? 'todo', concluidaEm: t.completed_at, prazo: t.due_date })),
    registros: tempo.map((r) => ({ tarefaId: r.task_id, usuarioId: r.user_id, inicio: r.started_at, fim: r.ended_at, segundos: r.duration_seconds })),
  }
}

/**
 * Painel de um escopo. No espaço de projetos, uma linha por projeto (lista); dentro de um projeto, uma linha por
 * tarefa principal (as subtarefas somam nela). `usuarioId` = só o tempo dessa pessoa; null = equipe toda.
 */
export async function painelDoEscopo(sb: Supabase, escopo: { espacoId: string } | { listaId: string; cor: string }, opcoes: { dias: number; usuarioId: string | null; agora: Date }): Promise<Painel> {
  let linhas: LinhaBase[]
  let linhaDa: (t: TarefaPainel) => string | null
  let base: Awaited<ReturnType<typeof dadosDoPainel>>
  if ('espacoId' in escopo) {
    const projetos = await projetosDoEspaco(sb, escopo.espacoId)
    base = await dadosDoPainel(sb, projetos.map((p) => p.id), opcoes.usuarioId)
    linhas = projetos.map((p) => ({ id: p.id, nome: p.nome, cor: p.cor, href: `/listas/${p.id}`, detalhe: p.clienteNome ?? undefined }))
    linhaDa = (t) => t.listaId
  } else {
    base = await dadosDoPainel(sb, [escopo.listaId], opcoes.usuarioId)
    const pai = new Map(base.tarefas.map((t) => [t.id, t.paiId]))
    const raiz = (id: string) => {
      let atual = id
      for (let p = pai.get(atual); p; p = pai.get(atual)) atual = p
      return atual
    }
    const subtarefas = new Map<string, number>()
    for (const t of base.tarefas) if (t.paiId) subtarefas.set(raiz(t.id), (subtarefas.get(raiz(t.id)) ?? 0) + 1)
    linhas = base.tarefas.filter((t) => !t.paiId).map((t) => ({ id: t.id, nome: t.titulo, cor: escopo.cor, href: `/tarefas/${t.id}`, detalhe: subtarefas.get(t.id) ? `${subtarefas.get(t.id)} subtarefas` : undefined }))
    linhaDa = (t) => raiz(t.id)
  }
  return montarPainel({ linhas, linhaDa, ...base, hoje: dataDeHoje(opcoes.agora), dias: opcoes.dias, agoraMs: opcoes.agora.getTime() })
}
