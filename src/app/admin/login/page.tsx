'use client'

import { useActionState } from 'react'
import { Marca } from '@/componentes/Marca'
import { entrar } from './acoes'

export default function Login() {
  const [estado, acao, enviando] = useActionState(entrar, null)
  return (
    <main>
      <div />
      <form action={acao}>
        <div>
          <Marca tamanho="h-11 w-11 text-lg" />
        </div>
        <div>
          <h1>Bem-vindo de volta!</h1>
          <p>Painel de conteúdo do Grupo SRV</p>
        </div>
        <input name="senha" type="password" placeholder="Senha" autoFocus required />
        {estado?.erro && <p>{estado.erro}</p>}
        <button disabled={enviando}>
          {enviando ? 'Entrando…' : 'Entrar'}
        </button>
      </form>
    </main>
  )
}
