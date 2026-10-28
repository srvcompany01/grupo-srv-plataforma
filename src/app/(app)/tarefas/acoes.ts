'use server'

import { revalidatePath } from 'next/cache'
import { normalizarMime, validarAnexo, validarAnexosComentario } from '@/dominio/anexos'
import { extrairMencoes } from '@/dominio/mencoes'
import type { Categoria } from '@/dominio/tarefas'
import { gerarChaveTarefa, urlUpload } from '@/infra/r2'
import { exigirEquipe } from '@/infra/supabase/sessao'
import { criarClienteServidor } from '@/infra/supabase/servidor'
import { tentar, type Resultado } from '@/servicos/acao'
import * as comentarios from '@/servicos/comentarios'
import * as modelos from '@/servicos/modelos'
import * as status from '@/servicos/status'
import * as recorrencias from '@/servicos/recorrencias'
import * as tarefas from '@/servicos/tarefas'
import * as tempo from '@/servicos/tempo'

// Ações de tarefa usadas pela lista, pelo Kanban, pelo departamento e pelo painel da tarefa.
// Tudo pelo cliente do usuário: a RLS e as regras do banco decidem.

async function executar(fn: (sb: Awaited<ReturnType<typeof criarClienteServidor>>) => Promise<unknown>, ok?: string) {
  await exigirEquipe()
  const sb = await criarClienteServidor()
  const r = await tentar(() => fn(sb), ok)
  revalidatePath('/', 'layout')
  return r
}

export async function criarTarefaAcao(d: {
  listaId: string
  titulo: string
  responsaveis: string[]
  paiId?: string | null
  statusId?: string | null
}): Promise<Resultado> {
  if (!d.titulo.trim()) return { erro: 'Informe o título.' }
  return executar((sb) => tarefas.criarTarefa(sb, { ...d, titulo: d.titulo.trim() }), 'Tarefa criada.')
}

export async function atualizarTarefaAcao(id: string, campos: tarefas.CamposTarefa): Promise<Resultado> {
  if (campos.titulo !== undefined && !campos.titulo.trim()) return { erro: 'O título não pode ficar vazio.' }
  return executar((sb) => tarefas.atualizarTarefa(sb, id, campos))
}

export async function definirRecorrenciaAcao(id: string, regra: Parameters<typeof recorrencias.definirRecorrencia>[2]): Promise<Resultado> {
  if (regra && (!Number.isInteger(regra.cada) || regra.cada < 1 || regra.cada > 365 || !Number.isInteger(regra.antecedencia) || regra.antecedencia < 0 || regra.antecedencia > 60 || !/^\d{4}-\d{2}-\d{2}$/.test(regra.primeiroPrazo)))
    return { erro: 'Confira o intervalo, a antecedência e o primeiro prazo.' }
  return executar((sb) => recorrencias.definirRecorrencia(sb, id, regra), regra ? 'Repetição salva.' : 'Repetição removida.')
}

export async function definirResponsaveisAcao(id: string, ids: string[]): Promise<Resultado> {
  return executar((sb) => tarefas.definirResponsaveis(sb, id, ids))
}

export async function moverTarefaAcao(id: string, statusId: string, posicao: string): Promise<Resultado> {
  return executar((sb) => tarefas.moverTarefa(sb, id, statusId, posicao))
}

export async function moverParaListaAcao(id: string, listaId: string): Promise<Resultado> {
  return executar((sb) => tarefas.moverParaLista(sb, id, listaId), 'Tarefa movida.')
}

export async function arquivarTarefaAcao(id: string): Promise<Resultado> {
  return executar((sb) => tarefas.arquivarTarefa(sb, id), 'Tarefa arquivada.')
}

export async function arquivarTarefasAcao(ids: string[]): Promise<Resultado> {
  const unicos = [...new Set(ids)].slice(0, 200)
  if (!unicos.length) return { erro: 'Selecione ao menos uma tarefa.' }
  return executar((sb) => tarefas.arquivarTarefas(sb, unicos), `${unicos.length} ${unicos.length === 1 ? 'tarefa excluída' : 'tarefas excluídas'}.`)
}

export async function criarStatusAcao(listaId: string, nome: string, cor: string, categoria: Categoria): Promise<Resultado> {
  if (!nome.trim()) return { erro: 'Informe o nome do status.' }
  return executar((sb) => status.criarStatus(sb, listaId, nome.trim(), cor, categoria), 'Status criado.')
}

export async function atualizarStatusAcao(id: string, campos: { nome?: string; cor?: string; categoria?: Categoria }): Promise<Resultado> {
  return executar((sb) => status.atualizarStatus(sb, id, campos))
}

export async function removerStatusAcao(id: string, destinoId: string): Promise<Resultado> {
  return executar((sb) => status.removerStatus(sb, id, destinoId), 'Status removido.')
}

export async function reposicionarStatusAcao(id: string, antes: string | null, depois: string | null): Promise<Resultado> {
  return executar((sb) => status.reposicionarStatus(sb, id, antes, depois))
}

export async function definirEtiquetaAcao(tarefaId: string, tagId: string, ligada: boolean): Promise<Resultado> {
  return executar((sb) => tarefas.definirEtiqueta(sb, tarefaId, tagId, ligada))
}

export async function criarEtiquetaAcao(tarefaId: string, espacoId: string, nome: string, cor: string): Promise<Resultado> {
  if (!nome.trim()) return { erro: 'Informe o nome da etiqueta.' }
  return executar(async (sb) => {
    const tagId = await tarefas.criarEtiqueta(sb, espacoId, nome.trim(), cor)
    await tarefas.definirEtiqueta(sb, tarefaId, tagId, true)
  })
}

export async function comentarAcao(
  tarefaId: string,
  texto: string,
  interno: boolean,
  mencoes: string[],
  anexos: comentarios.NovoAnexo[],
): Promise<Resultado> {
  if (!texto.trim() && !anexos.length) return { erro: 'Escreva o comentário ou anexe um arquivo.' }
  const anexoInvalido = validarAnexosComentario(tarefaId, anexos)
  if (anexoInvalido) return { erro: anexoInvalido }
  // Menções saem do próprio texto: ninguém é avisado sem aparecer no comentário.
  const mencoesDoTexto = extrairMencoes(texto).filter((id) => mencoes.includes(id))
  return executar((sb) =>
    comentarios.criarComentario(sb, {
      tarefaId,
      texto: texto.trim(),
      interno,
      mencoes: mencoesDoTexto,
      anexos: anexos.map((a) => ({ ...a, mime: normalizarMime(a.mime) })),
    }),
  )
}

export async function prepararEnvioAnexoAcao(
  tarefaId: string,
  a: { nome: string; mime: string; tamanho: number },
): Promise<{ chave: string; url: string } | { erro: string }> {
  await exigirEquipe()
  const mime = normalizarMime(a.mime)
  const invalido = validarAnexo({ mime, tamanho: a.tamanho })
  if (invalido) return { erro: invalido }
  try {
    const sb = await criarClienteServidor()
    if (!(await tarefas.buscarTarefa(sb, tarefaId))) return { erro: 'Você não tem permissão para isso.' }
    const chave = gerarChaveTarefa(tarefaId, mime)
    return { chave, url: await urlUpload(chave, mime, a.tamanho) }
  } catch (e) {
    console.error(e)
    return { erro: 'Não foi possível preparar o envio. Tente de novo.' }
  }
}

export async function iniciarCronometroAcao(tarefaId: string): Promise<Resultado> {
  const eu = await exigirEquipe()
  const sb = await criarClienteServidor()
  let parado: string | null = null
  const r = await tentar(async () => {
    const anterior = await tempo.cronometroAtivo(sb, eu.id)
    await tempo.iniciarCronometro(sb, tarefaId)
    if (anterior && anterior.tarefaId !== tarefaId) parado = anterior.tarefaTitulo
  }, 'Cronômetro iniciado.')
  revalidatePath('/', 'layout')
  return r?.ok && parado ? { ok: `Parou o cronômetro de ${parado}` } : r
}

export async function pararCronometroAcao(): Promise<Resultado> {
  return executar((sb) => tempo.pararCronometro(sb), 'Cronômetro parado.')
}

export async function lancarTempoAcao(tarefaId: string, data: string, minutos: number, nota: string): Promise<Resultado> {
  return executar((sb) => tempo.lancarTempo(sb, tarefaId, data, minutos, nota.trim() || null), 'Tempo lançado.')
}

export async function editarTempoAcao(id: string, minutos: number, nota: string): Promise<Resultado> {
  if (!Number.isInteger(minutos) || minutos < 1 || minutos > 1440) return { erro: 'O tempo deve ficar entre 1 e 1440 minutos.' }
  return executar((sb) => tempo.editarTempo(sb, id, minutos, nota.trim() || null))
}

export async function apagarTempoAcao(id: string): Promise<Resultado> {
  return executar((sb) => tempo.apagarTempo(sb, id), 'Registro apagado.')
}

export async function editarComentarioAcao(id: string, texto: string): Promise<Resultado> {
  if (!texto.trim()) return { erro: 'O comentário não pode ficar vazio.' }
  return executar((sb) => comentarios.editarComentario(sb, id, texto.trim()))
}

export async function apagarComentarioAcao(id: string): Promise<Resultado> {
  return executar((sb) => comentarios.apagarComentario(sb, id))
}

export async function criarDoModeloAcao(modeloId: string, listaId: string): Promise<Resultado> {
  const eu = await exigirEquipe()
  return executar((sb) => modelos.criarDoModelo(sb, modeloId, listaId, eu.id), 'Tarefa criada a partir do modelo.')
}

export async function salvarModeloAcao(m: { nome: string; titulo: string; subtarefas: string[] }): Promise<Resultado> {
  const nome = m.nome.trim()
  const titulo = m.titulo.trim()
  const subtarefas = m.subtarefas.map((s) => s.trim()).filter(Boolean).slice(0, 30)
  if (!nome || nome.length > 80 || !titulo || titulo.length > 200) return { erro: 'Informe o nome do modelo (até 80) e o título da tarefa (até 200).' }
  if (subtarefas.some((s) => s.length > 200)) return { erro: 'Cada subtarefa pode ter até 200 caracteres.' }
  return executar((sb) => modelos.salvarModelo(sb, { nome, titulo, subtarefas }), 'Modelo salvo.')
}

export async function excluirModeloAcao(id: string): Promise<Resultado> {
  return executar((sb) => modelos.excluirModelo(sb, id), 'Modelo excluído.')
}

/** Importação de CSV: cada linha vira uma tarefa na lista (coluna 1 = título; coluna 2 opcional = vencimento AAAA-MM-DD). Máximo de 200 linhas. */
export async function importarTarefasAcao(listaId: string, linhas: { titulo: string; prazo?: string | null }[]): Promise<Resultado> {
  const eu = await exigirEquipe()
  const validas = linhas.map((l) => ({ titulo: l.titulo.trim(), prazo: l.prazo && /^\d{4}-\d{2}-\d{2}$/.test(l.prazo) ? l.prazo : null })).filter((l) => l.titulo && l.titulo.length <= 200)
  if (!validas.length) return { erro: 'Nenhuma linha válida encontrada no arquivo.' }
  if (validas.length > 200) return { erro: 'O arquivo tem mais de 200 linhas. Divida em partes.' }
  return executar(async (sb) => {
    for (const l of validas) {
      const id = await tarefas.criarTarefa(sb, { listaId, titulo: l.titulo, responsaveis: [eu.id] })
      if (l.prazo) await tarefas.atualizarTarefa(sb, id, { prazo: l.prazo })
    }
  }, `${validas.length} ${validas.length === 1 ? 'tarefa importada' : 'tarefas importadas'}.`)
}
