import { prepararEnvioAnexoAcao } from '@/app/(app)/tarefas/acoes'
import { normalizarMime, validarAnexo } from '@/dominio/anexos'
import type { NovoAnexo } from '@/servicos/comentarios'

/** Envia direto ao R2 pela URL assinada (XMLHttpRequest para ter progresso). Erro → `Error` em português. */
export async function enviarAnexo(
  tarefaId: string,
  arquivo: Blob,
  nome: string,
  aoProgresso: (pct: number) => void,
  sinal?: AbortSignal,
): Promise<NovoAnexo> {
  const mime = normalizarMime(arquivo.type)
  const invalido = validarAnexo({ mime, tamanho: arquivo.size })
  if (invalido) throw new Error(invalido)
  const preparo = await prepararEnvioAnexoAcao(tarefaId, { nome, mime, tamanho: arquivo.size })
  if ('erro' in preparo) throw new Error(preparo.erro)

  await new Promise<void>((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    xhr.open('PUT', preparo.url)
    xhr.setRequestHeader('Content-Type', mime)
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) aoProgresso(Math.round((e.loaded / e.total) * 100))
    }
    xhr.onload = () => (xhr.status >= 200 && xhr.status < 300 ? resolve() : reject(new Error('Não foi possível enviar o arquivo. Tente de novo.')))
    xhr.onerror = () => reject(new Error('Falha de conexão ao enviar o arquivo.'))
    xhr.onabort = () => reject(new Error('Envio cancelado.'))
    sinal?.addEventListener('abort', () => xhr.abort(), { once: true })
    if (sinal?.aborted) return reject(new Error('Envio cancelado.'))
    xhr.send(arquivo)
  })
  aoProgresso(100)
  return { chave: preparo.chave, nome, mime, tamanho: arquivo.size }
}
