'use client'

import { formatarPrazo } from '@/dominio/prazo'
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

  if (!tarefas.length) return <p>Nenhuma tarefa nesta visualização.</p>
  return (
    <div>
      <table>
        <thead>
          <tr>
            <th>#</th>
            {colunas.map((c) => (
              <th key={c.id} aria-sort={ordem?.coluna === c.id ? (ordem.desc ? 'descending' : 'ascending') : 'none'}>
                <button type="button" onClick={() => alternar(c.id)}>
                  {c.rotulo}
                  {ordem?.coluna === c.id && (ordem.desc ? <ArrowDown /> : <ArrowUp />)}
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
              <tr key={t.id}>
                <td>{i + 1}</td>
                <td><Link href={`/tarefas/${t.id}`}>{t.titulo}</Link></td>
                <td><NomeCliente nome={t.clienteNome} /></td>
                <td>{st && <span style={{ background: `${st.cor}22`, color: st.cor }}>{st.nome}</span>}</td>
                <td>{t.responsaveis.length ? <Pessoas pessoas={t.responsaveis} /> : <span>—</span>}</td>
                <td>{t.prazo ? formatarPrazo(t.prazo, t.horario) : <span>—</span>}</td>
                <td title={ROTULO_PRIORIDADE[t.prioridade]}><SeloPrioridade prioridade={t.prioridade} /></td>
                {campos.map((c) => <td key={c.id}>{valorParaTexto(c, t.camposPersonalizados?.[c.id], ctx.equipe) || <span>—</span>}</td>)}
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
