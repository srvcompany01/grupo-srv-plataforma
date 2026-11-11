'use client'

import { useActionState } from 'react'
import { Marca } from '@/componentes/Marca'
import { definirSenha } from '../acoes'

export default function NovaSenha() {
  const [estado, acao, salvando] = useActionState(definirSenha, null)
  return (
    <main>
      <form action={acao}>
        <div>
          <Marca tamanho="h-11 w-11 text-lg" />
        </div>
        <h1>Defina sua senha</h1>
        <input name="senha" type="password" placeholder="Nova senha (mínimo 8 caracteres)" autoComplete="new-password" required />
        <input name="confirmacao" type="password" placeholder="Repita a senha" autoComplete="new-password" required />
        {estado?.erro && <p>{estado.erro}</p>}
        <button disabled={salvando}>
          {salvando ? 'Salvando…' : 'Salvar e entrar'}
        </button>
      </form>
    </main>
  )
}
