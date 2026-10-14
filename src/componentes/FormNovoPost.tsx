'use client'

import { useActionState, useState } from 'react'
import { acaoNovoPost } from '@/app/admin/(protegido)/acoes'
import { ROTULO_FORMATO } from '@/dominio/formatar'
import { FORMATOS } from '@/dominio/tipos'
import { botaoPrimario, botaoSecundario, campo, rotulo } from '@/lib/ui'
import { Icone } from './Icone'

/** Botão "+ Post" que abre um painel flutuante pedindo formato e data. */
export function FormNovoPost({ clienteId }: { clienteId: string }) {
  const [aberto, setAberto] = useState(false)
  const [estado, acao, enviando] = useActionState(acaoNovoPost.bind(null, clienteId), null)
  return (
    <div className="relative">
      <button type="button" onClick={() => setAberto((a) => !a)} className={botaoPrimario}>
        <Icone nome="mais" className="h-3.5 w-3.5" /> Post
      </button>
      {aberto && (
        <form
          action={acao}
          className="absolute right-0 z-20 mt-2 w-72 space-y-3 rounded-xl border border-borda bg-white p-4 shadow-[0_8px_30px_rgba(16,24,40,0.12)]"
        >
          <label className="block space-y-1">
            <span className={rotulo}>Formato</span>
            <select name="formato" className={campo} defaultValue="feed">
              {FORMATOS.map((f) => (
                <option key={f} value={f}>
                  {ROTULO_FORMATO[f]}
                </option>
              ))}
            </select>
          </label>
          <label className="block space-y-1">
            <span className={rotulo}>Data prevista</span>
            <input name="dataPrevista" type="date" required className={campo} />
          </label>
          {estado && 'erro' in estado && <p className="text-xs text-perigo">{estado.erro}</p>}
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setAberto(false)} className={botaoSecundario}>
              Cancelar
            </button>
            <button disabled={enviando} className={botaoPrimario}>
              Criar post
            </button>
          </div>
        </form>
      )}
    </div>
  )
}
