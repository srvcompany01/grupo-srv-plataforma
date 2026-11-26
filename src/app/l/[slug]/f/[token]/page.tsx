import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { criarClienteAdmin } from '@/infra/supabase/admin'
import { configuracaoParaNavegador } from '@/dominio/formularios'
import { buscarFormularioPublico } from '@/servicos/formularios'
import { FormularioPublico } from '@/app/f/[token]/FormularioPublico'

export const metadata: Metadata = { robots: { index: false, follow: false } }

export default async function FormularioBiolytics({ params }: PageProps<'/l/[slug]/f/[token]'>) {
  const { slug, token } = await params
  const formulario = await buscarFormularioPublico(criarClienteAdmin(), token, slug)
  if (!formulario) notFound()
  return <main><FormularioPublico token={token} formulario={{ ...formulario, configuracao: formulario.configuracao && configuracaoParaNavegador(formulario.configuracao) }} /></main>
}
