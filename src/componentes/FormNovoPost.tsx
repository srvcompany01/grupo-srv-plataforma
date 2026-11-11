'use client'

import { useActionState, useState } from 'react'
import { acaoNovoPost } from '@/app/admin/(protegido)/acoes'
import { ROTULO_FORMATO } from '@/dominio/formatar'
import { FORMATOS } from '@/dominio/tipos'
import { Icone } from './Icone'

/** Botão "+ Post" que abre um painel flutuante pedindo formato e data. */
export function FormNovoPost({ clienteId }: { clienteId: string }) {
  const [aberto, setAberto] = useState(false)
  const [estado, acao, enviando] = useActionState(acaoNovoPost.bind(null, clienteId), null)
  return (
    <div>
      <button type="button" onClick={() => setAberto((a) => !a)}>
        <Icone nome="mais" /> Post
      </button>
      {aberto && (
        <form
          action={acao}
        >
          <label>
            <span>Formato</span>
            <select name="formato" defaultValue="feed">
              {FORMATOS.map((f) => (
                <option key={f} value={f}>
                  {ROTULO_FORMATO[f]}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span>Data prevista</span>
            <input name="dataPrevista" type="date" required />
          </label>
          {estado && 'erro' in estado && <p>{estado.erro}</p>}
          <div>
            <button type="button" onClick={() => setAberto(false)}>
              Cancelar
            </button>
            <button disabled={enviando}>
              Criar post
            </button>
          </div>
        </form>
      )}
    </div>
  )
}
