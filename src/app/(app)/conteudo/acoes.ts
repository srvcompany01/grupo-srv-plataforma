'use server'

import { revalidatePath } from 'next/cache'
import { FORMATOS, type Formato } from '@/dominio/conteudo'
import { TIPOS_ACEITOS, TAMANHO_MAXIMO } from '@/dominio/midias'
import type { TipoMidia } from '@/dominio/tipos'
import { gerarChaveConteudo, urlUpload } from '@/infra/r2'
import { exigirEquipe } from '@/infra/supabase/sessao'
import { criarClienteServidor } from '@/infra/supabase/servidor'
import { tentar, type Resultado } from '@/servicos/acao'
import * as conteudo from '@/servicos/conteudo'
import * as tarefas from '@/servicos/tarefas'
import { instante } from '@/dominio/agenda'
import type { Alvo, ModoPublicacao } from '@/dominio/publicacao'
import { publicarPost } from '@/servicos/publicacao-meta'

// Ações do pipeline de conteúdo. Tudo pelo cliente do usuário: a RLS e as regras do banco decidem.

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const DATA = /^\d{4}-\d{2}-\d{2}$/

async function executar(fn: (sb: Awaited<ReturnType<typeof criarClienteServidor>>) => Promise<unknown>, ok?: string) {
  await exigirEquipe()
  const sb = await criarClienteServidor()
  const r = await tentar(() => fn(sb), ok)
  revalidatePath('/', 'layout')
  return r
}

/**
 * Novo post. Com `paiId`, nasce como SUBTAREFA da tarefa-mãe (lista e cliente vêm dela; o banco já o transforma em post).
 * Sem `paiId`, é um post avulso na lista (precisa do cliente).
 */
export async function criarPostAcao(e: { listaId: string; clienteId: string; titulo: string; formato: string; dataPrevista: string; paiId?: string | null }): Promise<Resultado & { id?: string }> {
  if (!UUID.test(e.listaId)) return { erro: 'Lista inválida.' }
  if (e.paiId ? !UUID.test(e.paiId) : !UUID.test(e.clienteId)) return { erro: 'Escolha a tarefa-mãe ou o cliente.' }
  if (!e.titulo.trim()) return { erro: 'Informe o título do post.' }
  if (!(FORMATOS as readonly string[]).includes(e.formato)) return { erro: 'Escolha o formato.' }
  if (!DATA.test(e.dataPrevista)) return { erro: 'Informe a data prevista.' }
  const eu = await exigirEquipe()
  let id: string | undefined
  const r = await executar(async (sb) => {
    if (e.paiId) {
      id = await tarefas.criarTarefa(sb, { listaId: e.listaId, titulo: e.titulo.trim(), responsaveis: [eu.id], paiId: e.paiId })
      await tarefas.atualizarTarefa(sb, id, { prazo: e.dataPrevista })
      await conteudo.alterarFormato(sb, id, e.formato as Formato)
    } else {
      id = await conteudo.criarPost(sb, { listaId: e.listaId, clienteId: e.clienteId, titulo: e.titulo.trim(), formato: e.formato as Formato, dataPrevista: e.dataPrevista })
    }
  }, 'Post criado.')
  return { ...(r ?? {}), id: r?.erro ? undefined : id }
}

export async function alterarFormatoAcao(tarefaId: string, formato: string): Promise<Resultado> {
  if (!UUID.test(tarefaId) || !(FORMATOS as readonly string[]).includes(formato)) return { erro: 'Formato inválido.' }
  return executar((sb) => conteudo.alterarFormato(sb, tarefaId, formato as Formato), 'Formato alterado.')
}

/** Liga/desliga "lista de conteúdo" (subtarefas viram posts). Só quem gerencia a lista (RLS). */
export async function definirListaConteudoAcao(listaId: string, conteudoLigado: boolean): Promise<Resultado> {
  if (!UUID.test(listaId)) return { erro: 'Lista inválida.' }
  return executar((sb) => conteudo.definirTipoLista(sb, listaId, conteudoLigado ? 'conteudo' : 'tarefas'), conteudoLigado ? 'Pronto: as subtarefas desta lista agora são posts.' : 'A lista voltou a ser de tarefas comuns.')
}

export async function salvarConteudoAcao(tarefaId: string, t: { ideia: string; objetivo: string; legenda: string }): Promise<Resultado & { versao?: number }> {
  if (!UUID.test(tarefaId)) return { erro: 'Post inválido.' }
  let versao: number | undefined
  const r = await executar(async (sb) => {
    versao = await conteudo.salvarTexto(sb, tarefaId, t)
  }, 'Conteúdo salvo.')
  return { ...(r ?? {}), versao: r?.erro ? undefined : versao }
}

/** Passo 1 do upload: valida tipo e tamanho e devolve a URL assinada do R2 e a chave a registrar depois. */
export async function prepararEnvioMidiaAcao(tarefaId: string, a: { nome: string; mime: string; tamanho: number }): Promise<{ chave: string; url: string } | { erro: string }> {
  await exigirEquipe()
  if (!UUID.test(tarefaId)) return { erro: 'Post inválido.' }
  if (!TIPOS_ACEITOS[a.mime]) return { erro: 'Formato não aceito. Use JPG, PNG, WEBP, MP4 ou MOV.' }
  if (!Number.isInteger(a.tamanho) || a.tamanho < 1) return { erro: 'Arquivo vazio.' }
  if (a.tamanho > TAMANHO_MAXIMO) return { erro: 'Arquivo acima de 1 GB.' }
  try {
    const sb = await criarClienteServidor()
    if (!(await conteudo.buscarConteudo(sb, tarefaId))) return { erro: 'Você não tem permissão para isso.' }
    const chave = gerarChaveConteudo(tarefaId, a.mime)
    return { chave, url: await urlUpload(chave, a.mime, a.tamanho) }
  } catch (e) {
    console.error(e)
    return { erro: 'Não foi possível preparar o envio. Tente de novo.' }
  }
}

/** Passo 2 do upload: depois de o arquivo estar no R2, grava a mídia na versão atual do post. */
export async function registrarMidiaAcao(tarefaId: string, m: { chave: string; tipo: TipoMidia; nome: string; tamanho: number }): Promise<Resultado> {
  if (!UUID.test(tarefaId)) return { erro: 'Post inválido.' }
  return executar((sb) => conteudo.registrarMidia(sb, tarefaId, m), 'Mídia adicionada.')
}

export async function removerMidiaAcao(midiaId: string): Promise<Resultado> {
  if (!UUID.test(midiaId)) return { erro: 'Mídia inválida.' }
  return executar((sb) => conteudo.removerMidia(sb, midiaId), 'Mídia removida.')
}

const HORA = /^([01]\d|2[0-3]):[0-5]\d$/

/**
 * Agenda o post. Modo "aprovacao": vai para o portal do cliente (se ainda é rascunho) e só publica depois que ele aprovar.
 * Modo "direto": publica no horário sem aprovação.
 */
export async function agendarPostAcao(tarefaId: string, a: { data: string; hora: string; alvos: Alvo[]; modo: ModoPublicacao }): Promise<Resultado> {
  if (!UUID.test(tarefaId)) return { erro: 'Post inválido.' }
  if (!DATA.test(a.data) || !HORA.test(a.hora)) return { erro: 'Informe o dia e a hora da publicação.' }
  if (a.modo !== 'aprovacao' && a.modo !== 'direto') return { erro: 'Modo inválido.' }
  await exigirEquipe()
  const sb = await criarClienteServidor()
  const problema = await conteudo.problemaParaPublicar(sb, tarefaId, a.alvos)
  if (problema) return { erro: problema }
  const post = await conteudo.buscarConteudo(sb, tarefaId)
  if (a.modo === 'aprovacao' && post?.aprovacao === 'ajuste') return { erro: 'O cliente pediu ajuste: edite o post (nasce a versão nova, que volta para ele) e agende de novo.' }
  const enviarAoCliente = a.modo === 'aprovacao' && post?.aprovacao === 'rascunho'
  const r = await tentar(
    () => conteudo.agendarPost(sb, tarefaId, { em: instante(a.data, a.hora).toISOString(), alvos: a.alvos, modo: a.modo, enviarAoCliente }),
    enviarAoCliente ? 'Enviado para aprovação do cliente. Publica no horário depois que ele aprovar.' : a.modo === 'aprovacao' && post?.aprovacao !== 'aprovado' ? 'Agendado: publica no horário depois da aprovação do cliente.' : 'Agendado.',
  )
  revalidatePath('/', 'layout')
  return r
}

/** Publica já, sem esperar o horário nem a aprovação (a equipe assume). */
export async function publicarAgoraAcao(tarefaId: string, alvos: Alvo[]): Promise<Resultado> {
  if (!UUID.test(tarefaId)) return { erro: 'Post inválido.' }
  await exigirEquipe()
  const sb = await criarClienteServidor()
  const problema = await conteudo.problemaParaPublicar(sb, tarefaId, alvos)
  if (problema) return { erro: problema }
  const r = await tentar(() => conteudo.agendarPost(sb, tarefaId, { em: new Date().toISOString(), alvos, modo: 'direto', enviarAoCliente: false }))
  if (r?.erro) return r
  const resultado = await publicarPost(tarefaId, { forcar: true })
  revalidatePath('/', 'layout')
  if (resultado.status === 'publicado') return { ok: 'Publicado!' }
  if (resultado.status === 'publicando') return { ok: 'O vídeo ainda está processando no Instagram; a publicação termina sozinha em alguns minutos.' }
  return { erro: resultado.erro ?? 'Não foi possível publicar.' }
}

export async function cancelarAgendamentoAcao(tarefaId: string): Promise<Resultado> {
  if (!UUID.test(tarefaId)) return { erro: 'Post inválido.' }
  return executar((sb) => conteudo.cancelarAgendamento(sb, tarefaId), 'Agendamento cancelado.')
}
