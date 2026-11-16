'use client'

import { Check, MessageSquare, RotateCcw } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useMemo, useRef, useState, useTransition } from 'react'
import { toast } from 'sonner'
import { carregarVersaoProvaAcao, responderProvaAcao, resolverProvaAcao } from '@/app/(app)/conteudo/acoes'
import { MidiaMarcavel } from '@/componentes/portal/MidiaMarcavel'
import { avisar } from '@/componentes/tarefas/avisar'
import { Button } from '@/componentes/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/componentes/ui/dialog'
import { Tabs, TabsList, TabsTrigger } from '@/componentes/ui/tabs'
import { Textarea } from '@/componentes/ui/textarea'
import { descreverLocal, numerarComentarios, tempoRelativo, type ComentarioNumerado } from '@/dominio/prova-visual'
import type { ComentarioProvaComResolvedor, Cursor, RevisaoCarregada } from '@/servicos/prova-visual'
import type { MidiaPortal } from '@/servicos/portal-conteudo'
import type { Formato } from '@/dominio/conteudo'

export type RevisaoDaVersao = { versaoId: string; numero: number; midias: MidiaPortal[] }

const dataBr = (iso: string) => new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })

function Cartao({ c, tipos, selecionado, aoSelecionar, tarefaId }: { c: ComentarioNumerado & { resolvidoPorNome?: string | null }; tipos: ('imagem' | 'video')[]; selecionado: boolean; aoSelecionar: () => void; tarefaId: string }) {
  const router = useRouter()
  const [pendente, iniciar] = useTransition()
  const [texto, setTexto] = useState('')
  const [agora] = useState(() => Date.now())
  const resolvido = !!c.resolvidoEm
  const enviar = () =>
    iniciar(async () => {
      if (avisar(await responderProvaAcao(c.id, c.versaoId, tarefaId, texto), true)) {
        setTexto('')
        router.refresh()
      }
    })
  const alternar = () =>
    iniciar(async () => {
      const novo = !resolvido
      const r = await resolverProvaAcao(c.id, novo)
      if (!avisar(r)) return
      router.refresh()
      toast(novo ? 'Comentário resolvido' : 'Comentário reaberto', { action: { label: 'Desfazer', onClick: () => void resolverProvaAcao(c.id, !novo).then(() => router.refresh()) } })
    })
  return (
    <li id={`revisao-${c.id}`} className={`space-y-2 rounded-lg border border-borda p-3 ${selecionado ? 'bg-[var(--sel)]' : 'bg-white'}`}>
      <button type="button" onClick={aoSelecionar} className="block w-full text-left">
        <span className="flex items-center gap-2">
          <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-legenda font-semibold text-white ${resolvido ? 'bg-sucesso-forte' : 'bg-[var(--red)]'}`}>{resolvido ? <Check className="h-3 w-3" aria-hidden="true" /> : c.numero}</span>
          <span className="font-semibold">{c.autor}</span>
          <span className="text-rotulo text-texto-2">{tempoRelativo(c.criadoEm, agora)}</span>
        </span>
        <span className="mt-0.5 block text-rotulo text-texto-2">{descreverLocal(c, tipos)}</span>
        <span className="mt-1 block whitespace-pre-wrap break-words text-corpo">{c.texto}</span>
      </button>
      {c.respostas.length > 0 && (
        <ul className="ml-6 space-y-2 border-l border-borda pl-3 text-corpo">
          {c.respostas.map((r) => (
            <li key={r.id}><span className="font-semibold">{r.autorTipo === 'equipe' ? `${r.autor} (agência)` : r.autor}</span> <span className="text-rotulo text-texto-2">{tempoRelativo(r.criadoEm, agora)}</span><span className="block whitespace-pre-wrap break-words">{r.texto}</span></li>
          ))}
        </ul>
      )}
      {resolvido && <p className="text-rotulo text-texto-2">Resolvido{c.resolvidoPorNome ? ` por ${c.resolvidoPorNome}` : ''} · {dataBr(c.resolvidoEm!)}</p>}
      <div className="flex items-end gap-2">
        {!resolvido && (
          <Textarea value={texto} rows={1} onChange={(e) => setTexto(e.target.value)} onKeyDown={(e) => { if ((e.metaKey || e.ctrlKey) && e.key === 'Enter' && texto.trim()) enviar() }} placeholder="Responder…" aria-label={`Responder ao comentário ${c.numero}`} className="min-h-8 flex-1 resize-none" maxLength={2000} />
        )}
        {!resolvido && <Button size="sm" onClick={enviar} disabled={pendente || !texto.trim()}>Enviar</Button>}
        <Button variant="outline" size="sm" onClick={alternar} disabled={pendente}>{resolvido ? <><RotateCcw aria-hidden="true" />Reabrir</> : <><Check aria-hidden="true" />Marcar resolvido</>}</Button>
      </div>
    </li>
  )
}

/** Cartão "Revisão do cliente" na tarefa do post e o diálogo em tela cheia: a agência só responde e resolve os pontos do cliente. */
export function RevisaoCliente({ tarefaId, titulo, formato, versoes, revisao }: { tarefaId: string; titulo: string; formato: Formato; versoes: RevisaoDaVersao[]; revisao: RevisaoCarregada }) {
  const [aberto, setAberto] = useState(false)
  const [versaoNum, setVersaoNum] = useState(versoes[0]?.numero ?? 1)
  const [aba, setAba] = useState<'abertos' | 'resolvidos' | 'todos'>('abertos')
  const [selecionado, setSelecionado] = useState<string | null>(null)
  const [irPara, setIrPara] = useState<number | null>(null)
  // Versões antigas: carregadas sob demanda, em páginas (a atual já vem inteira do servidor).
  const [antigas, setAntigas] = useState<Record<string, { comentarios: ComentarioProvaComResolvedor[]; proximo: Cursor | null; carregando: boolean; erro: boolean }>>({})
  const videos = useRef(new Map<number, HTMLVideoElement>())
  const versao = versoes.find((v) => v.numero === versaoNum) ?? versoes[0]
  const atualId = revisao.resumo[0]?.versaoId
  const ehAtual = versao?.versaoId === atualId
  const estado = ehAtual ? { comentarios: revisao.atual, proximo: null as Cursor | null, carregando: false, erro: false } : (antigas[versao?.versaoId ?? ''] ?? { comentarios: [], proximo: null as Cursor | null, carregando: false, erro: false })
  const comentarios = estado.comentarios
  const daVersao = useMemo(() => numerarComentarios(comentarios).map((n) => ({ ...n, resolvidoPorNome: comentarios.find((c) => c.id === n.id)?.resolvidoPorNome ?? null })), [comentarios])
  // Totais do cartão: da consulta agregada, não do que foi carregado.
  const abertosTotal = revisao.resumo.reduce((n, r) => n + r.abertos, 0)
  const resolvidosTotal = revisao.resumo.reduce((n, r) => n + r.resolvidos, 0)
  const semComentarios = revisao.resumo.every((r) => r.total === 0)

  async function carregarAntiga(versaoId: string, depois: Cursor | null) {
    setAntigas((m) => ({ ...m, [versaoId]: { comentarios: m[versaoId]?.comentarios ?? [], proximo: m[versaoId]?.proximo ?? null, carregando: true, erro: false } }))
    const r = await carregarVersaoProvaAcao(tarefaId, versaoId, depois)
    setAntigas((m) => {
      const antes = m[versaoId]?.comentarios ?? []
      return { ...m, [versaoId]: 'erro' in r ? { comentarios: antes, proximo: m[versaoId]?.proximo ?? null, carregando: false, erro: true } : { comentarios: [...antes, ...r.comentarios], proximo: r.proximo, carregando: false, erro: false } }
    })
  }
  function trocarVersao(numero: number) {
    setVersaoNum(numero)
    const alvo = versoes.find((v) => v.numero === numero)
    if (alvo && alvo.versaoId !== atualId && !antigas[alvo.versaoId]) void carregarAntiga(alvo.versaoId, null)
  }
  if (versoes.length === 0) return null
  const filtrados = daVersao.filter((c) => (aba === 'todos' ? true : aba === 'resolvidos' ? !!c.resolvidoEm : !c.resolvidoEm))
  const naMidia = daVersao.filter((c) => !c.resolvidoEm || aba !== 'abertos')
  const tipos = versao.midias.map((m) => m.tipo)

  function selecionar(id: string) {
    setSelecionado(id)
    const c = daVersao.find((x) => x.id === id)
    if (c?.midia != null) setIrPara(c.midia)
    document.getElementById(`revisao-${id}`)?.scrollIntoView({ block: 'nearest' })
  }

  return (
    <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-borda bg-white p-4">
      <p className="text-corpo">
        <span className="font-semibold">Revisão do cliente</span>{' '}
        <span className="text-texto-2">{semComentarios ? 'O cliente ainda não comentou nesta versão.' : `● ${abertosTotal} ${abertosTotal === 1 ? 'aberto' : 'abertos'} · ${resolvidosTotal} ${resolvidosTotal === 1 ? 'resolvido' : 'resolvidos'}`}</span>
      </p>
      <Button variant="outline" size="sm" onClick={() => setAberto(true)} disabled={semComentarios}><MessageSquare aria-hidden="true" />Abrir revisão</Button>

      <Dialog open={aberto} onOpenChange={setAberto}>
        <DialogContent className="h-[90vh] max-w-[1200px] gap-0 overflow-hidden p-0 sm:max-w-[1200px]">
          <DialogTitle className="border-b border-borda px-4 py-3 text-destaque font-semibold">Revisão · {titulo} · Versão {versao.numero}</DialogTitle>
          <DialogDescription className="sr-only">Responda e resolva os pontos que o cliente marcou na mídia.</DialogDescription>
          <div className="grid min-h-0 flex-1 md:grid-cols-[1fr_360px]">
            <div className="min-h-0 overflow-y-auto bg-black/5 p-4">
              <div className="mx-auto max-w-[420px]">
                <MidiaMarcavel midias={versao.midias} vertical={formato === 'reels' || formato === 'stories'} comentarios={naMidia} selecionadoId={selecionado} aoSelecionar={selecionar} marcando={false} videos={videos} irPara={irPara} />
              </div>
            </div>
            <div className="flex min-h-0 flex-col border-l border-borda">
              <div className="space-y-2 border-b border-borda p-3">
                {versoes.length > 1 && (
                  <select aria-label="Versão" value={versaoNum} onChange={(e) => trocarVersao(Number(e.target.value))} className="h-8 w-full rounded-md border border-borda px-2 text-corpo">
                    {versoes.map((v) => <option key={v.numero} value={v.numero}>Versão {v.numero}</option>)}
                  </select>
                )}
                <Tabs value={aba} onValueChange={(v) => setAba(v as typeof aba)}>
                  <TabsList><TabsTrigger value="abertos">Abertos</TabsTrigger><TabsTrigger value="resolvidos">Resolvidos</TabsTrigger><TabsTrigger value="todos">Todos</TabsTrigger></TabsList>
                </Tabs>
              </div>
              <ul className="min-h-0 flex-1 space-y-2 overflow-y-auto p-3">
                {filtrados.length === 0 && <li className="py-6 text-center text-rotulo text-texto-2">{daVersao.length === 0 ? 'O cliente ainda não comentou nesta versão.' : aba === 'resolvidos' ? 'Nenhum comentário resolvido.' : 'Nenhum comentário aberto.'}</li>}
                {ehAtual && revisao.truncado && <li role="status" className="rounded-md bg-hover px-3 py-2 text-rotulo text-texto-2">Esta versão tem mais comentários do que a tela carrega. Use o MCP ou fale com o suporte para ver o restante.</li>}
                {estado.carregando && <li role="status" className="py-2 text-center text-rotulo text-texto-2">Carregando…</li>}
                {estado.erro && <li role="alert" className="py-2 text-center text-rotulo text-perigo-forte">Não foi possível carregar os comentários.</li>}
                {filtrados.map((c) => <Cartao key={c.id} c={c} tipos={tipos} selecionado={c.id === selecionado} aoSelecionar={() => selecionar(c.id)} tarefaId={tarefaId} />)}
                {estado.proximo && !estado.carregando && <li className="text-center"><Button variant="outline" size="sm" onClick={() => void carregarAntiga(versao.versaoId, estado.proximo)}>Carregar mais</Button></li>}
              </ul>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
