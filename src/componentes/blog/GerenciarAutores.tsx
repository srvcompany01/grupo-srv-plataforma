'use client'

import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import { salvarAutorAcao } from '@/app/(app)/editor-blog/acoes'
import { avisar } from '@/componentes/tarefas/avisar'
import type { Autor } from '@/servicos/blog'

/** Editar autores (nome, cargo, bio) e cadastrar novos. */
export function GerenciarAutores({ autores }: { autores: Autor[] }) {
  const router = useRouter()
  const [editando, setEditando] = useState<string | 'novo' | null>(null)
  const [form, setForm] = useState({ nome: '', cargo: '', bio: '', links: '' })
  const [pendente, iniciar] = useTransition()
  const abrir = (a: Autor | null) => {
    setEditando(a?.id ?? 'novo')
    setForm({ nome: a?.nome ?? '', cargo: a?.cargo ?? '', bio: a?.bio ?? '', links: (a?.links ?? []).join('\n') })
  }
  const salvar = () => iniciar(async () => { if (avisar(await salvarAutorAcao(editando === 'novo' ? null : editando, { ...form, links: form.links.split(/\s+/).filter(Boolean) }), true)) { setEditando(null); router.refresh() } })
  return (
    <div>
      <ul>
        {autores.map((a) => (
          <li key={a.id}>
            <div>
              <p>{a.nome} {a.cargo && <span>· {a.cargo}</span>}</p>
              <p>{a.bio || 'Sem bio'}</p>
            </div>
            <button type="button" onClick={() => abrir(a)}>Editar</button>
          </li>
        ))}
      </ul>
      {editando ? (
        <div>
          <input placeholder="Nome" value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} maxLength={80} />
          <input placeholder="Cargo (ex.: Gestor de tráfego, 8 anos de experiência)" value={form.cargo} onChange={(e) => setForm({ ...form, cargo: e.target.value })} maxLength={80} />
          <textarea rows={3} placeholder="Bio curta: experiência, resultados, especialidades" value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} maxLength={800} />
          <textarea rows={2} placeholder="Perfis oficiais (LinkedIn, Instagram, site), um link https:// por linha" value={form.links} onChange={(e) => setForm({ ...form, links: e.target.value })} />
          <div>
            <button type="button" onClick={salvar} disabled={pendente || !form.nome.trim()}>Salvar</button>
            <button type="button" onClick={() => setEditando(null)}>Cancelar</button>
          </div>
        </div>
      ) : (
        <button type="button" onClick={() => abrir(null)}>Novo autor</button>
      )}
    </div>
  )
}
