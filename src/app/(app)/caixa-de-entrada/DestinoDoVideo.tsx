'use client'

import { useEffect, useState, useTransition } from 'react'
import { avisar } from '@/componentes/tarefas/avisar'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/componentes/ui/dialog'
import { ROTULO_MODO_DESTINO, type DestinoDoVideo as Destino, type ModoDoDestino } from '@/dominio/caixa-de-entrada'
import type { EspacoParaDestino } from '@/dominio/destino-caixa'
import { botaoPrimario, campo, rotulo } from '@/lib/ui'
import { definirDestinoCaixaAcao, tarefasParaDestinoAcao } from './acoes'

/** Janela para escolher para onde o vídeo vai: espaço → pasta → lista → tarefa, e se entra como tarefa-mãe, subtarefa ou na tarefa que já existe. */
export function DestinoDoVideo({ aberto, aoFechar, itemId, nome, arvore, atual }: { aberto: boolean; aoFechar: () => void; itemId: string; nome: string; arvore: EspacoParaDestino[]; atual: Destino | null }) {
  const espacoDaLista = (listaId: string) => arvore.find((e) => e.listas.some((l) => l.id === listaId) || e.pastas.some((p) => p.listas.some((l) => l.id === listaId)))
  const inicial = atual ? espacoDaLista(atual.listaId) : undefined
  const [espacoId, setEspacoId] = useState(inicial?.id ?? '')
  const [pastaId, setPastaId] = useState(inicial?.pastas.find((p) => p.listas.some((l) => l.id === atual?.listaId))?.id ?? '')
  const [listaId, setListaId] = useState(atual?.listaId ?? '')
  const [modo, setModo] = useState<ModoDoDestino>(atual?.modo ?? 'mae')
  const [tarefaId, setTarefaId] = useState(atual?.tarefaId ?? '')
  const [tarefas, setTarefas] = useState<{ id: string; titulo: string; subtarefa: boolean; post: boolean }[]>([])
  const [carregando, setCarregando] = useState(false)
  const [pendente, iniciar] = useTransition()

  const espaco = arvore.find((e) => e.id === espacoId)
  const listas = pastaId ? (espaco?.pastas.find((p) => p.id === pastaId)?.listas ?? []) : (espaco?.listas ?? [])
  const precisaTarefa = modo !== 'mae'

  useEffect(() => {
    if (!aberto || !listaId || !precisaTarefa) return
    let ativo = true
    // eslint-disable-next-line react-hooks/set-state-in-effect -- carrega as tarefas da lista escolhida
    setCarregando(true)
    void tarefasParaDestinoAcao(listaId).then((r) => {
      if (!ativo) return
      setCarregando(false)
      if ('erro' in r) avisar({ erro: r.erro })
      else setTarefas(r.tarefas)
    })
    return () => { ativo = false }
  }, [aberto, listaId, precisaTarefa])

  const salvar = () => {
    if (!listaId) return avisar({ erro: 'Escolha a lista.' })
    if (precisaTarefa && !tarefaId) return avisar({ erro: 'Escolha a tarefa.' })
    iniciar(async () => { if (avisar(await definirDestinoCaixaAcao(itemId, { listaId, tarefaId: precisaTarefa ? tarefaId : null, modo }), true)) aoFechar() })
  }

  return (
    <Dialog open={aberto} onOpenChange={(a) => !a && aoFechar()}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Para onde vai este vídeo?</DialogTitle>
          <DialogDescription className="truncate">{nome}</DialogDescription>
        </DialogHeader>
        <div className="space-y-3 text-[13px]">
          <label className="block space-y-1"><span className={rotulo}>Espaço</span>
            <select className={campo} value={espacoId} onChange={(e) => { setEspacoId(e.target.value); setPastaId(''); setListaId(''); setTarefaId('') }}>
              <option value="">Escolha…</option>
              {arvore.map((e) => <option key={e.id} value={e.id}>{e.nome}</option>)}
            </select>
          </label>
          {espaco && espaco.pastas.length > 0 && (
            <label className="block space-y-1"><span className={rotulo}>Pasta</span>
              <select className={campo} value={pastaId} onChange={(e) => { setPastaId(e.target.value); setListaId(''); setTarefaId('') }}>
                <option value="">Sem pasta (lista direto no espaço)</option>
                {espaco.pastas.map((p) => <option key={p.id} value={p.id}>{p.nome}</option>)}
              </select>
            </label>
          )}
          <label className="block space-y-1"><span className={rotulo}>Lista (de conteúdo)</span>
            <select className={campo} value={listaId} disabled={!espaco} onChange={(e) => { setListaId(e.target.value); setTarefaId('') }}>
              <option value="">Escolha…</option>
              {listas.map((l) => <option key={l.id} value={l.id}>{l.nome}</option>)}
            </select>
          </label>
          <fieldset className="space-y-1">
            <legend className={rotulo}>Como o vídeo entra</legend>
            {(Object.keys(ROTULO_MODO_DESTINO) as ModoDoDestino[]).map((m) => (
              <label key={m} className="flex items-center gap-2"><input type="radio" name="modo" checked={modo === m} onChange={() => { setModo(m); setTarefaId('') }} />{ROTULO_MODO_DESTINO[m]}</label>
            ))}
          </fieldset>
          {precisaTarefa && (
            <label className="block space-y-1"><span className={rotulo}>{modo === 'subtarefa' ? 'Tarefa onde criar a subtarefa' : 'Tarefa que recebe o vídeo'}</span>
              <select className={campo} value={tarefaId} disabled={!listaId || carregando} onChange={(e) => setTarefaId(e.target.value)}>
                <option value="">{carregando ? 'Carregando…' : modo === 'existente' ? 'Escolha um post…' : 'Escolha…'}</option>
                {tarefas.filter((t) => (modo === 'existente' ? t.post : !t.subtarefa)).map((t) => <option key={t.id} value={t.id}>{t.subtarefa ? '↳ ' : ''}{t.titulo}</option>)}
              </select>
            </label>
          )}
          <p className="text-legenda text-texto-3">{modo === 'existente' ? 'Em "na tarefa que já existe" só aparecem posts (as subtarefas da lista de conteúdo). A tarefa-mãe não é um post: para ela use "Subtarefa". ' : ''}Só aparecem listas do tipo Conteúdo. A IA usa exatamente este destino quando criar o post: ela não escolhe sozinha.</p>
          <div className="flex items-center gap-2">
            <button type="button" disabled={pendente} onClick={salvar} className={botaoPrimario}>{pendente ? 'Salvando…' : 'Salvar destino'}</button>
            {atual && <button type="button" disabled={pendente} className="b-ghost" onClick={() => iniciar(async () => { if (avisar(await definirDestinoCaixaAcao(itemId, null), true)) aoFechar() })}>Remover destino</button>}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
