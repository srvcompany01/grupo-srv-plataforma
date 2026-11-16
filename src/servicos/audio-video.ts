import { spawn } from 'node:child_process'
import ffmpeg from 'ffmpeg-static'

/**
 * Extrai só a faixa de áudio de um vídeo (lido direto da URL, sem salvar o arquivo) e devolve um MP3 mono de 16 kHz:
 * cerca de 14 MB por hora de fala, o suficiente para transcrever.
 */
export function extrairAudio(urlDoVideo: string): Promise<Buffer> {
  return new Promise((resolver, rejeitar) => {
    if (!ffmpeg) return rejeitar(new Error('O ffmpeg não está disponível neste servidor.'))
    const p = spawn(ffmpeg, ['-nostdin', '-v', 'error', '-i', urlDoVideo, '-vn', '-ac', '1', '-ar', '16000', '-c:a', 'libmp3lame', '-b:a', '32k', '-f', 'mp3', 'pipe:1'])
    const partes: Buffer[] = []
    let erro = ''
    p.stdout.on('data', (d: Buffer) => partes.push(d))
    p.stderr.on('data', (d: Buffer) => { erro += d })
    p.on('error', rejeitar)
    p.on('close', (codigo) => {
      const audio = Buffer.concat(partes)
      if (codigo !== 0 || audio.length === 0) return rejeitar(new Error(/does not contain any stream|Stream map/i.test(erro) ? 'O vídeo não tem faixa de áudio.' : `Não consegui extrair o áudio do vídeo. ${erro.slice(0, 200)}`))
      resolver(audio)
    })
  })
}
