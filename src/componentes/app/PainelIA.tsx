'use client'

import { Brain, Sparkles, Send, X } from 'lucide-react'
import { usePathname, useRouter } from 'next/navigation'
import { Component, useEffect, useRef, useState, type ReactNode } from 'react'

type Mensagem = { role: 'user' | 'assistant'; content: string }
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
    <div className="space-y-1">
      {texto.split('\n').map((l, i) => {
        const item = /^\s*(?:[-•*])\s+(.*)$/.exec(l)
        const titulo = /^\s*#{1,6}\s+(.*)$/.exec(l)
        if (!l.trim()) return <div key={i} className="h-1.5" />
        if (item) return <div key={i} className="flex gap-2 pl-1"><span aria-hidden="true">•</span><span className="min-w-0 flex-1"><Linha texto={item[1]} /></span></div>
        return <div key={i} className={titulo ? 'font-semibold' : undefined}><Linha texto={titulo ? titulo[1] : l} /></div>
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
      <section className="fixed bottom-4 right-4 z-40 w-[22rem] max-w-[calc(100vw-2rem)] space-y-2 rounded-2xl bg-white p-4 shadow-flutuante ring-1 ring-black/10">
        <p className="text-corpo font-semibold text-perigo">O assistente encontrou um problema</p>
        <p className="break-words text-legenda text-texto-2">{this.state.erro.message}</p>
        <button type="button" onClick={() => this.setState({ erro: null })} className="h-8 rounded-lg bg-petroleo px-3 text-rotulo font-semibold text-white">Tentar de novo</button>
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

/** Assistente da plataforma: botão flutuante (ou Ctrl/Cmd+J). Consulta e, com confirmação, cria tarefas e documentos. */
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
  const fim = useRef<HTMLDivElement>(null)

  // A escolha do botão Pensar fica guardada no navegador e é lida quando o painel abre (não na renderização, para não divergir do servidor).
  const abrir = () => {
    try {
      setPensar(localStorage.getItem('srv-ia-pensar') === '1')
    } catch {}
    setAberto(true)
  }
  useEffect(() => {
    const atalho = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'j') {
        e.preventDefault()
        setAberto((a) => {
          if (!a) {
            try {
              setPensar(localStorage.getItem('srv-ia-pensar') === '1')
            } catch {}
          }
          return !a
        })
      }
    }
    document.addEventListener('keydown', atalho)
    return () => document.removeEventListener('keydown', atalho)
  }, [])
  // Chaves de propósito: o efeito não pode devolver nada (se o navegador devolver uma Promise, o React tenta chamá-la e a página cai).
  useEffect(() => {
    fim.current?.scrollIntoView({ block: 'end' })
  }, [mensagens, carregando, aberto])

  const enviar = async (pergunta: string) => {
    const limpa = pergunta.trim()
    if (!limpa || carregando) return
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

  if (!aberto) {
    return (
      <button type="button" onClick={abrir} title="Assistente (Ctrl+J)" aria-label="Abrir o assistente" className="fixed bottom-4 right-4 z-40 flex h-11 w-11 items-center justify-center rounded-full bg-petroleo text-white shadow-flutuante transition hover:bg-petroleo-700">
        <Sparkles className="h-5 w-5" />
      </button>
    )
  }
  return (
    <section aria-label="Assistente" className="fixed bottom-4 right-4 z-40 flex h-[32rem] max-h-[calc(100dvh-2rem)] w-[24rem] max-w-[calc(100vw-2rem)] flex-col overflow-hidden rounded-2xl bg-white shadow-flutuante ring-1 ring-black/10">
      <header className="flex items-center gap-2 border-b border-borda px-3 py-2.5">
        <Sparkles className="h-4 w-4 text-petroleo" />
        <h2 className="flex-1 text-corpo font-semibold">Assistente</h2>
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
          className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-legenda font-semibold ${pensar ? 'bg-petroleo text-white' : 'bg-fundo text-texto-3 hover:bg-hover'}`}
        >
          <Brain className="h-3 w-3" /> Pensar {pensar ? 'ligado' : 'desligado'}
        </button>
        <button type="button" aria-label="Fechar" onClick={() => setAberto(false)} className="rounded p-1 text-texto-3 hover:bg-hover"><X className="h-4 w-4" /></button>
      </header>
      <div className="min-h-0 flex-1 space-y-3 overflow-y-auto p-3">
        {mensagens.length === 0 && (
          <div className="space-y-2">
            <p className="text-corpo text-texto-2">Pergunte sobre tarefas, listas, clientes e documentos, ou peça para criar tarefas e documentos. Antes de gravar qualquer coisa, eu mostro o que vou fazer e espero você confirmar.</p>
            {SUGESTOES.map((s) => (
              <button key={s} type="button" onClick={() => void enviar(s)} className="block w-full rounded-lg bg-fundo px-3 py-2 text-left text-rotulo text-texto-2 hover:bg-hover">{s}</button>
            ))}
          </div>
        )}
        {mensagens.map((m, i) => (
          <div key={i} className={m.role === 'user' ? 'flex justify-end' : 'flex'}>
            <div className={`max-w-[85%] rounded-2xl px-3 py-2 text-corpo ${m.role === 'user' ? 'whitespace-pre-wrap bg-petroleo text-white' : 'bg-fundo text-texto'}`}>
              {m.role === 'user' ? comoTexto(m.content) : <TextoFormatado texto={comoTexto(m.content)} />}
            </div>
          </div>
        ))}
        {propostas && (
          <div className="space-y-2 rounded-xl bg-aviso-fundo p-3 text-corpo">
            <p className="font-semibold text-texto">Confirma estas ações?</p>
            <ul className="list-disc space-y-1 pl-5 text-rotulo text-texto-2">{propostas.map((p) => <li key={p.id}>{p.resumo}</li>)}</ul>
            <div className="flex gap-2">
              <button type="button" disabled={!!andamento} onClick={() => void confirmar()} className="h-8 rounded-lg bg-petroleo px-3 text-rotulo font-semibold text-white disabled:opacity-50">{andamento ?? 'Confirmar e executar'}</button>
              <button type="button" disabled={!!andamento} onClick={() => { setPropostas(null); setMensagens((m) => [...m, { role: 'assistant', content: 'Cancelado. Nada foi alterado.' }]) }} className="h-8 rounded-lg px-3 text-rotulo font-medium text-texto-2 hover:bg-white/60 disabled:opacity-50">Cancelar</button>
            </div>
          </div>
        )}
        {carregando && <p className="text-legenda text-texto-3">Consultando a plataforma…</p>}
        <div ref={fim} />
      </div>
      <form onSubmit={(e) => { e.preventDefault(); void enviar(texto) }} className="flex items-center gap-2 border-t border-borda p-2.5">
        <input value={texto} onChange={(e) => setTexto(e.target.value)} placeholder="Pergunte algo…" maxLength={2000} autoFocus className="h-9 min-w-0 flex-1 rounded-lg border border-borda bg-white px-3 text-corpo outline-none focus:border-petroleo" />
        <button type="submit" disabled={carregando || !texto.trim()} aria-label="Enviar" className="flex h-9 w-9 items-center justify-center rounded-lg bg-petroleo text-white disabled:opacity-40"><Send className="h-4 w-4" /></button>
      </form>
    </section>
  )
}
