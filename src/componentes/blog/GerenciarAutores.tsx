'use client'

import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import { salvarAutorAcao } from '@/app/(app)/editor-blog/acoes'
import { avisar } from '@/componentes/tarefas/avisar'
import { botaoFantasma, botaoPrimario, botaoSecundario, campo } from '@/lib/ui'
import type { Autor } from '@/servicos/blog'

/** Editar autores (nome, cargo, bio) e cadastrar novos. */
export function GerenciarAutores({ autores }: { autores: Autor[] }) {
  const router = useRouter()
  const [editando, setEditando] = useState<string | 'novo' | null>(null)
  const [form, setForm] = useState({ nome: '', cargo: '', bio: '' })
  const [pendente, iniciar] = useTransition()
  const abrir = (a: Autor | null) => {
    setEditando(a?.id ?? 'novo')
    setForm({ nome: a?.nome ?? '', cargo: a?.cargo ?? '', bio: a?.bio ?? '' })
  }
  const salvar = () => iniciar(async () => { if (avisar(await salvarAutorAcao(editando === 'novo' ? null : editando, form), true)) { setEditando(null); router.refresh() } })
  return (
    <div className="space-y-3">
      <ul className="divide-y divide-borda">
        {autores.map((a) => (
          <li key={a.id} className="flex items-start justify-between gap-3 py-2">
            <div className="min-w-0">
              <p className="font-medium text-texto">{a.nome} {a.cargo && <span className="text-legenda font-normal text-texto-3">· {a.cargo}</span>}</p>
              <p className="line-clamp-2 text-legenda text-texto-3">{a.bio || 'Sem bio'}</p>
            </div>
            <button type="button" onClick={() => abrir(a)} className={botaoFantasma}>Editar</button>
          </li>
        ))}
      </ul>
      {editando ? (
        <div className="space-y-2 rounded-lg border border-borda p-3">
          <input className={campo} placeholder="Nome" value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} maxLength={80} />
          <input className={campo} placeholder="Cargo (ex.: Gestor de tráfego, 8 anos de experiência)" value={form.cargo} onChange={(e) => setForm({ ...form, cargo: e.target.value })} maxLength={80} />
          <textarea className={campo} rows={3} placeholder="Bio curta: experiência, resultados, especialidades" value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} maxLength={800} />
          <div className="flex gap-2">
            <button type="button" onClick={salvar} disabled={pendente || !form.nome.trim()} className={botaoPrimario}>Salvar</button>
            <button type="button" onClick={() => setEditando(null)} className={botaoFantasma}>Cancelar</button>
          </div>
        </div>
      ) : (
        <button type="button" onClick={() => abrir(null)} className={botaoSecundario}>Novo autor</button>
      )}
    </div>
  )
}
