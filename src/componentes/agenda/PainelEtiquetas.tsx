'use client'

import { Check, X } from 'lucide-react'
import Link from 'next/link'
import { useState, useTransition } from 'react'
import { criarEtiquetaAcao, excluirEtiquetaAcao } from '@/app/(app)/agenda/acoes'
import { useConfirmar } from '@/componentes/ConfirmarProvider'
import { avisar } from '@/componentes/tarefas/avisar'
import type { TagAgenda } from '@/dominio/agenda'
import { CORES_PERSONALIZACAO } from '@/dominio/personalizacao'

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
  // Confirma ANTES da transição (dentro dela o diálogo de confirmação não chega a aparecer).
  const excluir = async (item: TagAgenda) => {
    const descricao = tipo === 'tag' ? 'A tag sai de todos os compromissos que a usam.' : 'Os compromissos dela ficam sem categoria.'
    if (!(await confirmar({ titulo: `Excluir a ${rotulo} "${item.nome}"?`, descricao, confirmar: 'Excluir', perigo: true }))) return
    iniciar(async () => void avisar(await excluirEtiquetaAcao(tipo, item.id), true))
  }

  const marca = (corItem: string, visivel?: boolean) =>
    visivel === undefined ? (
      <span style={{ background: corItem }} />
    ) : (
      <span style={{ borderColor: corItem, background: visivel ? corItem : 'transparent' }}>
        {visivel && <Check strokeWidth={3} />}
      </span>
    )

  return (
    <div className="ag-painel">
      <p>{titulo}</p>
      <ul>
        {linhas.map(({ item, podeExcluir, href, visivel }) => (
          <li key={item.id}>
            {href ? (
              <Link href={href} scroll={false} aria-pressed={visivel} title={visivel ? 'Clique para esconder' : 'Clique para mostrar'}>
                {marca(item.cor, visivel)} <span>{item.nome}</span>
              </Link>
            ) : (
              <span>{marca(item.cor)} <span>{item.nome}</span></span>
            )}
            {podeExcluir && (
              <button type="button" onClick={() => excluir(item)} disabled={pendente} aria-label={`Excluir a ${rotulo} ${item.nome}`} title={`Excluir ${rotulo}`}>
                <X />
              </button>
            )}
          </li>
        ))}
        {extras.map((e) => (
          <li key={e.chave}>
            <Link href={e.href} scroll={false} aria-pressed={e.visivel}>
              {marca(e.cor, e.visivel)} <span>{e.nome}</span>
            </Link>
          </li>
        ))}
        {linhas.length === 0 && extras.length === 0 && <li>Nenhuma ainda.</li>}
      </ul>
      <div className="ag-nova">
        <div>
          <input value={nome} onChange={(e) => setNome(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter' && nome.trim()) criar() }} placeholder={tipo === 'tag' ? 'Nova tag' : 'Nova categoria'} maxLength={40} aria-label={`Nome da nova ${rotulo}`} />
          <button type="button" onClick={criar} disabled={pendente || !nome.trim()}>Criar</button>
        </div>
        <div role="radiogroup" aria-label={`Cor da nova ${rotulo}`}>
          {CORES_PERSONALIZACAO.map((c) => (
            <button key={c} type="button" role="radio" aria-checked={cor === c} aria-label={`Cor ${c}`} onClick={() => setCor(c)} style={{ background: c }} />
          ))}
        </div>
      </div>
    </div>
  )
}
