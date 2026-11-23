import { camposOferecidos, EntradaFormularioSchema, configuracaoFormulario, type ConfigFormulario, type TipoPergunta, type RespostasFormulario, type EntradaFormulario, type CampoFormulario } from '@/dominio/formularios'
import { gerarToken } from '@/dominio/token'
import type { Supabase } from '@/infra/supabase/servidor'
import type { Json } from '@/infra/supabase/tipos'
import { dadosGestaoCampos } from './campos-gestao'
import { listarClientes } from './clientes-plataforma'
import { dados } from './resultado'
import { listarEquipe } from './usuarios'

export type Formulario = {
  id: string
  listaId: string
  clienteId: string | null
  responsavelId: string
  nome: string
  descricao: string | null
  token: string
  ativo: boolean
  /** Landing page (src/dominio/landings.ts) cujos envios este formulário recebe. */
  landing: string | null
  campos: CampoFormulario[]
  configuracao: ConfigFormulario
  temRascunho: boolean
  publicadoEm: string | null
  totalRespostas: number
}

export type ListaDoFormulario = { id: string; caminho: string; oferecidos: CampoFormulario[] }

export type DadosFormularios = {
  formularios: Formulario[]
  listas: ListaDoFormulario[]
  clientes: { id: string; nome: string }[]
  equipe: { id: string; nome: string }[]
}

// Mensagens de validação seguras para a tela; erros técnicos continuam tratados por tentar().
const erroFormulario = (mensagem: string) => Object.assign(new Error(mensagem), { code: 'P0001' })

/** Gestão compartilhada pela tela e pelo MCP; RLS e gatilho conferem acesso e campos da lista. */
export async function salvarFormulario(sb: Supabase, id: string | null, entrada: EntradaFormulario, publicar = true): Promise<string> {
  const validacao = EntradaFormularioSchema.safeParse(entrada)
  if (!validacao.success) throw erroFormulario(validacao.error.issues[0].message)
  const e = validacao.data
  const configuracao = configuracaoFormulario(e.configuracao)
  if (configuracao.duplicadoPor && !e.campos.some((c) => c.key === configuracao.duplicadoPor)) throw erroFormulario('Escolha uma pergunta existente para limitar envios duplicados.')
  const base = { list_id: e.listaId, client_id: e.clienteId, assignee_id: e.responsavelId, name: e.nome, description: e.descricao || null, landing: e.landing, fields: e.campos as unknown as Json, settings: configuracao as unknown as Json }
  const { data, error } = id
    ? await sb.from('forms').update(publicar ? { ...base, draft: null, published_at: new Date().toISOString(), active: true } : { draft: { ...e, configuracao } as unknown as Json }).eq('id', id).is('archived_at', null).select('id').maybeSingle()
    : await sb.from('forms').insert({ ...base, landing: publicar ? base.landing : null, active: publicar, published_at: publicar ? new Date().toISOString() : null, draft: publicar ? null : { ...e, configuracao } as unknown as Json, token: gerarToken() }).select('id').single()
  if (error?.code === '23505' && e.landing) throw erroFormulario('Esta landing page já está ligada a outro formulário. Desvincule-a antes de continuar.')
  if (error) throw error
  if (!data) throw erroFormulario('Formulário não encontrado, arquivado ou sem permissão para editar.')
  return data.id
}

export async function alternarFormulario(sb: Supabase, id: string, ativo: boolean): Promise<void> {
  const { data, error } = await sb.from('forms').update({ active: ativo }).eq('id', id).is('archived_at', null).select('id').maybeSingle()
  if (error) throw error
  if (!data) throw erroFormulario('Formulário não encontrado, arquivado ou sem permissão para alterar.')
}

export async function arquivarFormulario(sb: Supabase, id: string): Promise<void> {
  const { data, error } = await sb.from('forms').update({ archived_at: new Date().toISOString(), active: false }).eq('id', id).is('archived_at', null).select('id').maybeSingle()
  if (error) throw error
  if (!data) throw erroFormulario('Formulário não encontrado, já arquivado ou sem permissão para arquivar.')
}

/** Tela de gestão (admin): formulários ativos e o que a gestão precisa para criar e editar. */
export async function dadosFormularios(sb: Supabase): Promise<DadosFormularios> {
  const [gestao, linhas, clientes, equipe] = await Promise.all([
    dadosGestaoCampos(sb),
    sb.from('forms').select('id, list_id, client_id, assignee_id, name, description, token, active, landing, fields, settings, draft, published_at').is('archived_at', null).order('created_at'),
    listarClientes(sb),
    listarEquipe(sb),
  ])
  return {
    formularios: await Promise.all(dados(linhas).map(async (f) => {
      const rascunho = EntradaFormularioSchema.safeParse(f.draft)
      const e = rascunho.success ? rascunho.data : null
      const { count, error } = await sb.from('form_submissions').select('id', { count: 'exact', head: true }).eq('form_id', f.id)
      if (error) throw error
      return { id: f.id, listaId: e?.listaId ?? f.list_id, clienteId: e ? e.clienteId : f.client_id, responsavelId: e?.responsavelId ?? f.assignee_id,
        nome: e?.nome ?? f.name, descricao: e?.descricao ?? f.description, token: f.token, ativo: f.active, landing: e ? e.landing : f.landing,
        campos: e?.campos ?? f.fields as CampoFormulario[], configuracao: configuracaoFormulario(e?.configuracao ?? f.settings),
        temRascunho: !!f.draft, publicadoEm: f.published_at, totalRespostas: count ?? 0,
      }
    })),
    listas: gestao.listas.map((l) => ({
      id: l.id,
      caminho: l.caminho,
      oferecidos: camposOferecidos(gestao.campos.filter((c) => c.listaIds.includes(l.id))),
    })),
    clientes: clientes.map((c) => ({ id: c.id, nome: c.nome })),
    equipe: equipe.map((p) => ({ id: p.id, nome: p.nome })),
  }
}

export type CampoPublico = CampoFormulario & { tipo: TipoPergunta; opcoes: string[] }
export type FormularioPublico = { nome: string; descricao: string | null; campos: CampoPublico[]; configuracao?: ConfigFormulario }

/** Usa o cliente de serviço: quem preenche não tem login. Só devolve formulário ativo. */
export async function buscarFormularioPublico(sb: Supabase, token: string): Promise<FormularioPublico | null> {
  const { data } = await sb.from('forms').select('name, description, fields, settings').eq('token', token).eq('active', true).is('archived_at', null).maybeSingle()
  if (!data) return null
  const campos = data.fields as CampoFormulario[]
  const ids = campos.map((c) => c.key).filter((k) => /^[0-9a-f-]{36}$/i.test(k))
  const defs = ids.length ? dados(await sb.from('custom_fields').select('id, type, config').in('id', ids)) : []
  const porId = new Map(defs.map((d) => [d.id, d]))
  return {
    nome: data.name,
    descricao: data.description,
    configuracao: configuracaoFormulario(data.settings),
    campos: campos.map((c) => {
      const d = porId.get(c.key)
      return { ...c, tipo: c.tipo ?? (d?.type as TipoPergunta) ?? (c.key === 'description' ? 'long_text' : 'text'), opcoes: c.opcoes ?? ((d?.config as { options?: string[] } | undefined)?.options ?? []) }
    }),
  }
}

/** Cria a tarefa do formulário e devolve o id dela. */
export async function enviarFormulario(sb: Supabase, token: string, respostas: Json): Promise<string> {
  const { data, error } = await sb.rpc('enviar_formulario', { p_token: token, p_respostas: respostas })
  if (error) throw error
  return data
}

/** Token do formulário ativo ligado a uma landing (cliente de serviço: quem envia não tem login). null = nenhum ligado. */
export async function tokenDoFormularioDaLanding(sb: Supabase, landing: string): Promise<string | null> {
  const { data } = await sb.from('forms').select('token').eq('landing', landing).eq('active', true).is('archived_at', null).maybeSingle()
  return data?.token ?? null
}

export type RespostaFormulario = { id: string; tarefaId: string | null; respostas: RespostasFormulario; perguntas: CampoFormulario[]; pontuacao: number; origem: Record<string, string>; criadaEm: string }
export async function respostasFormulario(sb: Supabase, formularioId: string, pagina = 0, ate?: string): Promise<{ itens: RespostaFormulario[]; total: number }> {
  let consulta = sb.from('form_submissions').select('id, task_id, answers, questions, score, attribution, created_at', { count: 'exact' }).eq('form_id', formularioId)
  if (ate) consulta = consulta.lte('created_at', ate)
  const { data, error, count } = await consulta.order('created_at', { ascending: false }).order('id', { ascending: false }).range(pagina * 50, pagina * 50 + 49)
  if (error) throw error
  return { itens: (data ?? []).map((r) => ({ id: r.id, tarefaId: r.task_id, respostas: r.answers as RespostasFormulario, perguntas: r.questions as CampoFormulario[], pontuacao: r.score, origem: r.attribution as Record<string, string>, criadaEm: r.created_at })), total: count ?? 0 }
}
export async function duplicarFormulario(sb: Supabase, formularioId: string): Promise<string> {
  const { data, error } = await sb.from('forms').select('list_id,client_id,assignee_id,name,description,fields,settings,draft').eq('id', formularioId).is('archived_at', null).maybeSingle()
  if (error) throw error
  if (!data) throw erroFormulario('Formulário não encontrado.')
  const rascunho = EntradaFormularioSchema.safeParse(data.draft)
  const e = rascunho.success ? rascunho.data : { listaId: data.list_id, clienteId: data.client_id, responsavelId: data.assignee_id, nome: data.name, descricao: data.description ?? '', landing: null, campos: data.fields as CampoFormulario[], configuracao: configuracaoFormulario(data.settings) }
  return salvarFormulario(sb, null, { ...e, nome: `${e.nome.slice(0, 110)} (cópia)`, landing: null }, false)
}

export async function publicarRascunhoFormulario(sb: Supabase, formularioId: string): Promise<void> {
  const { data, error } = await sb.from('forms').select('draft').eq('id', formularioId).is('archived_at', null).maybeSingle()
  if (error) throw error
  if (!data?.draft) throw erroFormulario('Não há rascunho salvo para publicar.')
  const entrada = EntradaFormularioSchema.safeParse(data.draft)
  if (!entrada.success) throw erroFormulario('O rascunho está inválido. Abra o editor e confira os campos.')
  await salvarFormulario(sb, formularioId, entrada.data, true)
}
