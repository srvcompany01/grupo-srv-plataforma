'use client'

import { CheckCircle2, LoaderCircle, Send } from 'lucide-react'
import { useState, useTransition } from 'react'
import { Button } from '@/componentes/ui/button'
import type { FormularioPublico as Dados } from '@/servicos/formularios'
import { enviarFormularioAcao } from './acoes'
import s from './formulario-publico.module.css'

export function FormularioPublico({ token, formulario }: { token: string; formulario: Dados }) {
  const [erro, setErro] = useState<string | null>(null)
  const [enviado, setEnviado] = useState(false)
  const [pendente, iniciar] = useTransition()

  if (enviado) {
    return (
      <div className={s.sucesso} role="status">
        <CheckCircle2 aria-hidden />
        <h2>Recebemos o seu pedido</h2>
        <p>Suas respostas foram registradas. Obrigado!</p>
      </div>
    )
  }

  return (
    <form className={s.formulario} aria-busy={pendente} onSubmit={(e) => {
      e.preventDefault()
      // Captura antes de desabilitar os campos; mantém as respostas quando o servidor recusa o envio.
      const form = new FormData(e.currentTarget)
      iniciar(async () => {
        setErro(null)
        try {
          const r = await enviarFormularioAcao(token, form)
          if ('erro' in r) setErro(r.erro)
          else setEnviado(true)
        } catch {
          setErro('Não foi possível enviar agora. Suas respostas foram mantidas; tente de novo.')
        }
      })
    }}>
      <p className={s.instrucao}>Preencha os dados abaixo. Os campos com asterisco são obrigatórios.</p>
      <fieldset className={s.campos} disabled={pendente}>
        <legend className={s.oculto}>Dados do formulário</legend>
        {formulario.campos.map((c) => {
          if (c.tipo === 'checkbox') return (
            <label key={c.key} className={s.caixa}>
              <input type="checkbox" name={c.key} />
              <span>{c.label}</span>
            </label>
          )
          const longo = c.key === 'description' || c.tipo === 'long_text'
          return (
            <label key={c.key} className={s.campo} data-largo={longo || c.key === 'title'}>
              <span>{c.label}{c.required && <span className={s.asterisco} aria-hidden> *</span>}</span>
              {longo ? (
                <textarea name={c.key} rows={4} required={c.required} />
              ) : c.tipo === 'dropdown' ? (
                <select name={c.key} required={c.required} defaultValue="">
                  <option value="" disabled={c.required}>Selecione uma opção</option>
                  {c.opcoes.map((o) => <option key={o} value={o}>{o}</option>)}
                </select>
              ) : (
                <input
                  name={c.key}
                  required={c.required}
                  maxLength={c.key === 'title' ? 200 : undefined}
                  type={c.tipo === 'date' ? 'date' : c.tipo === 'email' ? 'email' : c.tipo === 'phone' ? 'tel' : c.tipo === 'site' ? 'url' : c.tipo === 'number' || c.tipo === 'money' ? 'number' : 'text'}
                  step={c.tipo === 'number' || c.tipo === 'money' ? 'any' : undefined}
                />
              )}
            </label>
          )
        })}
      </fieldset>
      <input className={s.oculto} name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" />
      {erro && <p className={s.erro} role="alert">{erro}</p>}
      <div className={s.rodape}>
        <p>Suas respostas serão encaminhadas à equipe.</p>
        <Button type="submit" size="lg" disabled={pendente}>
          {pendente ? <LoaderCircle className={s.carregando} aria-hidden /> : <Send aria-hidden />}
          {pendente ? 'Enviando…' : 'Enviar respostas'}
        </Button>
      </div>
    </form>
  )
}
