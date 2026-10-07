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
import { listarClientes } from '@/servicos/clientes-plataforma'
import { TelaTarefa } from './tela/TelaTarefa'

/** Carrega tudo da tarefa (como o usuário logado) e renderiza o detalhe. 404 se a RLS esconder. */
export async function CarregarTarefa({ id, emJanela = false }: { id: string; emJanela?: boolean }) {
  const eu = await exigirEquipe()
  const sb = await criarClienteServidor()
  const tarefa = await buscarTarefa(sb, id)
  if (!tarefa) notFound()
  const [lista, equipe, tags, listas, comentarios, atividade, camposPersonalizados, tempo, cronometro, pessoas, clientes] = await Promise.all([
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
    listarClientes(sb),
  ])
  return (
    <TelaTarefa
      key={tarefa.id}
      tarefa={tarefa}
      status={lista?.status ?? []}
      equipe={equipe}
      tags={tags}
      tagsCliente={clientes
        .filter((cliente) => cliente.status !== 'encerrado' || cliente.id === tarefa.lista.clienteId)
        .map((cliente) => ({ id: cliente.id, nome: cliente.nome, cor: cliente.cor }))}
      listas={listas}
      comentarios={comentarios}
      atividade={atividade}
      camposPersonalizados={camposPersonalizados}
      euId={eu.id}
      podeGerir={lista?.podeGerir ?? false}
      hoje={dataDeHoje(new Date())}
      tempo={tempo}
      cronometro={cronometro}
      pessoas={pessoas}
      emJanela={emJanela}
    />
  )
}
