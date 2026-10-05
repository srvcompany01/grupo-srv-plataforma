'use client'

import { useActionState } from 'react'
import { botaoPrimario, campo } from '@/lib/ui'
import { entrar } from './acoes'

export default function Login() {
  const [estado, acao, enviando] = useActionState(entrar, null)
  return (
    <main className="flex min-h-screen items-center justify-center p-4">
      <form action={acao} className="w-full max-w-sm space-y-4 rounded-2xl bg-white p-6 shadow-sm">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-neutral-500">Grupo SRV</p>
          <h1 className="text-xl font-semibold">Painel de conteúdo</h1>
        </div>
        <input name="senha" type="password" placeholder="Senha" autoFocus required className={campo} />
        {estado?.erro && <p className="text-sm text-rose-700">{estado.erro}</p>}
        <button disabled={enviando} className={`${botaoPrimario} w-full`}>
          {enviando ? 'Entrando…' : 'Entrar'}
        </button>
      </form>
    </main>
  )
}
