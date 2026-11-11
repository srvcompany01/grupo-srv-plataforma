'use client'

import { useState, useTransition } from 'react'
import type { FormularioPublico as Dados } from '@/servicos/formularios'
import { enviarFormularioAcao } from './acoes'

export function FormularioPublico({ token, formulario }: { token: string; formulario: Dados }) {
  const [erro, setErro] = useState<string | null>(null)
  const [enviado, setEnviado] = useState(false)
  const [pendente, iniciar] = useTransition()

  if (enviado) {
    return (
      <div>
        <p>Recebemos o seu pedido.</p>
        <p>A equipe já foi avisada. Obrigado!</p>
      </div>
    )
  }

  return (
    <form
      action={(form) =>
        iniciar(async () => {
          setErro(null)
          const r = await enviarFormularioAcao(token, form)
          if ('erro' in r) setErro(r.erro)
          else setEnviado(true)
        })
      }
    >
      {formulario.campos.map((c) => {
        const rotulo = (
          <span>
            {c.label}
            {c.required && <span> *</span>}
          </span>
        )
        if (c.tipo === 'checkbox')
          return (
            <label key={c.key}>
              <input type="checkbox" name={c.key} /> {c.label}
            </label>
          )
        return (
          <label key={c.key}>
            {rotulo}
            {c.key === 'description' || c.tipo === 'long_text' ? (
              <textarea name={c.key} rows={4} required={c.required} />
            ) : c.tipo === 'dropdown' ? (
              <select name={c.key} required={c.required} defaultValue="">
                <option value="" disabled>Escolha…</option>
                {c.opcoes.map((o) => <option key={o}>{o}</option>)}
              </select>
            ) : (
              <input
                name={c.key}
                required={c.required}
                type={c.tipo === 'date' ? 'date' : c.tipo === 'email' ? 'email' : c.tipo === 'site' ? 'url' : c.tipo === 'number' || c.tipo === 'money' ? 'number' : 'text'}
                step={c.tipo === 'number' || c.tipo === 'money' ? 'any' : undefined}
              />
            )}
          </label>
        )
      })}
      <input name="website" tabIndex={-1} autoComplete="off" aria-hidden />
      {erro && <p role="alert">{erro}</p>}
      <button type="submit" disabled={pendente}>{pendente ? 'Enviando…' : 'Enviar'}</button>
    </form>
  )
}
