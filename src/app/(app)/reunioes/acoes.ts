'use server'

import { revalidatePath } from 'next/cache'
import { LIMITE_GRAVACAO_MB, mimeDaGravacao } from '@/dominio/ata'
import { exigirEquipe } from '@/infra/supabase/sessao'
import { criarClienteServidor } from '@/infra/supabase/servidor'
import { processarReuniao, urlEnvioReuniao } from '@/servicos/notetaker'

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

/** Endereço para o navegador mandar a gravação direto ao armazenamento. */
export async function urlEnvioReuniaoAcao(mime: string, tamanho: number): Promise<{ chave: string; url: string; mime: string } | { erro: string }> {
  await exigirEquipe()
  const base = mimeDaGravacao(mime)
  if (!base) return { erro: 'Formato não aceito. Use áudio (webm, mp3, m4a, wav, ogg) ou vídeo mp4/webm.' }
  if (!(tamanho > 0) || tamanho > LIMITE_GRAVACAO_MB * 1024 * 1024) return { erro: `A gravação passa de ${LIMITE_GRAVACAO_MB} MB.` }
  try {
    return { ...(await urlEnvioReuniao(base, tamanho)), mime: base }
  } catch (e) {
    console.error(e)
    return { erro: 'Não foi possível preparar o envio da gravação.' }
  }
}

export type PedidoAta = { chave: string; mime: string; titulo: string; clienteId: string | null; listaId: string | null; criarTarefas: boolean; duracaoMin: number | null }

/** Gera a ata com a IA e cria o documento (pode levar alguns minutos em reuniões longas). */
export async function processarReuniaoAcao(p: PedidoAta): Promise<{ documentoId: string; tarefasCriadas: number } | { erro: string }> {
  const eu = await exigirEquipe()
  const mime = mimeDaGravacao(p.mime)
  if (!mime) return { erro: 'Formato não aceito.' }
  if ((p.clienteId && !UUID.test(p.clienteId)) || (p.listaId && !UUID.test(p.listaId))) return { erro: 'Cliente ou lista inválidos.' }
  const sb = await criarClienteServidor()
  try {
    const r = await processarReuniao(sb, eu.id, { ...p, mime, titulo: p.titulo.slice(0, 120), duracaoMin: p.duracaoMin && p.duracaoMin > 0 ? Math.round(p.duracaoMin) : null })
    revalidatePath('/reunioes')
    revalidatePath('/documentos')
    return r
  } catch (e) {
    console.error(e)
    return { erro: e instanceof Error && e.message ? e.message : 'Não foi possível gerar a ata.' }
  }
}
