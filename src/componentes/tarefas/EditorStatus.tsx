'use client'

import { Ic } from '@/componentes/app/Ic'
import { useConfirmar } from '@/componentes/ConfirmarProvider'
import { ArrowDown, ArrowUp, Trash2 } from 'lucide-react'
import { useState, useTransition } from 'react'
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from '@/componentes/ui/dialog'
import { ROTULO_CATEGORIA, type Categoria, type StatusLista } from '@/dominio/tarefas'
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
      <DialogTrigger><Ic n="adjust" s={16} />Editar status</DialogTrigger>
      <DialogContent>
        <DialogTitle>Status da lista</DialogTitle>
        <div>
          {status.map((s, i) => (
            <div key={s.id}>
              <input
                type="color"
                defaultValue={s.cor}
                aria-label="Cor"
                onBlur={(e) => e.target.value !== s.cor && rodar(() => atualizarStatusAcao(s.id, { cor: e.target.value }))}
              />
              <input
                defaultValue={s.nome}
                aria-label="Nome"
                onBlur={(e) => e.target.value.trim() && e.target.value !== s.nome && rodar(() => atualizarStatusAcao(s.id, { nome: e.target.value.trim() }))}
              />
              <select
                defaultValue={s.categoria}
                aria-label="Categoria"
                onChange={(e) => rodar(() => atualizarStatusAcao(s.id, { categoria: e.target.value as Categoria }))}
              >
                {(Object.keys(ROTULO_CATEGORIA) as Categoria[]).map((c) => (
                  <option key={c} value={c}>
                    {ROTULO_CATEGORIA[c]}
                  </option>
                ))}
              </select>
              <button aria-label="Subir" disabled={pendente} onClick={() => mover(i, -1)}>
                <ArrowUp />
              </button>
              <button aria-label="Descer" disabled={pendente} onClick={() => mover(i, 1)}>
                <ArrowDown />
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
              >
                <Trash2 />
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
        >
          <input type="color" value={novo.cor} onChange={(e) => setNovo({ ...novo, cor: e.target.value })} aria-label="Cor" />
          <input value={novo.nome} onChange={(e) => setNovo({ ...novo, nome: e.target.value })} placeholder="Novo status" />
          <select
            value={novo.categoria}
            onChange={(e) => setNovo({ ...novo, categoria: e.target.value as Categoria })}
            aria-label="Categoria"
          >
            {(Object.keys(ROTULO_CATEGORIA) as Categoria[]).map((c) => (
              <option key={c} value={c}>
                {ROTULO_CATEGORIA[c]}
              </option>
            ))}
          </select>
          <button disabled={pendente || !novo.nome.trim()}>
            Adicionar
          </button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
