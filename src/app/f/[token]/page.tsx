import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { criarClienteAdmin } from '@/infra/supabase/admin'
import { buscarFormularioPublico } from '@/servicos/formularios'
import { FormularioPublico } from './FormularioPublico'

export const metadata: Metadata = { robots: { index: false, follow: false } }

export default async function PaginaFormulario({ params }: PageProps<'/f/[token]'>) {
  const { token } = await params
  const formulario = await buscarFormularioPublico(criarClienteAdmin(), token)
  if (!formulario) notFound()
  return (
    <main className="mx-auto max-w-[560px] space-y-4 p-4 py-10">
      <header>
        <h1 className="text-xl font-semibold">{formulario.nome}</h1>
        {formulario.descricao && <p className="mt-1 text-corpo text-texto-2">{formulario.descricao}</p>}
      </header>
      <FormularioPublico token={token} formulario={formulario} />
    </main>
  )
}
