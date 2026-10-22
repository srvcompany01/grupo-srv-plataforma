import { notFound, redirect } from 'next/navigation'
import { exigirCliente } from '@/infra/supabase/sessao'
import { linkDoUsuario } from '@/servicos/portal-conteudo'

/** O portal agora é o link do cliente (sem login). Quem ainda entra pelo login vai para lá. */
export default async function Portal() {
  const eu = await exigirCliente()
  const slug = await linkDoUsuario(eu.id).catch(() => null)
  if (!slug) notFound()
  redirect(`/cliente/${slug}`)
}
