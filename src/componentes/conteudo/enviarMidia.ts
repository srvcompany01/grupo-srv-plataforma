import { prepararEnvioMidiaAcao, registrarMidiaAcao } from '@/app/(app)/conteudo/acoes'
import { TIPOS_ACEITOS } from '@/dominio/midias'

/** Envia direto ao R2 pela URL assinada (com progresso) e registra a mídia na versão atual do post. */
export async function enviarMidia(tarefaId: string, arquivo: File, aoProgresso: (pct: number) => void): Promise<void> {
  const tipo = TIPOS_ACEITOS[arquivo.type]
  if (!tipo) throw new Error('Formato não aceito. Use JPG, PNG, WEBP, MP4 ou MOV.')
  const preparo = await prepararEnvioMidiaAcao(tarefaId, { nome: arquivo.name, mime: arquivo.type, tamanho: arquivo.size })
  if ('erro' in preparo) throw new Error(preparo.erro)

  await new Promise<void>((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    xhr.open('PUT', preparo.url)
    xhr.setRequestHeader('Content-Type', arquivo.type)
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) aoProgresso(Math.round((e.loaded / e.total) * 100))
    }
    xhr.onload = () => (xhr.status >= 200 && xhr.status < 300 ? resolve() : reject(new Error('Não foi possível enviar o arquivo. Tente de novo.')))
    xhr.onerror = () => reject(new Error('Falha de conexão ao enviar o arquivo.'))
    xhr.send(arquivo)
  })
  aoProgresso(100)

  const r = await registrarMidiaAcao(tarefaId, { chave: preparo.chave, tipo, nome: arquivo.name, tamanho: arquivo.size })
  if (r?.erro) throw new Error(r.erro)
}
