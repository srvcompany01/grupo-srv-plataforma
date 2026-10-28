'use client'

import { Ic } from '@/componentes/app/Ic'
import { useConfirmar } from '@/componentes/ConfirmarProvider'
import { ArrowDown, ArrowUp, Trash2 } from 'lucide-react'
import { useState, useTransition } from 'react'
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from '@/componentes/ui/dialog'
import { ROTULO_CATEGORIA, type Categoria, type StatusLista } from '@/dominio/tarefas'
import { botaoFantasma, botaoPrimario, campo } from '@/lib/ui'
import {
  atualizarStatusAcao,
  criarStatusAcao,
  removerStatusAcao,
  reposicionarStatusAcao,
} from '@/app/(app)/tarefas/acoes'
import { avisar } from './avisar'

type S = StatusLista & { posicao: string }

export function EditorStatus({ listaId, status }: { listaId: string; status: S[] }) {
  const [pendente, iniciar] = useTransition()
  const confirmar = useConfirmar()
  const [novo, setNovo] = useState({ nome: '', cor: '#7b68ee', categoria: 'in_progress' as Categoria })
  const rodar = (fn: () => Promise<Parameters<typeof avisar>[0]>) => iniciar(async () => void avisar(await fn()))

  function mover(i: number, direcao: -1 | 1) {
    const alvo = i + direcao
    if (alvo < 0 || alvo >= status.length) return
    const [antes, depois] = direcao < 0 ? [status[alvo - 1], status[alvo]] : [status[alvo], status[alvo + 1]]
    rodar(() => reposicionarStatusAcao(status[i].id, antes?.posicao ?? null, depois?.posicao ?? null))
  }

  return (
    <Dialog>
      <DialogTrigger className="b-ghost"><Ic n="adjust" s={16} />Editar status</DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogTitle>Status da lista</DialogTitle>
        <div className="space-y-2">
          {status.map((s, i) => (
            <div key={s.id} className="flex items-center gap-2">
              <input
                type="color"
                defaultValue={s.cor}
                aria-label="Cor"
                onBlur={(e) => e.target.value !== s.cor && rodar(() => atualizarStatusAcao(s.id, { cor: e.target.value }))}
                className="h-8 w-9 rounded border border-borda"
              />
              <input
                defaultValue={s.nome}
                aria-label="Nome"
                onBlur={(e) => e.target.value.trim() && e.target.value !== s.nome && rodar(() => atualizarStatusAcao(s.id, { nome: e.target.value.trim() }))}
                className={`${campo} h-8 py-0`}
              />
              <select
                defaultValue={s.categoria}
                aria-label="Categoria"
                onChange={(e) => rodar(() => atualizarStatusAcao(s.id, { categoria: e.target.value as Categoria }))}
                className={`${campo} h-8 w-36 py-0 text-corpo`}
              >
                {(Object.keys(ROTULO_CATEGORIA) as Categoria[]).map((c) => (
                  <option key={c} value={c}>
                    {ROTULO_CATEGORIA[c]}
                  </option>
                ))}
              </select>
              <button aria-label="Subir" disabled={pendente} onClick={() => mover(i, -1)} className={botaoFantasma}>
                <ArrowUp className="h-4 w-4" />
              </button>
              <button aria-label="Descer" disabled={pendente} onClick={() => mover(i, 1)} className={botaoFantasma}>
                <ArrowDown className="h-4 w-4" />
              </button>
              <button
                aria-label="Remover"
                disabled={pendente}
                onClick={async () => {
                  const destino = status.find((o) => o.id !== s.id && o.categoria === 'todo') ?? status.find((o) => o.id !== s.id)
                  if (destino && (await confirmar({ titulo: `Remover "${s.nome}"?`, descricao: `As tarefas dele vão para "${destino.nome}".`, confirmar: 'Remover', perigo: true }))) {
                    rodar(() => removerStatusAcao(s.id, destino.id))
                  }
                }}
                className={botaoFantasma}
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
        <form
          onSubmit={(e) => {
            e.preventDefault()
            rodar(async () => {
              const r = await criarStatusAcao(listaId, novo.nome, novo.cor, novo.categoria)
              if (!r?.erro) setNovo({ ...novo, nome: '' })
              return r
            })
          }}
          className="flex items-center gap-2 border-t border-borda pt-3"
        >
          <input type="color" value={novo.cor} onChange={(e) => setNovo({ ...novo, cor: e.target.value })} aria-label="Cor" className="h-8 w-9 rounded border border-borda" />
          <input value={novo.nome} onChange={(e) => setNovo({ ...novo, nome: e.target.value })} placeholder="Novo status" className={`${campo} h-8 py-0`} />
          <select
            value={novo.categoria}
            onChange={(e) => setNovo({ ...novo, categoria: e.target.value as Categoria })}
            aria-label="Categoria"
            className={`${campo} h-8 w-36 py-0 text-corpo`}
          >
            {(Object.keys(ROTULO_CATEGORIA) as Categoria[]).map((c) => (
              <option key={c} value={c}>
                {ROTULO_CATEGORIA[c]}
              </option>
            ))}
          </select>
          <button disabled={pendente || !novo.nome.trim()} className={botaoPrimario}>
            Adicionar
          </button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
