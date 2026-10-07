'use client'

import { useActionState } from 'react'
import { Marca } from '@/componentes/Marca'
import { botaoPrimario, campo } from '@/lib/ui'
import { entrar } from './acoes'

export default function Login() {
  const [estado, acao, enviando] = useActionState(entrar, null)
  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-white p-4">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-72 bg-gradient-to-r from-perigo-fundo via-fuchsia-100 to-marca-fundo opacity-80 blur-2xl" />
      <form action={acao} className="relative w-full max-w-[400px] space-y-4 text-center">
        <div className="flex justify-center">
          <Marca tamanho="h-11 w-11 text-lg" />
        </div>
        <div>
          <h1 className="text-xl font-semibold">Bem-vindo de volta!</h1>
          <p className="mt-1 text-sm text-texto-2">Painel de conteúdo do Grupo SRV</p>
        </div>
        <input name="senha" type="password" placeholder="Senha" autoFocus required className={campo} />
        {estado?.erro && <p className="text-sm text-perigo">{estado.erro}</p>}
        <button disabled={enviando} className={`${botaoPrimario} h-10 w-full text-sm`}>
          {enviando ? 'Entrando…' : 'Entrar'}
        </button>
      </form>
    </main>
  )
}
