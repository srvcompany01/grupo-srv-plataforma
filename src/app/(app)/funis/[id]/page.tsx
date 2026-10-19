import { notFound } from 'next/navigation'
import { EditorFunil } from '@/componentes/telas/EditorFunil'
import { lerDadosFunil } from '@/dominio/funil'
import { exigirEquipe } from '@/infra/supabase/sessao'
import { criarClienteServidor } from '@/infra/supabase/servidor'
import { buscarTela } from '@/servicos/telas'

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export default async function PaginaFunil({ params }: PageProps<'/funis/[id]'>) {
  const { id } = await params
  if (!UUID.test(id)) notFound()
  await exigirEquipe()
  const tela = await buscarTela(await criarClienteServidor(), 'funil', id)
  if (!tela) notFound()
  return <EditorFunil key={tela.id} id={tela.id} titulo={tela.titulo} dadosIniciais={lerDadosFunil(tela.dados)} />
}
