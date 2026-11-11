'use client'

import { Loader2, Mic, MonitorSpeaker, Pause, Play, Square, Upload } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import { processarReuniaoAcao, urlEnvioReuniaoAcao } from '@/app/(app)/reunioes/acoes'
import { avisar } from '@/componentes/tarefas/avisar'
import { LIMITE_GRAVACAO_MB } from '@/dominio/ata'

type Opcao = { id: string; nome: string }
type Etapa = 'pronto' | 'gravando' | 'pausado' | 'enviando' | 'gerando'

const MAX_MIN = 120
const TIPOS = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4', 'audio/ogg;codecs=opus']
const relogio = (s: number) => `${String(Math.floor(s / 3600)).padStart(2, '0')}:${String(Math.floor((s % 3600) / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`

/**
 * Notetaker: grava o microfone e/ou o áudio de uma aba (Meet, Zoom, Teams no navegador), mistura num arquivo só,
 * manda ao armazenamento e pede a ata à IA. Também aceita um arquivo já gravado.
 */
export function Gravador({ clientes, listas }: { clientes: Opcao[]; listas: Opcao[] }) {
  const router = useRouter()
  const [titulo, setTitulo] = useState('')
  const [clienteId, setClienteId] = useState('')
  const [listaId, setListaId] = useState('')
  const [criarTarefas, setCriarTarefas] = useState(true)
  const [usarMic, setUsarMic] = useState(true)
  const [usarAba, setUsarAba] = useState(false)
  const [etapa, setEtapa] = useState<Etapa>('pronto')
  const [segundos, setSegundos] = useState(0)
  const [erro, setErro] = useState<string | null>(null)
  const sessao = useRef<{ rec: MediaRecorder; streams: MediaStream[]; ctx: AudioContext; pedacos: Blob[] } | null>(null)

  const gravando = etapa === 'gravando' || etapa === 'pausado'
  useEffect(() => {
    if (etapa !== 'gravando') return
    const t = setInterval(() => setSegundos((s) => s + 1), 1000)
    return () => clearInterval(t)
  }, [etapa])
  useEffect(() => {
    if (!gravando) return
    const sair = (e: BeforeUnloadEvent) => e.preventDefault()
    window.addEventListener('beforeunload', sair)
    return () => window.removeEventListener('beforeunload', sair)
  }, [gravando])
  useEffect(() => {
    if (segundos >= MAX_MIN * 60 && etapa === 'gravando') parar()
  })

  async function enviar(arquivo: Blob, duracaoMin: number | null) {
    setErro(null)
    setEtapa('enviando')
    const destino = await urlEnvioReuniaoAcao(arquivo.type || 'audio/webm', arquivo.size)
    if ('erro' in destino) return falhar(destino.erro)
    const put = await fetch(destino.url, { method: 'PUT', body: arquivo, headers: { 'Content-Type': destino.mime } }).catch(() => null)
    if (!put?.ok) return falhar('Não foi possível enviar a gravação. Tente de novo.')
    setEtapa('gerando')
    const r = await processarReuniaoAcao({ chave: destino.chave, mime: destino.mime, titulo, clienteId: clienteId || null, listaId: listaId || null, criarTarefas: criarTarefas && !!listaId, duracaoMin })
    if ('erro' in r) return falhar(r.erro)
    avisar({ ok: r.tarefasCriadas ? `Ata pronta e ${r.tarefasCriadas} tarefas criadas.` : 'Ata pronta.' }, true)
    router.push(`/documentos/${r.documentoId}`)
  }

  function falhar(msg: string) {
    setErro(msg)
    setEtapa('pronto')
  }

  async function gravar() {
    setErro(null)
    if (!usarMic && !usarAba) return setErro('Escolha pelo menos uma fonte de áudio.')
    const streams: MediaStream[] = []
    try {
      const ctx = new AudioContext()
      const mistura = ctx.createMediaStreamDestination()
      if (usarAba) {
        // O Chrome só compartilha o áudio de uma ABA (marque "Compartilhar áudio da guia" na janela que abrir).
        const tela = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true })
        streams.push(tela)
        if (!tela.getAudioTracks().length) {
          streams.forEach((s) => s.getTracks().forEach((t) => t.stop()))
          return setErro('A aba foi compartilhada sem áudio. Escolha a aba da reunião e marque "Compartilhar áudio da guia".')
        }
        ctx.createMediaStreamSource(new MediaStream(tela.getAudioTracks())).connect(mistura)
      }
      if (usarMic) {
        const mic = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true } })
        streams.push(mic)
        ctx.createMediaStreamSource(mic).connect(mistura)
      }
      const mimeType = TIPOS.find((t) => MediaRecorder.isTypeSupported(t))
      const rec = new MediaRecorder(mistura.stream, { mimeType, audioBitsPerSecond: 32000 })
      const pedacos: Blob[] = []
      rec.ondataavailable = (e) => e.data.size && pedacos.push(e.data)
      sessao.current = { rec, streams, ctx, pedacos }
      rec.start(5000)
      setSegundos(0)
      setEtapa('gravando')
    } catch (e) {
      streams.forEach((s) => s.getTracks().forEach((t) => t.stop()))
      setErro(e instanceof DOMException && e.name === 'NotAllowedError' ? 'Permissão negada. Libere o microfone/compartilhamento no navegador e tente de novo.' : 'Não foi possível começar a gravação neste navegador.')
    }
  }

  function pausar() {
    const s = sessao.current
    if (!s) return
    if (s.rec.state === 'recording') {
      s.rec.pause()
      setEtapa('pausado')
    } else {
      s.rec.resume()
      setEtapa('gravando')
    }
  }

  function parar() {
    const s = sessao.current
    if (!s) return
    s.rec.onstop = () => {
      s.streams.forEach((st) => st.getTracks().forEach((t) => t.stop()))
      void s.ctx.close()
      sessao.current = null
      void enviar(new Blob(s.pedacos, { type: s.rec.mimeType || 'audio/webm' }), segundos / 60)
    }
    s.rec.stop()
  }

  const ocupado = etapa === 'enviando' || etapa === 'gerando'
  return (
    <div>
      <div>
        <label>
          <span>Assunto da reunião (opcional)</span>
          <input value={titulo} onChange={(e) => setTitulo(e.target.value)} placeholder="Ex.: Planejamento de novembro com a Padaria" maxLength={120} disabled={ocupado} />
        </label>
        <label>
          <span>Cliente (opcional)</span>
          <select value={clienteId} onChange={(e) => setClienteId(e.target.value)} disabled={ocupado}>
            <option value="">Nenhum</option>
            {clientes.map((c) => <option key={c.id} value={c.id}>{c.nome}</option>)}
          </select>
        </label>
        <label>
          <span>Lista (opcional)</span>
          <select value={listaId} onChange={(e) => setListaId(e.target.value)} disabled={ocupado}>
            <option value="">Nenhuma</option>
            {listas.map((l) => <option key={l.id} value={l.id}>{l.nome}</option>)}
          </select>
        </label>
        {listaId && (
          <label>
            <input type="checkbox" checked={criarTarefas} onChange={(e) => setCriarTarefas(e.target.checked)} disabled={ocupado} />
            Criar tarefas dos próximos passos nessa lista (a ata também fica vinculada a ela)
          </label>
        )}
      </div>

      <div>
        <p>O que gravar</p>
        <div>
          <button type="button" onClick={() => setUsarMic((v) => !v)} disabled={gravando || ocupado} aria-pressed={usarMic}>
            <Mic /> Microfone (reunião presencial ou você)
          </button>
          <button type="button" onClick={() => setUsarAba((v) => !v)} disabled={gravando || ocupado} aria-pressed={usarAba}>
            <MonitorSpeaker /> Áudio da reunião online (aba do Meet, Zoom, Teams)
          </button>
        </div>
        {usarAba && <p>Ao começar, escolha a <strong>aba</strong> da reunião e marque <strong>&quot;Compartilhar áudio da guia&quot;</strong>. Deixe o microfone ligado para gravar a sua voz também.</p>}
      </div>

      <div>
        {etapa === 'pronto' && (
          <>
            <button type="button" onClick={gravar}><span /> Começar a gravar</button>
            <label>
              <Upload /> Enviar gravação
              <input type="file" accept="audio/*,video/mp4,video/webm" className="sr-only" onChange={(e) => { const f = e.target.files?.[0]; e.target.value = ''; if (f) void enviar(f, null) }} />
            </label>
            <span>Até {MAX_MIN} min gravando, ou arquivo de até {LIMITE_GRAVACAO_MB} MB.</span>
          </>
        )}
        {gravando && (
          <>
            <span>
              <span /> {etapa === 'pausado' ? 'Pausado' : 'Gravando'} {relogio(segundos)}
            </span>
            <button type="button" onClick={pausar}>{etapa === 'pausado' ? <><Play /> Continuar</> : <><Pause /> Pausar</>}</button>
            <button type="button" onClick={parar}><Square /> Parar e gerar a ata</button>
          </>
        )}
        {ocupado && (
          <span>
            <Loader2 />
            {etapa === 'enviando' ? 'Enviando a gravação…' : 'A IA está ouvindo a reunião e escrevendo a ata. Em reuniões longas, isso leva alguns minutos. Não feche esta página.'}
          </span>
        )}
      </div>
      {erro && <p>{erro}</p>}
    </div>
  )
}
