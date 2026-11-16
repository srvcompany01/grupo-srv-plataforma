import { TAMANHO_AVISO, TAMANHO_MAXIMO } from './midias'

export type TipoDoVideo = 'organico' | 'anuncio' | 'indefinido'
export type StatusDaCaixa = 'aguardando_envio' | 'importando' | 'pronto' | 'usado' | 'erro'

export const ROTULO_STATUS_CAIXA: Record<StatusDaCaixa, string> = {
  aguardando_envio: 'Aguardando envio',
  importando: 'Importando',
  pronto: 'Pronto para usar',
  usado: 'Já virou post',
  erro: 'Erro',
}
export const ROTULO_TIPO_VIDEO: Record<TipoDoVideo, string> = { organico: '✍️ Conteúdo', anuncio: '💙 Criativo', indefinido: 'Sem tag' }

/** Tipos de vídeo que o Instagram e a plataforma aceitam nos posts. */
export const MIME_VIDEO_CAIXA = ['video/mp4', 'video/quicktime'] as const

const sem = (t: string) => t.toLocaleLowerCase('pt-BR').normalize('NFD').replace(/[̀-ͯ]/g, '')

/** "orgânico" / "anúncio" pelo nome das pastas no caminho (ex.: Aurum / Conteúdo Orgânico / Reels). O mais perto do arquivo vence. */
export function tipoPelaPasta(caminho: string[]): TipoDoVideo {
  for (const parte of [...caminho].reverse()) {
    const n = sem(parte)
    if (/organic/.test(n)) return 'organico'
    if (/anunc|criativ|\bads?\b|trafego/.test(n)) return 'anuncio'
  }
  return 'indefinido'
}

/** Aceita o link da pasta do Drive (…/folders/<id>?…) ou o próprio id. Devolve '' se não reconhecer. */
export function idDaPastaDoDrive(texto: string): string {
  const t = texto.trim()
  const link = /\/folders\/([A-Za-z0-9_-]{10,})/.exec(t) ?? /[?&]id=([A-Za-z0-9_-]{10,})/.exec(t)
  if (link) return link[1]
  return /^[A-Za-z0-9_-]{10,200}$/.test(t) ? t : ''
}

/** Mensagem de problema para o vídeo (ou null se está tudo certo). */
export function problemaDoVideo(v: { mime: string; tamanho: number }): string | null {
  if (!(MIME_VIDEO_CAIXA as readonly string[]).includes(v.mime)) return 'Só vídeos MP4 ou MOV entram na caixa de entrada.'
  if (v.tamanho > TAMANHO_MAXIMO) return `Vídeo acima de 4 GB (${(v.tamanho / 1024 ** 3).toFixed(2).replace('.', ',')} GB): é o limite de envio da plataforma.`
  return null
}

/**
 * Aviso para vídeo acima de 1 GB (ou null). A plataforma NUNCA comprime: o arquivo é guardado exatamente como foi enviado.
 * O risco está na Meta, que pode recusar ou recomprimir arquivos muito grandes ao publicar.
 */
export function avisoDeVideoGrande(tamanho: number, nome = 'Este vídeo'): string | null {
  if (tamanho <= TAMANHO_AVISO) return null
  const gb = (tamanho / 1024 ** 3).toFixed(2).replace('.', ',')
  return `${nome} tem ${gb} GB (acima de 1 GB). A plataforma não comprime nem reduz a qualidade: ele é guardado exatamente como está. Mas o envio pode demorar mais e o Instagram/Meta pode recusar o arquivo ou recomprimi-lo ao publicar. Se a qualidade for importante, confira o post depois de publicado.`
}

export const formatarTamanho = (bytes: number) => (bytes >= 1024 ** 3 ? `${(bytes / 1024 ** 3).toFixed(2).replace('.', ',')} GB` : `${Math.max(1, Math.round(bytes / 1024 ** 2))} MB`)

/** Como o vídeo entra no destino: tarefa nova na lista, subtarefa nova de uma tarefa, ou dentro de uma tarefa/post que já existe. */
export type ModoDoDestino = 'mae' | 'subtarefa' | 'existente'
export const ROTULO_MODO_DESTINO: Record<ModoDoDestino, string> = { mae: 'Tarefa-mãe (nova, na lista)', subtarefa: 'Subtarefa (nova, dentro da tarefa)', existente: 'Dentro da tarefa que já existe' }
export type DestinoDoVideo = { listaId: string; listaNome: string; tarefaId: string | null; tarefaTitulo: string; modo: ModoDoDestino }

/** Texto curto do destino para a lista da caixa. */
export const resumoDoDestino = (d: DestinoDoVideo) => `${d.listaNome}${d.tarefaId ? ` › ${d.tarefaTitulo}` : ''} (${d.modo === 'mae' ? 'tarefa-mãe' : d.modo === 'subtarefa' ? 'subtarefa' : 'na tarefa existente'})`
