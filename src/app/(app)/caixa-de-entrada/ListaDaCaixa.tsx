'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useState, useTransition } from 'react'
import { Ic } from '@/componentes/app/Ic'
import { useConfirmar } from '@/componentes/ConfirmarProvider'
import { avisar } from '@/componentes/tarefas/avisar'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/componentes/ui/dialog'
import { formatarTamanho, ROTULO_STATUS_CAIXA, ROTULO_TIPO_VIDEO, type TipoDoVideo } from '@/dominio/caixa-de-entrada'
import type { ItemDaCaixa } from '@/servicos/caixa-de-entrada'
import { excluirItemCaixaAcao, marcarTipoCaixaAcao, renomearItemCaixaAcao, tentarDeNovoAcao, urlDoVideoCaixaAcao } from './acoes'

const COR = { aguardando_envio: 'var(--text-3)', importando: '#e08a00', pronto: 'var(--ok)', usado: 'var(--client)', erro: 'var(--red)' } as const

/** Vídeos do cliente na caixa. Enquanto algum estiver importando, a lista se atualiza sozinha. */
export function ListaDaCaixa({ itens, mostrarCliente = false }: { itens: ItemDaCaixa[]; mostrarCliente?: boolean }) {
  const router = useRouter()
  const confirmar = useConfirmar()
  const [pendente, iniciar] = useTransition()
  const [previa, setPrevia] = useState<{ nome: string; url: string } | null>(null)
  const [editando, setEditando] = useState<{ id: string; nome: string } | null>(null)
  const renomear = () => {
    if (!editando) return
    const { id, nome } = editando
    setEditando(null)
    iniciar(async () => void avisar(await renomearItemCaixaAcao(id, nome), true))
  }
  const importando = itens.some((i) => i.status === 'importando')
  useEffect(() => {
    if (!importando) return
    const t = setInterval(() => router.refresh(), 5000)
    return () => clearInterval(t)
  }, [importando, router])

  return (
    <section className="overflow-hidden rounded-lg border border-borda">
      <div className="flex h-10 items-center gap-2 border-b border-borda-fraca px-3"><h2 className="flex-1 text-[13px] font-semibold">Na caixa</h2><span className="text-[12px] text-texto-3">{itens.length}</span></div>
      {itens.length === 0 && <p className="p-3 text-[13px] text-texto-3">Nenhum vídeo ainda. Envie pelo computador, importe do Drive ou peça para a IA enviar.</p>}
      <ul>
        {itens.map((i) => (
          <li key={i.id} className="flex items-center gap-3 border-b border-[var(--border-soft)] px-3 py-2 text-[13px] last:border-b-0">
            <Ic n={i.status === 'importando' ? 'sync' : i.status === 'erro' ? 'error' : i.status === 'usado' ? 'task_alt' : 'movie'} s={16} style={{ color: COR[i.status] }} />
            <span className="min-w-0 flex-1">
              {editando?.id === i.id ? (
                <input autoFocus value={editando.nome} maxLength={255} aria-label="Novo nome do vídeo" onChange={(e) => setEditando({ id: i.id, nome: e.target.value })} onBlur={renomear} onKeyDown={(e) => { if (e.key === 'Enter') renomear(); if (e.key === 'Escape') setEditando(null) }} className="h-7 w-full rounded border border-borda bg-transparent px-2 text-[13px] outline-none focus:border-[var(--client)]" />
              ) : (
                <span className="flex items-center gap-1">
                  <span className="truncate">{i.nome}</span>
                  <button type="button" title="Renomear" aria-label={`Renomear ${i.nome}`} disabled={pendente} onClick={() => setEditando({ id: i.id, nome: i.nome })} className="b-icon" style={{ width: 22, height: 22, flex: 'none' }}><Ic n="edit" s={14} /></button>
                </span>
              )}
              <span className="block truncate text-[12px] text-texto-3">{mostrarCliente && <><b className="text-[var(--client)]">{i.clienteNome}</b> · </>}{i.origem === 'drive' ? 'Google Drive' : i.origem === 'ia' ? 'enviado pela IA' : 'upload'} · {formatarTamanho(i.tamanho)}{i.erro ? ` · ${i.erro}` : ''}</span>
            </span>
            <select value={i.tipo} disabled={pendente} aria-label="Tag do material" onChange={(e) => iniciar(async () => void avisar(await marcarTipoCaixaAcao(i.id, e.target.value as TipoDoVideo), true))} className="h-6 rounded border border-borda bg-transparent px-1 text-[12px]" style={i.tipo === 'indefinido' ? { color: 'var(--red)' } : undefined}>
              {(Object.keys(ROTULO_TIPO_VIDEO) as TipoDoVideo[]).filter((t) => t !== 'indefinido' || i.tipo === 'indefinido').map((t) => <option key={t} value={t}>{ROTULO_TIPO_VIDEO[t]}</option>)}
            </select>
            <span className="rounded px-1.5 text-[12px]" style={{ color: COR[i.status], background: `color-mix(in srgb, ${COR[i.status]} 14%, transparent)` }}>{ROTULO_STATUS_CAIXA[i.status]}</span>
            {i.status === 'usado' && i.postId && <Link href={`/tarefas/${i.postId}`} className="text-[12px] text-[var(--client)] hover:underline">Ver post</Link>}
            {i.status === 'pronto' && <button type="button" disabled={pendente} title="Assistir ao vídeo" onClick={() => iniciar(async () => { const r = await urlDoVideoCaixaAcao(i.id); if ('erro' in r) avisar({ erro: r.erro }); else setPrevia({ nome: i.nome, url: r.url }) })} className="b-ghost" style={{ height: 24, padding: '0 6px', fontSize: 12 }}><Ic n="play_circle" s={14} />Prévia</button>}
            {i.status === 'erro' && i.origem === 'drive' && <button type="button" disabled={pendente} onClick={() => iniciar(async () => void avisar(await tentarDeNovoAcao(i.id), true))} className="b-ghost" style={{ height: 24, padding: '0 6px', fontSize: 12 }}>Tentar de novo</button>}
            {i.status !== 'usado' && <button type="button" title="Excluir permanentemente" aria-label={`Excluir ${i.nome} permanentemente`} disabled={pendente} onClick={async () => { if (await confirmar({ titulo: `Excluir "${i.nome}" para sempre?`, descricao: 'O vídeo é apagado da caixa e do armazenamento. Não dá para desfazer.', confirmar: 'Excluir permanentemente', perigo: true })) iniciar(async () => void avisar(await excluirItemCaixaAcao(i.id), true)) }} className="b-icon" style={{ width: 24, height: 24, color: 'var(--red)' }}><Ic n="delete" s={16} /></button>}
          </li>
        ))}
      </ul>
      <Dialog open={!!previa} onOpenChange={(a) => !a && setPrevia(null)}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader><DialogTitle>Prévia</DialogTitle><DialogDescription className="truncate">{previa?.nome}</DialogDescription></DialogHeader>
          {previa && <video src={previa.url} controls autoPlay playsInline preload="metadata" className="max-h-[70vh] w-full rounded bg-black" />}
        </DialogContent>
      </Dialog>
    </section>
  )
}
