'use client'

import { useState, useTransition } from 'react'
import { botaoPrimario, campo } from '@/lib/ui'
import type { FormularioPublico as Dados } from '@/servicos/formularios'
import { enviarFormularioAcao } from './acoes'

export function FormularioPublico({ token, formulario }: { token: string; formulario: Dados }) {
  const [erro, setErro] = useState<string | null>(null)
  const [enviado, setEnviado] = useState(false)
  const [pendente, iniciar] = useTransition()

  if (enviado) {
    return (
      <div className="rounded-xl border border-borda bg-white p-6 text-center">
        <p className="font-semibold">Recebemos o seu pedido.</p>
        <p className="mt-1 text-corpo text-texto-2">A equipe já foi avisada. Obrigado!</p>
      </div>
    )
  }

  return (
    <form
      className="space-y-4 rounded-xl border border-borda bg-white p-5"
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
          <span className="mb-1 block text-corpo font-medium">
            {c.label}
            {c.required && <span className="text-perigo"> *</span>}
          </span>
        )
        if (c.tipo === 'checkbox')
          return (
            <label key={c.key} className="flex items-center gap-2 text-corpo font-medium">
              <input type="checkbox" name={c.key} /> {c.label}
            </label>
          )
        return (
          <label key={c.key} className="block">
            {rotulo}
            {c.key === 'description' || c.tipo === 'long_text' ? (
              <textarea name={c.key} rows={4} className={campo} required={c.required} />
            ) : c.tipo === 'dropdown' ? (
              <select name={c.key} className={campo} required={c.required} defaultValue="">
                <option value="" disabled>Escolha…</option>
                {c.opcoes.map((o) => <option key={o}>{o}</option>)}
              </select>
            ) : (
              <input
                name={c.key}
                className={campo}
                required={c.required}
                type={c.tipo === 'date' ? 'date' : c.tipo === 'email' ? 'email' : c.tipo === 'site' ? 'url' : c.tipo === 'number' || c.tipo === 'money' ? 'number' : 'text'}
                step={c.tipo === 'number' || c.tipo === 'money' ? 'any' : undefined}
              />
            )}
          </label>
        )
      })}
      <input name="website" tabIndex={-1} autoComplete="off" aria-hidden className="absolute -left-[9999px] h-0 w-0 opacity-0" />
      {erro && <p role="alert" className="text-corpo text-perigo">{erro}</p>}
      <button type="submit" disabled={pendente} className={botaoPrimario}>{pendente ? 'Enviando…' : 'Enviar'}</button>
    </form>
  )
}
