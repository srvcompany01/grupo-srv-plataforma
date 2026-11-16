'use client'

import { MessageSquare, Plus } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useEffect, useMemo, useRef, useState, useSyncExternalStore, useTransition } from 'react'
import { toast } from 'sonner'
import { carregarHistoricoProvaAcao, comentarProvaAcao } from '@/app/cliente/[slug]/acoes'
import { Button } from '@/componentes/ui/button'
import { Sheet, SheetContent, SheetDescription, SheetTitle } from '@/componentes/ui/sheet'
import { Tabs, TabsList, TabsTrigger } from '@/componentes/ui/tabs'
import { Textarea } from '@/componentes/ui/textarea'
import type { Formato } from '@/dominio/conteudo'
import { descreverLocal, formatarInstante, numerarComentarios, tempoRelativo, type ComentarioNumerado, type ComentarioProva } from '@/dominio/prova-visual'
import type { MidiaPortal } from '@/servicos/portal-conteudo'
import { MidiaMarcavel, type PontoMarcado } from './MidiaMarcavel'
import { PreviaPost } from './PreviaPost'

const CHAVE_NOME = 'srv-cliente-nome'
const lerNome = () => { try { return localStorage.getItem(CHAVE_NOME) ?? '' } catch { return '' } }

type Rascunho = { local: PontoMarcado | null; paiId: string | null; titulo: string }

/** Itens da lista: número, autor, local, texto e as respostas recuadas. */
function Item({ c, tipos, selecionado, aoSelecionar, aoResponder, somenteLeitura, agora }: { c: ComentarioNumerado; tipos: ('imagem' | 'video')[]; selecionado: boolean; aoSelecionar: () => void; aoResponder: () => void; somenteLeitura: boolean; agora: number }) {
  const temRespostaDaAgencia = c.respostas.some((r) => r.autorTipo === 'equipe')
  return (
    <li id={`prova-${c.id}`} className={`rounded-lg p-2 text-destaque md:text-corpo ${selecionado ? 'bg-[var(--sel)]' : ''}`}>
      <button type="button" onClick={aoSelecionar} className="block w-full text-left">
        <span className="flex items-center gap-2">
          <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-legenda font-semibold text-white ${c.resolvidoEm ? 'bg-sucesso-forte' : 'bg-[var(--red)]'}`}>{c.numero}</span>
          <span className="font-semibold">{c.autor}</span>
          <span className="text-rotulo text-texto-2">{tempoRelativo(c.criadoEm, agora)}</span>
        </span>
        <span className="mt-0.5 block text-rotulo text-texto-2">{descreverLocal(c, tipos)}{c.resolvidoEm ? ' · Resolvido' : ''}</span>
        <span className="mt-1 block whitespace-pre-wrap break-words">{c.texto}</span>
      </button>
      {c.respostas.length > 0 && (
        <ul className="ml-6 mt-2 space-y-2 border-l border-borda pl-3">
          {c.respostas.map((r) => (
            <li key={r.id}>
              <span className="font-semibold">{r.autorTipo === 'equipe' ? 'Agência SRV' : r.autor}</span> <span className="text-rotulo text-texto-2">{tempoRelativo(r.criadoEm, agora)}</span>
              <span className="block whitespace-pre-wrap break-words">{r.texto}</span>
            </li>
          ))}
        </ul>
      )}
      {!somenteLeitura && !c.resolvidoEm && temRespostaDaAgencia && (
        <button type="button" onClick={aoResponder} className="ml-6 mt-1 min-h-11 text-rotulo font-semibold text-texto-2 underline underline-offset-2">Responder</button>
      )}
    </li>
  )
}

/** Comentários de uma versão antiga: só carrega quando a pessoa abre, em páginas, com "Carregar mais". */
function HistoricoDaVersao({ slug, tarefaId, versao, total, tipos, agora }: { slug: string; tarefaId: string; versao: number; total: number; tipos: ('imagem' | 'video')[]; agora: number }) {
  const [itens, setItens] = useState<ComentarioProva[]>([])
  const [proximo, setProximo] = useState<{ criadoEm: string; id: string } | null>(null)
  const [carregou, setCarregou] = useState(false)
  const [carregando, setCarregando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  async function carregar(depois: { criadoEm: string; id: string } | null) {
    setCarregando(true)
    setErro(null)
    const r = await carregarHistoricoProvaAcao(slug, tarefaId, versao, depois)
    setCarregando(false)
    if ('erro' in r) return setErro(r.erro)
    setCarregou(true)
    setItens((atual) => [...atual, ...r.comentarios])
    setProximo(r.proximo)
  }
  return (
    <details className="rounded-lg border border-borda bg-white p-3" onToggle={(e) => { if ((e.currentTarget as HTMLDetailsElement).open && !carregou && !carregando) void carregar(null) }}>
      <summary className="min-h-11 cursor-pointer text-rotulo font-semibold">Ver comentários da versão {versao} ({total})</summary>
      <ul className="mt-2 space-y-1">
        {numerarComentarios(itens).map((c) => <Item key={c.id} c={c} tipos={tipos} selecionado={false} aoSelecionar={() => {}} aoResponder={() => {}} somenteLeitura agora={agora} />)}
      </ul>
      {carregando && <p role="status" className="py-2 text-rotulo text-texto-2">Carregando…</p>}
      {erro && <p role="alert" className="py-2 text-rotulo text-perigo-forte">{erro}</p>}
      {proximo && !carregando && <Button variant="outline" size="lg" className="mt-2 h-11" onClick={() => void carregar(proximo)}>Carregar mais</Button>}
    </details>
  )
}

/**
 * Prova visual do cliente: a mídia com marcadores, o botão "Comentar na imagem" (ou "Comentar em 0:12"), a lista
 * com abas e o painel para escrever. Depois da resposta do cliente à versão, tudo vira só leitura.
 */
export function ProvaVisualCliente({
  slug, tarefaId, nome, formato, midias, legenda, collabs, podeComentar, comentarios, truncado, anteriores,
}: {
  slug: string; tarefaId: string; nome: string; formato: Formato; midias: MidiaPortal[]; legenda: string; collabs: string[]
  podeComentar: boolean
  /** Comentários da versão atual. */
  comentarios: ComentarioProva[]
  /** A versão atual passou do teto de leitura: o aviso aparece em vez de sumir em silêncio. */
  truncado: boolean
  /** Versões antigas (só leitura): só o total; os comentários vêm sob demanda, em páginas. */
  anteriores: { versao: number; total: number }[]
}) {
  const router = useRouter()
  const [pendente, iniciar] = useTransition()
  const [marcando, setMarcando] = useState(false)
  const [ativa, setAtiva] = useState(0)
  const [selecionado, setSelecionado] = useState<string | null>(null)
  const [irPara, setIrPara] = useState<number | null>(null)
  const [aba, setAba] = useState<'abertos' | 'resolvidos'>('abertos')
  const [rascunho, setRascunho] = useState<Rascunho | null>(null)
  const [texto, setTexto] = useState('')
  // Nome lembrado por navegador: lido do localStorage só no cliente (o servidor começa vazio).
  const nomeGuardado = useSyncExternalStore(() => () => {}, lerNome, () => '')
  const [nomeDigitado, setNomeDigitado] = useState<string | null>(null)
  const nomeCliente = nomeDigitado ?? nomeGuardado
  const setNomeCliente = setNomeDigitado
  const [erro, setErro] = useState<string | null>(null)
  const [agora] = useState(() => Date.now())
  const videos = useRef(new Map<number, HTMLVideoElement>())
  const campoTexto = useRef<HTMLTextAreaElement>(null)
  const botaoOrigem = useRef<HTMLButtonElement>(null)

  // Esc cancela a marcação.
  useEffect(() => {
    if (!marcando) return
    const sair = (e: KeyboardEvent) => e.key === 'Escape' && setMarcando(false)
    window.addEventListener('keydown', sair)
    return () => window.removeEventListener('keydown', sair)
  }, [marcando])

  const daVersao = useMemo(() => numerarComentarios(comentarios), [comentarios])
  const abertos = daVersao.filter((c) => !c.resolvidoEm)
  const resolvidos = daVersao.filter((c) => c.resolvidoEm)
  const visiveisNaMidia = aba === 'resolvidos' ? resolvidos : abertos
  const tipos = midias.map((m) => m.tipo)
  const videoAtivo = midias[ativa]?.tipo === 'video'

  function iniciarMarcacao() {
    if (videoAtivo) videos.current.get(ativa)?.pause()
    setMarcando(true)
  }
  function aoMarcar(p: PontoMarcado) {
    setMarcando(false)
    const n = abertos.length + resolvidos.length + 1
    setRascunho({ local: p, paiId: null, titulo: `Comentário no ponto ${n} · ${p.segundo !== null ? formatarInstante(p.segundo) : `Imagem ${p.midia + 1}`}` })
    setTexto('')
    setErro(null)
  }
  function abrirGeral() {
    setRascunho({ local: null, paiId: null, titulo: 'Comentário geral' })
    setTexto('')
    setErro(null)
  }
  function abrirResposta(c: ComentarioNumerado) {
    setRascunho({ local: null, paiId: c.id, titulo: `Responder ao comentário ${c.numero}` })
    setTexto('')
    setErro(null)
  }
  function selecionar(id: string) {
    setSelecionado(id)
    const c = daVersao.find((x) => x.id === id)
    if (c?.midia != null) setIrPara(c.midia)
    if (c?.segundo != null && c.midia != null) { const v = videos.current.get(c.midia); if (v) { v.pause(); v.currentTime = c.segundo } }
    document.getElementById(`prova-${id}`)?.scrollIntoView({ block: 'nearest' })
  }
  function enviar() {
    if (!rascunho) return
    const local = rascunho.local
    iniciar(async () => {
      const r = await comentarProvaAcao(slug, tarefaId, { texto, nome: nomeCliente, midia: local?.midia ?? null, x: local?.x ?? null, y: local?.y ?? null, segundo: local?.segundo ?? null, paiId: rascunho.paiId })
      if (r?.erro) { setErro('Não foi possível enviar. Verifique a conexão e tente de novo.'); if (r.erro && !/conex/i.test(r.erro)) setErro(r.erro); return }
      try { localStorage.setItem(CHAVE_NOME, nomeCliente.trim()) } catch {}
      toast.success('Comentário enviado')
      setRascunho(null)
      setAba('abertos')
      router.refresh()
    })
  }

  const midiaNode = (
    <div className="relative">
      {marcando && (
        <div aria-live="polite" className="absolute inset-x-2 top-2 z-10 flex items-center justify-between gap-2 rounded-md bg-[var(--primary)] px-3 py-1.5 text-rotulo text-[var(--on-primary)]">
          <span>Toque no ponto que quer comentar</span>
          <button type="button" onClick={() => setMarcando(false)} className="min-h-11 px-2 font-semibold underline">Cancelar</button>
        </div>
      )}
      <MidiaMarcavel midias={midias} vertical={formato === 'reels' || formato === 'stories'} comentarios={visiveisNaMidia} selecionadoId={selecionado} aoSelecionar={selecionar} marcando={marcando} aoMarcar={aoMarcar} aoMudarAtiva={setAtiva} videos={videos} irPara={irPara} />
    </div>
  )

  const lista = (itens: ComentarioNumerado[], vazio: { titulo: string; descricao?: string }) =>
    itens.length === 0 ? (
      <div className="flex flex-col items-center gap-1 py-6 text-center text-texto-2">
        <MessageSquare className="h-5 w-5" aria-hidden="true" />
        <p className="text-destaque font-semibold text-texto md:text-corpo">{vazio.titulo}</p>
        {vazio.descricao && <p className="text-rotulo">{vazio.descricao}</p>}
      </div>
    ) : (
      <ul className="space-y-1">{itens.map((c) => <Item key={c.id} c={c} tipos={tipos} selecionado={c.id === selecionado} aoSelecionar={() => selecionar(c.id)} aoResponder={() => abrirResposta(c)} somenteLeitura={!podeComentar} agora={agora} />)}</ul>
    )

  return (
    <div className="space-y-4">
      <PreviaPost nome={nome} formato={formato} midias={midias} legenda={legenda} collabs={collabs} midiaNode={midiaNode} />

      {podeComentar ? (
        <Button ref={botaoOrigem} variant="outline" size="lg" className="h-11 w-full" onClick={iniciarMarcacao} disabled={marcando || midias.length === 0}>
          <Plus aria-hidden="true" />{videoAtivo ? 'Comentar neste instante do vídeo' : 'Comentar na imagem'}
        </Button>
      ) : (
        <p className="rounded-md bg-hover px-3 py-2 text-rotulo text-texto-2">Esta versão já foi respondida.</p>
      )}

      <section aria-label="Comentários" className="space-y-2">
        <h2 className="text-destaque font-semibold">Comentários</h2>
        <Tabs value={aba} onValueChange={(v) => setAba(v as typeof aba)}>
          <TabsList>
            <TabsTrigger value="abertos">Abertos ({abertos.length})</TabsTrigger>
            <TabsTrigger value="resolvidos">Resolvidos ({resolvidos.length})</TabsTrigger>
          </TabsList>
        </Tabs>
        {aba === 'abertos'
          ? lista(abertos, { titulo: 'Nenhum comentário ainda', descricao: podeComentar ? 'Toque em Comentar na imagem para marcar um ponto.' : undefined })
          : lista(resolvidos, { titulo: 'Nenhum comentário resolvido.' })}
        {podeComentar && <button type="button" onClick={abrirGeral} className="min-h-11 text-rotulo font-semibold text-texto-2 underline underline-offset-2">Comentar sem marcar ponto</button>}
      </section>
      {truncado && <p role="status" className="rounded-md bg-hover px-3 py-2 text-rotulo text-texto-2">Esta versão tem muitos comentários: mostramos os primeiros. Fale com a agência para ver o restante.</p>}
      {anteriores.map((a) => <HistoricoDaVersao key={a.versao} slug={slug} tarefaId={tarefaId} versao={a.versao} total={a.total} tipos={tipos} agora={agora} />)}

      <Sheet open={rascunho !== null} onOpenChange={(a) => { if (!a) setRascunho(null) }}>
        <SheetContent side="bottom" className="rounded-t-[var(--r-panel)] p-4" onOpenAutoFocus={(e) => { e.preventDefault(); campoTexto.current?.focus() }} onCloseAutoFocus={(e) => { e.preventDefault(); botaoOrigem.current?.focus() }}>
          <SheetTitle>{rascunho?.titulo}</SheetTitle>
          <SheetDescription className="sr-only">Escreva o que precisa mudar e envie para a agência.</SheetDescription>
          <Textarea ref={campoTexto} value={texto} onChange={(e) => setTexto(e.target.value)} rows={4} maxLength={2000} placeholder="Escreva o que precisa mudar" aria-label="Comentário" />
          <label className="block space-y-1">
            <span className="text-rotulo text-texto-2">Seu nome</span>
            <input value={nomeCliente} onChange={(e) => setNomeCliente(e.target.value)} maxLength={80} placeholder="Quem está comentando" className="h-11 w-full rounded-md border border-borda px-3 text-destaque" />
          </label>
          {erro && <p role="alert" className="text-rotulo text-perigo-forte">{erro}</p>}
          <div className="flex justify-end gap-2">
            <Button variant="ghost" size="lg" className="h-11" onClick={() => setRascunho(null)} disabled={pendente}>Cancelar</Button>
            <Button size="lg" className="h-11" onClick={enviar} disabled={pendente || !texto.trim() || !nomeCliente.trim()}>{pendente ? 'Enviando…' : 'Enviar comentário'}</Button>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  )
}
