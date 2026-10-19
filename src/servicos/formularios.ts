import { camposOferecidos, type CampoFormulario } from '@/dominio/formularios'
import type { TipoCampoPersonalizado } from '@/dominio/personalizacao'
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
  campos: CampoFormulario[]
}

export type ListaDoFormulario = { id: string; caminho: string; oferecidos: CampoFormulario[] }

export type DadosFormularios = {
  formularios: Formulario[]
  listas: ListaDoFormulario[]
  clientes: { id: string; nome: string }[]
  equipe: { id: string; nome: string }[]
}

/** Tela de gestão (admin): formulários ativos e o que a gestão precisa para criar e editar. */
export async function dadosFormularios(sb: Supabase): Promise<DadosFormularios> {
  const [gestao, linhas, clientes, equipe] = await Promise.all([
    dadosGestaoCampos(sb),
    sb.from('forms').select('id, list_id, client_id, assignee_id, name, description, token, active, fields').is('archived_at', null).order('created_at'),
    listarClientes(sb),
    listarEquipe(sb),
  ])
  return {
    formularios: dados(linhas).map((f) => ({
      id: f.id,
      listaId: f.list_id,
      clienteId: f.client_id,
      responsavelId: f.assignee_id,
      nome: f.name,
      descricao: f.description,
      token: f.token,
      ativo: f.active,
      campos: f.fields as CampoFormulario[],
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

export type CampoPublico = CampoFormulario & { tipo: TipoCampoPersonalizado | null; opcoes: string[] }
export type FormularioPublico = { nome: string; descricao: string | null; campos: CampoPublico[] }

/** Usa o cliente de serviço: quem preenche não tem login. Só devolve formulário ativo. */
export async function buscarFormularioPublico(sb: Supabase, token: string): Promise<FormularioPublico | null> {
  const { data } = await sb.from('forms').select('name, description, fields').eq('token', token).eq('active', true).is('archived_at', null).maybeSingle()
  if (!data) return null
  const campos = data.fields as CampoFormulario[]
  const ids = campos.map((c) => c.key).filter((k) => k !== 'title' && k !== 'description')
  const defs = ids.length ? dados(await sb.from('custom_fields').select('id, type, config').in('id', ids)) : []
  const porId = new Map(defs.map((d) => [d.id, d]))
  return {
    nome: data.name,
    descricao: data.description,
    campos: campos.map((c) => {
      const d = porId.get(c.key)
      return { ...c, tipo: (d?.type as TipoCampoPersonalizado) ?? null, opcoes: ((d?.config as { options?: string[] } | undefined)?.options ?? []) }
    }),
  }
}

/** Cria a tarefa do formulário e devolve o id dela. */
export async function enviarFormulario(sb: Supabase, token: string, respostas: Json): Promise<string> {
  const { data, error } = await sb.rpc('enviar_formulario', { p_token: token, p_respostas: respostas })
  if (error) throw error
  return data
}
