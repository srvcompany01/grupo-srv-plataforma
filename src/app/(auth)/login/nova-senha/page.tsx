'use client'

import { useActionState } from 'react'
import { Marca } from '@/componentes/Marca'
import { botaoPrimario, campo } from '@/lib/ui'
import { definirSenha } from '../acoes'

export default function NovaSenha() {
  const [estado, acao, salvando] = useActionState(definirSenha, null)
  return (
    <main className="flex min-h-screen items-center justify-center bg-white p-4">
      <form action={acao} className="w-full max-w-[400px] space-y-3 text-center">
        <div className="flex justify-center">
          <Marca tamanho="h-11 w-11 text-lg" />
        </div>
        <h1 className="text-xl font-semibold">Defina sua senha</h1>
        <input name="senha" type="password" placeholder="Nova senha (mínimo 8 caracteres)" autoComplete="new-password" required className={campo} />
        <input name="confirmacao" type="password" placeholder="Repita a senha" autoComplete="new-password" required className={campo} />
        {estado?.erro && <p className="text-sm text-perigo">{estado.erro}</p>}
        <button disabled={salvando} className={`${botaoPrimario} h-10 w-full text-sm`}>
          {salvando ? 'Salvando…' : 'Salvar e entrar'}
        </button>
      </form>
    </main>
  )
}
