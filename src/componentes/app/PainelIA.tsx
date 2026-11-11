'use client'

import { ArrowUp, Brain, Maximize2, Mic, Minimize2, Sparkles, X } from 'lucide-react'
import { usePathname, useRouter } from 'next/navigation'
import { Component, useEffect, useRef, useState, type ReactNode } from 'react'

type Mensagem = { role: 'user' | 'assistant'; content: string }

/** Reconhecimento de voz do navegador (Chrome, Edge, Safari). Não vem nos tipos padrão do TypeScript. */
type ReconhecimentoVoz = {
  lang: string
  continuous: boolean
  interimResults: boolean
  start(): void
  stop(): void
  onresult: ((e: { results: ArrayLike<ArrayLike<{ transcript: string }> & { isFinal: boolean }> }) => void) | null
  onend: (() => void) | null
  onerror: ((e: { error: string }) => void) | null
}

function criarReconhecimento(): ReconhecimentoVoz | null {
  const w = window as unknown as { SpeechRecognition?: new () => ReconhecimentoVoz; webkitSpeechRecognition?: new () => ReconhecimentoVoz }
  const Classe = w.SpeechRecognition ?? w.webkitSpeechRecognition
  return Classe ? new Classe() : null
}

/** As escolhas do painel (Pensar e tamanho) ficam no navegador e são lidas quando ele abre. */
function lerPreferencias(definirPensar: (v: boolean) => void, definirGrande: (v: boolean) => void) {
  try {
    definirPensar(localStorage.getItem('srv-ia-pensar') === '1')
    definirGrande(localStorage.getItem('srv-ia-grande') === '1')
  } catch {}
}
type Proposta = { id: string; nome: string; argumentos: Record<string, unknown>; resumo: string }

const SUGESTOES = ['O que está atrasado esta semana?', 'Crie uma tarefa “Reunião de pauta” para sexta', 'Quais clientes têm risco de churn alto?']

/** Qualquer valor vindo do servidor vira texto: um objeto no lugar de texto derrubaria a página inteira. */
const comoTexto = (v: unknown): string => (typeof v === 'string' ? v : v == null ? '' : JSON.stringify(v))

/** Trecho com **negrito** (e crases) em texto normal, sem HTML: nenhum asterisco solto aparece na conversa. */
function Linha({ texto }: { texto: string }) {
  return (
    <>
      {texto.split(/(\*\*[^*]+\*\*)/g).map((parte, i) => (parte.startsWith('**') && parte.endsWith('**') && parte.length > 4 ? <strong key={i}>{parte.slice(2, -2)}</strong> : <span key={i}>{parte.replace(/`/g, '')}</span>))}
    </>
  )
}

/** Resposta da IA com o mínimo de formatação: parágrafos, listas com "-" e **negrito**. */
function TextoFormatado({ texto }: { texto: string }) {
  return (
    <div>
      {texto.split('\n').map((l, i) => {
        const item = /^\s*(?:[-•*])\s+(.*)$/.exec(l)
        const titulo = /^\s*#{1,6}\s+(.*)$/.exec(l)
        if (!l.trim()) return <div key={i} />
        if (item) return <div key={i}><span aria-hidden="true">•</span><span><Linha texto={item[1]} /></span></div>
        return <div key={i}><Linha texto={titulo ? titulo[1] : l} /></div>
      })}
    </div>
  )
}

/** Se o painel falhar ao desenhar, só ele cai: a plataforma continua de pé e o motivo aparece na tela. */
class ProtegePainel extends Component<{ children: ReactNode }, { erro: Error | null }> {
  state = { erro: null as Error | null }
  static getDerivedStateFromError(erro: Error) {
    return { erro }
  }
  componentDidCatch(erro: Error) {
    console.error('Painel da IA', erro)
  }
  render() {
    if (!this.state.erro) return this.props.children
    return (
      <section>
        <p>A Emma encontrou um problema</p>
        <p>{this.state.erro.message}</p>
        <button type="button" onClick={() => this.setState({ erro: null })}>Tentar de novo</button>
      </section>
    )
  }
}

export function PainelIA() {
  return (
    <ProtegePainel>
      <PainelIAInterno />
    </ProtegePainel>
  )
}

export const EVENTO_ABRIR_IA = 'srv:abrir-ia'

/** Emma, a assistente da plataforma: botão flutuante (ou Ctrl/Cmd+J). Consulta e, com confirmação, cria tarefas e documentos. */
function PainelIAInterno() {
  const caminho = usePathname()
  const router = useRouter()
  const [aberto, setAberto] = useState(false)
  const [mensagens, setMensagens] = useState<Mensagem[]>([])
  const [texto, setTexto] = useState('')
  const [carregando, setCarregando] = useState(false)
  const [propostas, setPropostas] = useState<Proposta[] | null>(null)
  const [andamento, setAndamento] = useState<string | null>(null)
  const [pensar, setPensar] = useState(false)
  const [grande, setGrande] = useState(false)
  const [ouvindo, setOuvindo] = useState(false)
  const [avisoVoz, setAvisoVoz] = useState<string | null>(null)
  const voz = useRef<ReconhecimentoVoz | null>(null)
  const campoRef = useRef<HTMLTextAreaElement>(null)
  const fim = useRef<HTMLDivElement>(null)

  const abrir = () => {
    lerPreferencias(setPensar, setGrande)
    setAberto(true)
  }
  useEffect(() => {
    const atalho = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'j') {
        e.preventDefault()
        setAberto((a) => {
          if (!a) lerPreferencias(setPensar, setGrande)
          return !a
        })
      }
    }
    const abrir = () => setAberto((a) => { if (!a) lerPreferencias(setPensar, setGrande); return true })
    document.addEventListener('keydown', atalho)
    window.addEventListener(EVENTO_ABRIR_IA, abrir)
    return () => { document.removeEventListener('keydown', atalho); window.removeEventListener(EVENTO_ABRIR_IA, abrir) }
  }, [])
  // Chaves de propósito: o efeito não pode devolver nada (se o navegador devolver uma Promise, o React tenta chamá-la e a página cai).
  useEffect(() => {
    fim.current?.scrollIntoView({ block: 'end' })
  }, [mensagens, carregando, aberto])
  // O campo cresce com o texto (até um limite), inclusive quando o texto vem do microfone.
  useEffect(() => {
    const el = campoRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${Math.min(el.scrollHeight, 176)}px`
  }, [texto, aberto, grande])

  const enviar = async (pergunta: string) => {
    const limpa = pergunta.trim()
    if (!limpa || carregando) return
    voz.current?.stop()
    const proximas: Mensagem[] = [...mensagens, { role: 'user', content: limpa }]
    setMensagens(proximas)
    setTexto('')
    setCarregando(true)
    try {
      const r = await fetch('/api/ia', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ mensagens: proximas, caminho, pensar }) })
      const dados = (await r.json().catch(() => ({}))) as { resposta?: string; erro?: string; propostas?: Proposta[] }
      setMensagens([...proximas, { role: 'assistant', content: comoTexto(dados.resposta ?? dados.erro) || 'Não foi possível consultar a IA.' }])
      setPropostas(Array.isArray(dados.propostas) && dados.propostas.length ? dados.propostas.map((p) => ({ ...p, resumo: comoTexto(p.resumo) })) : null)
    } catch {
      setMensagens([...proximas, { role: 'assistant', content: 'Sem conexão. Tente de novo.' }])
    } finally {
      setCarregando(false)
    }
  }

  /** Executa as ações confirmadas, uma por vez, mostrando o andamento. Para na primeira que falhar. */
  const confirmar = async () => {
    if (!propostas || andamento) return
    const lista = propostas
    const feitas: string[] = []
    let falha: string | null = null
    for (const [i, p] of lista.entries()) {
      setAndamento(`Executando ${i + 1} de ${lista.length}…`)
      const r = await fetch('/api/ia/executar', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ nome: p.nome, argumentos: p.argumentos }) })
      const d = (await r.json().catch(() => ({}))) as { ok?: boolean; resumo?: string; erro?: string }
      if (!d.ok) {
        falha = `“${p.resumo}”: ${d.erro ?? 'não foi possível executar'}`
        break
      }
      feitas.push(`✔ ${p.resumo} (${d.resumo})`)
    }
    setAndamento(null)
    setPropostas(null)
    setMensagens((m) => [...m, { role: 'assistant', content: [...feitas, ...(falha ? [`✖ Parei em ${falha}`] : [`Pronto: ${feitas.length} ${feitas.length === 1 ? 'ação feita' : 'ações feitas'}.`])].join('\n') }])
    router.refresh()
  }

  /** Liga ou desliga o microfone: a fala vira texto no campo (aparece enquanto você fala) e você envia quando quiser. */
  const alternarMicrofone = () => {
    if (ouvindo) {
      voz.current?.stop()
      return
    }
    const r = criarReconhecimento()
    if (!r) {
      setAvisoVoz('Este navegador não reconhece voz. Use o Chrome, o Edge ou o Safari.')
      return
    }
    const base = texto.trim() ? `${texto.trim()} ` : ''
    r.lang = 'pt-BR'
    r.continuous = true
    r.interimResults = true
    r.onresult = (e) => {
      let finais = ''
      let parcial = ''
      for (let i = 0; i < e.results.length; i++) {
        const trecho = e.results[i][0].transcript
        if (e.results[i].isFinal) finais += trecho
        else parcial += trecho
      }
      setTexto((base + finais + parcial).slice(0, 2000))
    }
    r.onerror = (e) => setAvisoVoz(e.error === 'not-allowed' || e.error === 'service-not-allowed' ? 'Permita o uso do microfone no navegador para ditar.' : e.error === 'no-speech' ? 'Não ouvi nada. Tente de novo.' : 'Não foi possível usar o microfone.')
    r.onend = () => {
      setOuvindo(false)
      voz.current = null
    }
    voz.current = r
    setAvisoVoz(null)
    try {
      r.start()
      setOuvindo(true)
    } catch {
      setAvisoVoz('Não foi possível usar o microfone.')
    }
  }

  if (!aberto) {
    return (
      <button type="button" onClick={abrir} title="Emma, a assistente da Grupo SRV (Ctrl+J)" aria-label="Abrir a Emma, assistente da Grupo SRV">
        <Sparkles />
      </button>
    )
  }
  return (
    <section
      aria-label="Emma, assistente da Grupo SRV"
    >
      <header>
        <Sparkles />
        <h2>Emma <span>· assistente da Grupo SRV</span></h2>
        <button
          type="button"
          aria-label={grande ? 'Diminuir o painel' : 'Ampliar o painel'}
          title={grande ? 'Diminuir' : 'Ampliar'}
          onClick={() => {
            setGrande(!grande)
            try {
              localStorage.setItem('srv-ia-grande', grande ? '0' : '1')
            } catch {}
          }}
        >
          {grande ? <Minimize2 /> : <Maximize2 />}
        </button>
        <button type="button" aria-label="Fechar" onClick={() => { voz.current?.stop(); setAberto(false) }}><X /></button>
      </header>
      <div>
        {mensagens.length === 0 && (
          <div>
            <p>Oi, eu sou a Emma! Posso consultar tarefas, listas, clientes e documentos, e criar tarefas e documentos para você. Antes de gravar qualquer coisa, eu mostro o que vou fazer e espero a sua confirmação.</p>
            {SUGESTOES.map((s) => (
              <button key={s} type="button" onClick={() => void enviar(s)}>{s}</button>
            ))}
          </div>
        )}
        {mensagens.map((m, i) => (
          <div key={i}>
            <div>
              {m.role === 'user' ? comoTexto(m.content) : <TextoFormatado texto={comoTexto(m.content)} />}
            </div>
          </div>
        ))}
        {propostas && (
          <div>
            <p>Confirma estas ações?</p>
            <ul>{propostas.map((p) => <li key={p.id}>{p.resumo}</li>)}</ul>
            <div>
              <button type="button" disabled={!!andamento} onClick={() => void confirmar()}>{andamento ?? 'Confirmar e executar'}</button>
              <button type="button" disabled={!!andamento} onClick={() => { setPropostas(null); setMensagens((m) => [...m, { role: 'assistant', content: 'Cancelado. Nada foi alterado.' }]) }}>Cancelar</button>
            </div>
          </div>
        )}
        {carregando && <p>Consultando a plataforma…</p>}
        <div ref={fim} />
      </div>
      <form onSubmit={(e) => { e.preventDefault(); void enviar(texto) }}>
        <div>
          <textarea
            ref={campoRef}
            rows={1}
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
                e.preventDefault()
                void enviar(texto)
              }
            }}
            placeholder={ouvindo ? 'Estou ouvindo… pode falar' : 'Pergunte à Emma ou peça uma tarefa…'}
            maxLength={2000}
            autoFocus
          />
          <div>
            <button
              type="button"
              role="switch"
              aria-checked={pensar}
              title="Pensar: respostas melhores em pedidos difíceis, porém mais lentas e mais caras. Só funciona com o DeepSeek."
              onClick={() => {
                setPensar(!pensar)
                try {
                  localStorage.setItem('srv-ia-pensar', pensar ? '0' : '1')
                } catch {}
              }}
            >
              <Brain /> Pensar {pensar ? 'ligado' : 'desligado'}
            </button>
            <span>{avisoVoz}</span>
            <button
              type="button"
              aria-pressed={ouvindo}
              aria-label={ouvindo ? 'Parar de ouvir' : 'Falar em vez de digitar'}
              title={ouvindo ? 'Parar de ouvir' : 'Falar em vez de digitar (o navegador transcreve a sua voz)'}
              onClick={alternarMicrofone}
            >
              <Mic />
            </button>
            <button type="submit" disabled={carregando || !texto.trim()} aria-label="Enviar"><ArrowUp /></button>
          </div>
        </div>
        <p className="hidden">Enter envia · Shift+Enter nova linha</p>
      </form>
    </section>
  )
}
