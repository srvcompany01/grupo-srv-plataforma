'use client'

import { Monitor, Square, Video } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'
import { DURACAO_MAX_GRAVACAO_S } from '@/dominio/anexos'
import { formatarRelogio } from '@/dominio/formatar'
import { escolherMime, MIMES_AUDIO, MIMES_VIDEO, nomeGravacao } from '@/dominio/gravacao'

type Fase = 'escolha' | 'iniciando' | 'gravando' | 'previa'
type Fonte = 'tela' | 'camera'

const NEGADO = { audio: 'Permita o acesso ao microfone no navegador.', camera: 'Permita o acesso à câmera e ao microfone no navegador.', tela: 'Permita o acesso à tela no navegador.' }

export function Gravador({
  modo,
  aoConcluir,
  aoCancelar,
}: {
  modo: 'audio' | 'video'
  aoConcluir: (blob: Blob, nome: string) => void
  aoCancelar: () => void
}) {
  const [fase, setFase] = useState<Fase>(modo === 'audio' ? 'iniciando' : 'escolha')
  const [segundos, setSegundos] = useState(0)
  const [previa, setPrevia] = useState<{ blob: Blob; url: string; nome: string } | null>(null)
  const trilhas = useRef<MediaStreamTrack[]>([])
  const gravador = useRef<MediaRecorder | null>(null)
  const relogio = useRef<ReturnType<typeof setInterval> | null>(null)
  const cancelado = useRef(false)
  const urlPrevia = useRef<string | null>(null)

  function pararTrilhas() {
    trilhas.current.forEach((t) => t.stop())
    trilhas.current = []
    if (relogio.current) clearInterval(relogio.current)
    relogio.current = null
  }

  async function iniciar(fonte: 'audio' | Fonte) {
    const fontes: MediaStream[] = []
    try {
      if (typeof MediaRecorder === 'undefined' || !navigator.mediaDevices) throw Object.assign(new Error('suporte'), { name: 'NaoSuportado' })
      let stream: MediaStream
      if (fonte === 'audio') {
        const mic = await navigator.mediaDevices.getUserMedia({ audio: true })
        fontes.push(mic)
        stream = mic
      } else if (fonte === 'camera') {
        const cam = await navigator.mediaDevices.getUserMedia({ video: true, audio: true })
        fontes.push(cam)
        stream = cam
      } else {
        const tela = await navigator.mediaDevices.getDisplayMedia({ video: true })
        fontes.push(tela)
        stream = new MediaStream(tela.getVideoTracks())
        // Microfone é opcional: sem permissão, grava só a tela.
        try {
          const mic = await navigator.mediaDevices.getUserMedia({ audio: true })
          fontes.push(mic)
          mic.getAudioTracks().forEach((t) => stream.addTrack(t))
        } catch {
          /* segue sem áudio */
        }
      }
      const todas = fontes.flatMap((s) => s.getTracks())
      if (cancelado.current) {
        todas.forEach((t) => t.stop())
        return
      }
      trilhas.current = todas

      const mime = escolherMime(modo === 'audio' ? MIMES_AUDIO : MIMES_VIDEO, (m) => MediaRecorder.isTypeSupported(m))
      if (!mime) throw Object.assign(new Error('suporte'), { name: 'NaoSuportado' })
      const rec = new MediaRecorder(stream, { mimeType: mime })
      const partes: Blob[] = []
      rec.ondataavailable = (e) => e.data.size > 0 && partes.push(e.data)
      rec.onstop = () => {
        pararTrilhas()
        if (cancelado.current) return
        const blob = new Blob(partes, { type: mime })
        const url = URL.createObjectURL(blob)
        urlPrevia.current = url
        setPrevia({ blob, url, nome: nomeGravacao(modo, mime, new Date()) })
        setFase('previa')
      }
      gravador.current = rec
      // Compartilhamento encerrado pelo botão do navegador.
      stream.getVideoTracks()[0]?.addEventListener('ended', () => rec.state !== 'inactive' && rec.stop())
      rec.start(1000)
      const inicio = Date.now()
      setSegundos(0)
      setFase('gravando')
      relogio.current = setInterval(() => {
        const s = Math.floor((Date.now() - inicio) / 1000)
        setSegundos(s)
        if (s >= DURACAO_MAX_GRAVACAO_S && rec.state !== 'inactive') rec.stop()
      }, 1000)
    } catch (e) {
      fontes.flatMap((s) => s.getTracks()).forEach((t) => t.stop())
      pararTrilhas()
      if (cancelado.current) return
      const nome = (e as { name?: string }).name
      if (nome === 'NaoSuportado') toast.error('Seu navegador não permite gravar neste formato.')
      else if (nome === 'NotAllowedError' || nome === 'SecurityError') toast.error(NEGADO[fonte === 'audio' ? 'audio' : fonte])
      else if (nome === 'NotFoundError') toast.error('Nenhum microfone ou câmera encontrado.')
      else toast.error('Não foi possível iniciar a gravação.')
      aoCancelar()
    }
  }

  useEffect(() => {
    cancelado.current = false
    // Abrir o microfone é sincronizar com um sistema externo; os setState só rodam depois de awaits.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (modo === 'audio') void iniciar('audio')
    return () => {
      cancelado.current = true
      if (gravador.current && gravador.current.state !== 'inactive') gravador.current.stop()
      pararTrilhas()
      if (urlPrevia.current) URL.revokeObjectURL(urlPrevia.current)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [modo])

  return (
    <div>
      {fase === 'escolha' && (
        <div>
          <span>Gravar:</span>
          <button type="button" onClick={() => {
              setFase('iniciando')
              void iniciar('tela')
            }}>
            <Monitor /> Tela
          </button>
          <button type="button" onClick={() => {
              setFase('iniciando')
              void iniciar('camera')
            }}>
            <Video /> Câmera
          </button>
          <button type="button" onClick={aoCancelar}>
            Cancelar
          </button>
        </div>
      )}
      {fase === 'iniciando' && <p>Aguardando permissão…</p>}
      {fase === 'gravando' && (
        <div>
          <span />
          <span>
            {formatarRelogio(segundos)} / {formatarRelogio(DURACAO_MAX_GRAVACAO_S)}
          </span>
          <button type="button" onClick={() => gravador.current?.stop()}>
            <Square /> Parar
          </button>
        </div>
      )}
      {fase === 'previa' && previa && (
        <div>
          {modo === 'audio' ? <audio src={previa.url} controls /> : <video src={previa.url} controls />}
          <div>
            <button type="button" onClick={() => aoConcluir(previa.blob, previa.nome)}>
              Usar
            </button>
            <button type="button" onClick={aoCancelar}>
              Descartar
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
