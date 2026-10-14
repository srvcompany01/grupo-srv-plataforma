'use client'

import { AtSign, FileText, Mic, Paperclip, SendHorizontal, Video, X } from 'lucide-react'
import { useEffect, useRef, useState, useTransition } from 'react'
import { toast } from 'sonner'
import { comentarAcao } from '@/app/(app)/tarefas/acoes'
import { MAX_ANEXOS, validarAnexo } from '@/dominio/anexos'
import { extrairMencoes, mencoesDaEdicao } from '@/dominio/mencoes'
import type { NovoAnexo } from '@/servicos/comentarios'
import { avisar } from '../avisar'
import { enviarAnexo } from './enviarAnexo'
import { Gravador } from './Gravador'
import { filtrarPessoas, SeletorMencao, type PessoaMencao } from './SeletorMencao'

type Pendente = { chave: string; nome: string; pct: number; anexo: NovoAnexo | null; ctrl: AbortController }

/** `@consulta` imediatamente antes do cursor (início do texto ou depois de espaço). */
function consultaMencao(texto: string, cursor: number): { inicio: number; consulta: string } | null {
  const m = /(^|\s)@([^\s@]*)$/.exec(texto.slice(0, cursor))
  return m ? { inicio: cursor - m[2].length - 1, consulta: m[2] } : null
}

export function CaixaComentario({ tarefaId, pessoas }: { tarefaId: string; pessoas: PessoaMencao[] }) {
  const [texto, setTexto] = useState('')
  const [interno, setInterno] = useState(true)
  const [anexos, setAnexos] = useState<Pendente[]>([])
  const [mencionados, setMencionados] = useState<PessoaMencao[]>([])
  const [mencao, setMencao] = useState<{ inicio: number; consulta: string } | null>(null)
  const [indice, setIndice] = useState(0)
  const [gravando, setGravando] = useState<'audio' | 'video' | null>(null)
  const [pendente, iniciar] = useTransition()
  const area = useRef<HTMLTextAreaElement>(null)
  const entrada = useRef<HTMLInputElement>(null)
  const anexosRef = useRef(anexos)
  useEffect(() => {
    anexosRef.current = anexos
  })

  // Cancela uploads em andamento ao desmontar.
  useEffect(() => () => anexosRef.current.forEach((a) => !a.anexo && a.ctrl.abort()), [])

  // A textarea cresce sozinha (até ~8 linhas).
  useEffect(() => {
    const el = area.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`
  }, [texto])

  const sugestoes = mencao ? filtrarPessoas(pessoas, mencao.consulta) : []
  const enviando = anexos.some((a) => !a.anexo)
  const podeEnviar = !pendente && !enviando && (texto.trim().length > 0 || anexos.length > 0)

  function aoDigitar(valor: string, cursor: number) {
    setTexto(valor)
    setMencao(consultaMencao(valor, cursor))
    setIndice(0)
  }

  function escolher(p: PessoaMencao) {
    const el = area.current
    if (!mencao || !el) return
    const fim = mencao.inicio + 1 + mencao.consulta.length
    const novo = `${texto.slice(0, mencao.inicio)}@${p.nome} ${texto.slice(fim)}`
    const cursor = mencao.inicio + p.nome.length + 2
    setTexto(novo)
    setMencionados((m) => (m.some((x) => x.id === p.id) ? m : [...m, p]))
    setMencao(null)
    requestAnimationFrame(() => {
      el.focus()
      el.setSelectionRange(cursor, cursor)
    })
  }

  function abrirMencao() {
    const el = area.current
    if (!el) return
    const pos = el.selectionStart ?? texto.length
    const sep = pos > 0 && !/\s/.test(texto[pos - 1]) ? ' ' : ''
    const novo = `${texto.slice(0, pos)}${sep}@${texto.slice(pos)}`
    const cursor = pos + sep.length + 1
    setTexto(novo)
    setMencao({ inicio: cursor - 1, consulta: '' })
    setIndice(0)
    requestAnimationFrame(() => {
      el.focus()
      el.setSelectionRange(cursor, cursor)
    })
  }

  function adicionar(itens: { blob: Blob; nome: string }[]) {
    let livres = MAX_ANEXOS - anexosRef.current.length
    for (const { blob, nome } of itens) {
      if (livres <= 0) {
        toast.error(`Máximo de ${MAX_ANEXOS} anexos por comentário.`)
        break
      }
      const invalido = validarAnexo({ mime: blob.type, tamanho: blob.size })
      if (invalido) {
        toast.error(`${nome}: ${invalido}`)
        continue
      }
      livres--
      const chave = crypto.randomUUID()
      const ctrl = new AbortController()
      setAnexos((a) => [...a, { chave, nome, pct: 0, anexo: null, ctrl }])
      enviarAnexo(tarefaId, blob, nome, (pct) => setAnexos((a) => a.map((x) => (x.chave === chave ? { ...x, pct } : x))), ctrl.signal)
        .then((anexo) => setAnexos((a) => a.map((x) => (x.chave === chave ? { ...x, anexo, pct: 100 } : x))))
        .catch((e: Error) => {
          setAnexos((a) => a.filter((x) => x.chave !== chave))
          if (!ctrl.signal.aborted) toast.error(`${nome}: ${e.message}`)
        })
    }
  }

  function remover(chave: string) {
    const item = anexosRef.current.find((a) => a.chave === chave)
    if (item && !item.anexo) item.ctrl.abort()
    setAnexos((a) => a.filter((x) => x.chave !== chave))
  }

  function enviar() {
    if (!podeEnviar) return
    const final = mencoesDaEdicao(texto, mencionados)
    const prontos = anexos.flatMap((a) => (a.anexo ? [a.anexo] : []))
    iniciar(async () => {
      // Se falhar, texto e anexos continuam na caixa para tentar de novo.
      if (avisar(await comentarAcao(tarefaId, final, interno, extrairMencoes(final), prontos))) {
        setTexto('')
        setAnexos([])
        setMencionados([])
        setMencao(null)
      }
    })
  }

  return (
    <div className="space-y-2">
      {gravando && (
        <Gravador
          key={gravando}
          modo={gravando}
          aoCancelar={() => setGravando(null)}
          aoConcluir={(blob, nome) => {
            setGravando(null)
            adicionar([{ blob, nome }])
          }}
        />
      )}
      <div className="controle relative space-y-2 rounded-md border border-borda bg-white p-2 focus-within:border-marca/40">
        {mencao && <SeletorMencao pessoas={sugestoes} indice={Math.min(indice, Math.max(sugestoes.length - 1, 0))} aoEscolher={escolher} />}
        <textarea
          ref={area}
          value={texto}
          rows={2}
          placeholder="Escreva um comentário…"
          aria-label="Comentário"
          onChange={(e) => aoDigitar(e.target.value, e.target.selectionStart)}
          onClick={(e) => setMencao(consultaMencao(texto, e.currentTarget.selectionStart))}
          onKeyDown={(e) => {
            if (mencao) {
              if (e.key === 'Escape') {
                e.preventDefault()
                setMencao(null)
                return
              }
              if (sugestoes.length > 0) {
                if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
                  e.preventDefault()
                  setIndice((i) => (i + (e.key === 'ArrowDown' ? 1 : sugestoes.length - 1)) % sugestoes.length)
                  return
                }
                if (e.key === 'Enter' && !e.ctrlKey && !e.metaKey) {
                  e.preventDefault()
                  escolher(sugestoes[Math.min(indice, sugestoes.length - 1)])
                  return
                }
              }
            }
            if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
              e.preventDefault()
              enviar()
            }
          }}
          className="max-h-40 w-full resize-none bg-transparent text-corpo outline-none"
        />
        {anexos.length > 0 && (
          <ul className="flex flex-wrap gap-1.5">
            {anexos.map((a) => (
              <li key={a.chave} className="flex max-w-full items-center gap-1.5 rounded-md border border-borda bg-fundo px-2 py-1 text-rotulo">
                <FileText className="h-3.5 w-3.5 shrink-0 text-texto-3" />
                <span className="max-w-[160px] truncate">{a.nome}</span>
                {!a.anexo && <span className="text-texto-3">{a.pct}%</span>}
                <button type="button" onClick={() => remover(a.chave)} aria-label={`Remover ${a.nome}`} className="text-texto-3 hover:text-perigo">
                  <X className="h-3.5 w-3.5" />
                </button>
              </li>
            ))}
          </ul>
        )}
        <div className="flex items-center gap-1">
          <input
            ref={entrada}
            type="file"
            multiple
            hidden
            onChange={(e) => {
              adicionar([...(e.target.files ?? [])].map((f) => ({ blob: f, nome: f.name })))
              e.target.value = ''
            }}
          />
          <BotaoIcone rotulo="Anexar arquivo" onClick={() => entrada.current?.click()} icone={Paperclip} />
          <BotaoIcone rotulo="Mencionar pessoa" onClick={abrirMencao} icone={AtSign} />
          <BotaoIcone rotulo="Gravar áudio" onClick={() => setGravando('audio')} icone={Mic} />
          <BotaoIcone rotulo="Gravar vídeo ou tela" onClick={() => setGravando('video')} icone={Video} />
          <div className="ml-auto flex items-center gap-2">
            <div className="flex rounded-md bg-hover p-0.5 text-rotulo">
              <button type="button" onClick={() => setInterno(true)} className={`rounded px-2 py-0.5 ${interno ? 'bg-white shadow-sm' : 'text-texto-2'}`}>
                Interno
              </button>
              <button type="button" onClick={() => setInterno(false)} className={`rounded px-2 py-0.5 ${!interno ? 'bg-white text-sucesso-forte shadow-sm' : 'text-texto-2'}`}>
                Visível ao cliente
              </button>
            </div>
            <button type="button" onClick={enviar} disabled={!podeEnviar} aria-label="Enviar comentário" className="rounded-md bg-texto p-1.5 text-white hover:bg-carbon disabled:opacity-40">
              <SendHorizontal className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function BotaoIcone({ rotulo, onClick, icone: Icone }: { rotulo: string; onClick: () => void; icone: typeof Paperclip }) {
  return (
    <button type="button" onClick={onClick} aria-label={rotulo} title={rotulo} className="rounded p-1.5 text-texto-3 hover:bg-hover hover:text-texto">
      <Icone className="h-4 w-4" />
    </button>
  )
}
