'use client'

import { ArrowDown, ArrowUp } from 'lucide-react'
import Link from 'next/link'
import { useMemo, useState } from 'react'
import { NomeCliente } from '@/componentes/NomeCliente'
import { valorParaTexto } from '@/dominio/faixa-celulas'
import { ROTULO_PRIORIDADE, type TarefaResumo } from '@/dominio/tarefas'
import type { Contexto } from './LinhaTarefa'
import { Pessoas } from './Pessoas'
import { SeloPrioridade } from './SeloPrioridade'

const ORDEM_PRIORIDADE = { urgente: 0, alta: 1, normal: 2, baixa: 3 } as const
const data = (iso: string) => new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short', timeZone: 'UTC' }).format(new Date(`${iso}T00:00:00Z`)).replace('.', '')

type Coluna = { id: string; rotulo: string; ordenar: (t: TarefaResumo) => string | number }

/** Tabela estilo planilha: uma linha por tarefa, colunas nativas e campos da lista, clique no título para ordenar. Abrir a tarefa pelo nome. */
export function VisaoTabela({ tarefas, ctx }: { tarefas: TarefaResumo[]; ctx: Contexto }) {
  const [ordem, setOrdem] = useState<{ coluna: string; desc: boolean } | null>(null)
  const status = (t: TarefaResumo) => ctx.statusPorLista[t.listaId]?.find((s) => s.id === t.statusId)
  const campos = ctx.camposPersonalizados ?? []
  const colunas: Coluna[] = useMemo(
    () => [
      { id: 'nome', rotulo: 'Nome', ordenar: (t) => t.titulo.toLocaleLowerCase('pt-BR') },
      { id: 'cliente', rotulo: 'Cliente', ordenar: (t) => t.clienteNome.toLocaleLowerCase('pt-BR') },
      { id: 'status', rotulo: 'Status', ordenar: (t) => status(t)?.nome ?? '' },
      { id: 'resp', rotulo: 'Responsáveis', ordenar: (t) => t.responsaveis[0]?.nome ?? '~' },
      { id: 'prazo', rotulo: 'Vencimento', ordenar: (t) => t.prazo ?? '9999' },
      { id: 'prio', rotulo: 'Prioridade', ordenar: (t) => ORDEM_PRIORIDADE[t.prioridade] },
      ...campos.map((c) => ({ id: `campo:${c.id}`, rotulo: c.nome, ordenar: (t: TarefaResumo) => valorParaTexto(c, t.camposPersonalizados?.[c.id], ctx.equipe).toLocaleLowerCase('pt-BR') })),
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [campos, ctx.equipe, ctx.statusPorLista],
  )
  const linhas = useMemo(() => {
    const col = colunas.find((c) => c.id === ordem?.coluna)
    if (!col) return tarefas
    const dir = ordem?.desc ? -1 : 1
    return [...tarefas].sort((a, b) => {
      const x = col.ordenar(a)
      const y = col.ordenar(b)
      return (x < y ? -1 : x > y ? 1 : 0) * dir
    })
  }, [tarefas, colunas, ordem])
  const alternar = (id: string) => setOrdem((atual) => (atual?.coluna !== id ? { coluna: id, desc: false } : atual.desc ? null : { coluna: id, desc: true }))

  if (!tarefas.length) return <p className="py-10 text-center text-corpo text-texto-3">Nenhuma tarefa nesta visualização.</p>
  return (
    <div className="overflow-x-auto rounded-xl border border-borda bg-white">
      <table className="w-full min-w-[720px] border-collapse text-corpo">
        <thead>
          <tr className="border-b border-borda text-left text-rotulo font-medium text-texto-3">
            <th className="w-10 px-3 py-2 text-right font-medium">#</th>
            {colunas.map((c) => (
              <th key={c.id} className="px-3 py-2 font-medium" aria-sort={ordem?.coluna === c.id ? (ordem.desc ? 'descending' : 'ascending') : 'none'}>
                <button type="button" onClick={() => alternar(c.id)} className="inline-flex items-center gap-1 hover:text-texto">
                  {c.rotulo}
                  {ordem?.coluna === c.id && (ordem.desc ? <ArrowDown className="h-3 w-3" /> : <ArrowUp className="h-3 w-3" />)}
                </button>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {linhas.map((t, i) => {
            const st = status(t)
            const atrasada = !!t.prazo && t.prazo < ctx.hoje && !t.concluidaEm
            return (
              <tr key={t.id} className="h-9 border-b border-borda last:border-0 hover:bg-hover">
                <td className="px-3 text-right text-rotulo tabular-nums text-texto-3">{i + 1}</td>
                <td className="max-w-80 truncate px-3 font-medium"><Link href={`/tarefas/${t.id}`} className={`hover:underline ${t.concluidaEm ? 'text-texto-3 line-through' : 'text-texto'}`}>{t.titulo}</Link></td>
                <td className="px-3"><NomeCliente nome={t.clienteNome} /></td>
                <td className="px-3">{st && <span className="inline-flex items-center gap-1.5 rounded-md px-1.5 py-0.5 text-legenda font-semibold uppercase" style={{ background: `${st.cor}22`, color: st.cor }}>{st.nome}</span>}</td>
                <td className="px-3">{t.responsaveis.length ? <Pessoas pessoas={t.responsaveis} /> : <span className="text-texto-3">—</span>}</td>
                <td className={`px-3 tabular-nums ${atrasada ? 'font-semibold text-perigo' : 'text-texto-2'}`}>{t.prazo ? data(t.prazo) : <span className="text-texto-3">—</span>}</td>
                <td className="px-3" title={ROTULO_PRIORIDADE[t.prioridade]}><SeloPrioridade prioridade={t.prioridade} /></td>
                {campos.map((c) => <td key={c.id} className="max-w-48 truncate px-3 text-texto-2">{valorParaTexto(c, t.camposPersonalizados?.[c.id], ctx.equipe) || <span className="text-texto-3">—</span>}</td>)}
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
