import { notFound } from 'next/navigation'
import { EditorQuadro } from '@/componentes/telas/EditorQuadro'
import { lerDadosQuadro } from '@/dominio/quadro'
import { exigirEquipe } from '@/infra/supabase/sessao'
import { criarClienteServidor } from '@/infra/supabase/servidor'
import { buscarTela } from '@/servicos/telas'

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export default async function PaginaQuadro({ params }: PageProps<'/quadros/[id]'>) {
  const { id } = await params
  if (!UUID.test(id)) notFound()
  await exigirEquipe()
  const tela = await buscarTela(await criarClienteServidor(), 'quadro', id)
  if (!tela) notFound()
  return <EditorQuadro key={tela.id} id={tela.id} titulo={tela.titulo} dadosIniciais={lerDadosQuadro(tela.dados)} />
}
