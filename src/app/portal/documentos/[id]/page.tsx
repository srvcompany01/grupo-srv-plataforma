import { notFound, redirect } from 'next/navigation'
import { exigirCliente } from '@/infra/supabase/sessao'
import { linkDoUsuario } from '@/servicos/portal-conteudo'

/** Endereço antigo do portal: leva ao documento no link do cliente. */
export default async function PortalDocumento({ params }: PageProps<'/portal/documentos/[id]'>) {
  const { id } = await params
  const eu = await exigirCliente()
  const slug = await linkDoUsuario(eu.id).catch(() => null)
  if (!slug) notFound()
  redirect(`/cliente/${slug}/documentos/${id}`)
}
