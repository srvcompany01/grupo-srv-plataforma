'use client'

import { useActionState } from 'react'
import { acaoNovoPost } from '@/app/admin/(protegido)/acoes'
import { FORMATOS } from '@/dominio/tipos'
import { ROTULO_FORMATO } from '@/dominio/formatar'
import { botaoPrimario, campo } from '@/lib/ui'

export function FormNovoPost({ clienteId }: { clienteId: string }) {
  const [estado, acao, enviando] = useActionState(acaoNovoPost.bind(null, clienteId), null)
  return (
    <form action={acao} className="flex flex-col gap-2 rounded-2xl bg-white p-4 shadow-sm sm:flex-row sm:items-end">
      <label className="flex-1 text-sm">
        Formato
        <select name="formato" className={campo} defaultValue="feed">
          {FORMATOS.map((f) => (
            <option key={f} value={f}>
              {ROTULO_FORMATO[f]}
            </option>
          ))}
        </select>
      </label>
      <label className="flex-1 text-sm">
        Data prevista
        <input name="dataPrevista" type="date" required className={campo} />
      </label>
      <button disabled={enviando} className={`${botaoPrimario} shrink-0`}>
        Novo post
      </button>
      {estado && 'erro' in estado && <p className="text-sm text-rose-700">{estado.erro}</p>}
    </form>
  )
}
