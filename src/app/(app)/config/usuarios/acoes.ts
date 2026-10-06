'use server'

import { revalidatePath } from 'next/cache'
import type { PapelUsuario } from '@/dominio/acesso'
import { validarConvite } from '@/dominio/convite'
import { criarClienteAdmin } from '@/infra/supabase/admin'
import { exigirAdmin } from '@/infra/supabase/sessao'
import { criarClienteServidor } from '@/infra/supabase/servidor'
import { urlBase } from '@/lib/url'
import { tentar, type Resultado } from '@/servicos/acao'

/** Campos: email, nome, papel, clienteId, espaco (repetido, "id:gestor|membro"). */
export async function convidarUsuario(_: Resultado, form: FormData): Promise<Resultado> {
  await exigirAdmin() // obrigatório antes da chave mestra
  const v = validarConvite({
    email: String(form.get('email') ?? ''),
    nome: String(form.get('nome') ?? ''),
    papel: String(form.get('papel') ?? '') as PapelUsuario,
    clienteId: String(form.get('clienteId') ?? '') || undefined,
    espacos: form
      .getAll('espaco')
      .map(String)
      .filter(Boolean)
      .map((s) => {
        const [id, papel] = s.split(':')
        return { id, papel: papel === 'gestor' ? ('gestor' as const) : ('membro' as const) }
      }),
  })
  if (!v.ok) return { erro: v.erro }
  const d = v.dados
  const admin = criarClienteAdmin()

  const { data, error } = await admin.auth.admin.inviteUserByEmail(d.email, {
    data: { full_name: d.nome },
    redirectTo: `${await urlBase()}/auth/confirmar`,
  })
  if (error || !data.user) {
    if (error?.status === 422 || /already/i.test(error?.message ?? '')) return { erro: 'Já existe um usuário com este e-mail.' }
    if (error?.status === 429) return { erro: 'Limite de e-mails atingido. Tente de novo mais tarde.' }
    console.error(error)
    return { erro: 'Não foi possível enviar o convite.' }
  }
  const id = data.user.id

  try {
    const perfil = await admin.from('profiles').update({ role: d.papel, active: true, full_name: d.nome }).eq('id', id)
    if (perfil.error) throw perfil.error
    if (d.papel === 'cliente') {
      const r = await admin.from('client_users').insert({ user_id: id, client_id: d.clienteId! })
      if (r.error) throw r.error
    } else if (d.espacos.length) {
      const r = await admin.from('space_members').insert(d.espacos.map((e) => ({ space_id: e.id, user_id: id, role: e.papel })))
      if (r.error) throw r.error
    }
  } catch (e) {
    // Não deixa usuário pela metade: desfaz o convite.
    console.error(e)
    await admin.auth.admin.deleteUser(id)
    return { erro: 'Não foi possível concluir o convite. Nada foi criado.' }
  }

  revalidatePath('/config/usuarios')
  revalidatePath(`/clientes/${d.clienteId ?? ''}`)
  return { ok: `Convite enviado para ${d.email}.` }
}

export async function alterarPapel(usuarioId: string, papel: PapelUsuario): Promise<Resultado> {
  await exigirAdmin()
  if (!['admin', 'gestor', 'membro'].includes(papel)) return { erro: 'Papel inválido.' }
  const sb = await criarClienteServidor()
  const atual = await sb.from('profiles').select('role').eq('id', usuarioId).maybeSingle()
  if (atual.data?.role === 'cliente') return { erro: 'Usuário de cliente não pode virar membro da equipe.' }
  const r = await tentar(async () => {
    const { error } = await sb.from('profiles').update({ role: papel }).eq('id', usuarioId)
    if (error) throw error
  })
  revalidatePath('/config/usuarios')
  return r
}

export async function definirAtivo(usuarioId: string, ativo: boolean): Promise<Resultado> {
  const eu = await exigirAdmin()
  if (usuarioId === eu.id) return { erro: 'Você não pode desativar a própria conta.' }
  const sb = await criarClienteServidor()
  const r = await tentar(async () => {
    const { error } = await sb.from('profiles').update({ active: ativo }).eq('id', usuarioId)
    if (error) throw error
  }, ativo ? 'Usuário reativado.' : 'Usuário desativado.')
  revalidatePath('/config/usuarios')
  return r
}
