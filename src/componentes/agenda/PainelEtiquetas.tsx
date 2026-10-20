'use client'

import { Check, X } from 'lucide-react'
import Link from 'next/link'
import { useState, useTransition } from 'react'
import { criarEtiquetaAcao, excluirEtiquetaAcao } from '@/app/(app)/agenda/acoes'
import { useConfirmar } from '@/componentes/ConfirmarProvider'
import { avisar } from '@/componentes/tarefas/avisar'
import type { TagAgenda } from '@/dominio/agenda'
import { CORES_PERSONALIZACAO } from '@/dominio/personalizacao'
import { campo } from '@/lib/ui'

/** Uma linha do painel. Com `href`, a linha vira um filtro (mostrar/esconder, como as agendas do Google). */
export type LinhaEtiqueta = { item: TagAgenda; podeExcluir: boolean; href?: string; visivel?: boolean }

/** Lista de categorias ou tags da agenda: filtra (categorias), cria e exclui (as que a pessoa criou; o admin, todas). */
export function PainelEtiquetas({ tipo, titulo, linhas, extras = [] }: { tipo: 'tag' | 'categoria'; titulo: string; linhas: LinhaEtiqueta[]; extras?: { chave: string; nome: string; cor: string; href: string; visivel: boolean }[] }) {
  const [pendente, iniciar] = useTransition()
  const confirmar = useConfirmar()
  const [nome, setNome] = useState('')
  const [cor, setCor] = useState<string>(tipo === 'categoria' ? CORES_PERSONALIZACAO[7] : CORES_PERSONALIZACAO[12])
  const rotulo = tipo === 'tag' ? 'tag' : 'categoria'

  const criar = () =>
    iniciar(async () => {
      if (avisar(await criarEtiquetaAcao(tipo, nome, cor), true)) setNome('')
    })
  const excluir = (item: TagAgenda) =>
    iniciar(async () => {
      const descricao = tipo === 'tag' ? 'A tag sai de todos os compromissos que a usam.' : 'Os compromissos dela ficam sem categoria.'
      if (!(await confirmar({ titulo: `Excluir a ${rotulo} "${item.nome}"?`, descricao, confirmar: 'Excluir', perigo: true }))) return
      avisar(await excluirEtiquetaAcao(tipo, item.id), true)
    })

  const marca = (corItem: string, visivel?: boolean) =>
    visivel === undefined ? (
      <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: corItem }} />
    ) : (
      <span className="flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-[3px] border-2" style={{ borderColor: corItem, background: visivel ? corItem : 'transparent' }}>
        {visivel && <Check className="h-2.5 w-2.5 text-white" strokeWidth={3} />}
      </span>
    )

  return (
    <div className="space-y-1">
      <p className="text-legenda font-semibold text-texto-3">{titulo}</p>
      <ul className="space-y-0.5">
        {linhas.map(({ item, podeExcluir, href, visivel }) => (
          <li key={item.id} className="group flex items-center gap-1 rounded-md pr-1 hover:bg-hover">
            {href ? (
              <Link href={href} scroll={false} className="flex min-w-0 flex-1 items-center gap-2 px-1.5 py-1 text-rotulo text-texto" aria-pressed={visivel} title={visivel ? 'Clique para esconder' : 'Clique para mostrar'}>
                {marca(item.cor, visivel)} <span className="truncate">{item.nome}</span>
              </Link>
            ) : (
              <span className="flex min-w-0 flex-1 items-center gap-2 px-1.5 py-1 text-rotulo text-texto">{marca(item.cor)} <span className="truncate">{item.nome}</span></span>
            )}
            {podeExcluir && (
              <button type="button" onClick={() => excluir(item)} disabled={pendente} aria-label={`Excluir a ${rotulo} ${item.nome}`} title={`Excluir ${rotulo}`} className="rounded p-0.5 text-texto-3 opacity-60 hover:bg-white hover:text-perigo group-hover:opacity-100">
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </li>
        ))}
        {extras.map((e) => (
          <li key={e.chave} className="rounded-md hover:bg-hover">
            <Link href={e.href} scroll={false} className="flex items-center gap-2 px-1.5 py-1 text-rotulo text-texto-2" aria-pressed={e.visivel}>
              {marca(e.cor, e.visivel)} <span className="truncate">{e.nome}</span>
            </Link>
          </li>
        ))}
        {linhas.length === 0 && extras.length === 0 && <li className="px-1.5 py-1 text-legenda text-texto-3">Nenhuma ainda.</li>}
      </ul>
      <div className="space-y-1 pt-1">
        <div className="flex gap-1">
          <input className={`${campo} h-8 min-w-0 flex-1 px-2`} value={nome} onChange={(e) => setNome(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter' && nome.trim()) criar() }} placeholder={tipo === 'tag' ? 'Nova tag' : 'Nova categoria'} maxLength={40} aria-label={`Nome da nova ${rotulo}`} />
          <button type="button" onClick={criar} disabled={pendente || !nome.trim()} className="rounded-md px-2 text-legenda font-semibold text-petroleo hover:bg-hover disabled:opacity-40">Criar</button>
        </div>
        <div className="flex flex-wrap gap-1" role="radiogroup" aria-label={`Cor da nova ${rotulo}`}>
          {CORES_PERSONALIZACAO.map((c) => (
            <button key={c} type="button" role="radio" aria-checked={cor === c} aria-label={`Cor ${c}`} onClick={() => setCor(c)} className={`h-4 w-4 rounded-full ${cor === c ? 'ring-2 ring-texto ring-offset-1' : ''}`} style={{ background: c }} />
          ))}
        </div>
      </div>
    </div>
  )
}
