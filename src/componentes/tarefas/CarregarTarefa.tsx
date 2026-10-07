import { notFound } from 'next/navigation'
import { dataDeHoje } from '@/dominio/filtros'
import { exigirEquipe } from '@/infra/supabase/sessao'
import { criarClienteServidor } from '@/infra/supabase/servidor'
import { listarComentarios, pessoasDaTarefa } from '@/servicos/comentarios'
import { buscarLista, listarListasVisiveis, listarTags } from '@/servicos/listas'
import { buscarTarefa, listarAtividade } from '@/servicos/tarefas'
import { cronometroAtivo, listarTempo } from '@/servicos/tempo'
import { listarEquipe } from '@/servicos/usuarios'
import { listarCamposDaTarefa } from '@/servicos/campos-personalizados'
import { DetalheTarefa } from './DetalheTarefa'

/** Carrega tudo da tarefa (como o usuário logado) e renderiza o detalhe. 404 se a RLS esconder. */
export async function CarregarTarefa({ id, noPainel = false }: { id: string; noPainel?: boolean }) {
  const eu = await exigirEquipe()
  const sb = await criarClienteServidor()
  const tarefa = await buscarTarefa(sb, id)
  if (!tarefa) notFound()
  // registrosTempo, cronometro e pessoas ainda não vão para DetalheTarefa (a Task 6 liga as props).
  const [lista, equipe, tags, listas, comentarios, atividade, camposPersonalizados, , , ] = await Promise.all([
    buscarLista(sb, tarefa.lista.id),
    listarEquipe(sb),
    listarTags(sb, tarefa.lista.espacoId),
    listarListasVisiveis(sb),
    listarComentarios(sb, id),
    listarAtividade(sb, id),
    listarCamposDaTarefa(sb, id, tarefa.lista.id),
    listarTempo(sb, id),
    cronometroAtivo(sb, eu.id),
    pessoasDaTarefa(sb, id),
  ])
  return (
    <DetalheTarefa
      tarefa={tarefa}
      status={lista?.status ?? []}
      equipe={equipe}
      tags={tags}
      listas={listas}
      comentarios={comentarios}
      atividade={atividade}
      camposPersonalizados={camposPersonalizados}
      euId={eu.id}
      podeGerir={lista?.podeGerir ?? false}
      hoje={dataDeHoje(new Date())}
      noPainel={noPainel}
    />
  )
}
