'use client'

import { useActionState, useState } from 'react'
import { Marca } from '@/componentes/Marca'
import { botaoPrimario, campo } from '@/lib/ui'
import { entrar, enviarLink, esqueciSenha, type Estado } from './acoes'

type Modo = 'equipe' | 'cliente' | 'esqueci'

function Mensagem({ estado }: { estado: Estado }) {
  if (estado?.erro) return <p className="text-sm text-rose-600">{estado.erro}</p>
  if (estado?.ok) return <p className="text-sm text-emerald-700">{estado.ok}</p>
  return null
}

export default function Login() {
  const [modo, setModo] = useState<Modo>('equipe')
  const [estadoEquipe, acaoEquipe, entrando] = useActionState(entrar, null)
  const [estadoLink, acaoLink, enviandoLink] = useActionState(enviarLink, null)
  const [estadoEsqueci, acaoEsqueci, enviandoEsqueci] = useActionState(esqueciSenha, null)

  const aba = (m: Modo, texto: string) => (
    <button
      type="button"
      onClick={() => setModo(m)}
      className={`flex-1 rounded-md py-1.5 text-[13px] font-medium ${modo === m ? 'bg-white text-texto shadow-sm' : 'text-texto-2'}`}
    >
      {texto}
    </button>
  )

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-white p-4">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-72 bg-gradient-to-r from-rose-100 via-fuchsia-100 to-sky-100 opacity-80 blur-2xl" />
      <div className="relative w-full max-w-[400px] space-y-4 text-center">
        <div className="flex justify-center">
          <Marca tamanho="h-11 w-11 text-lg" />
        </div>
        <div>
          <h1 className="text-xl font-semibold">Bem-vindo de volta!</h1>
          <p className="mt-1 text-sm text-texto-2">Plataforma Grupo SRV</p>
        </div>

        {modo !== 'esqueci' && (
          <div className="flex gap-1 rounded-lg bg-hover p-1">
            {aba('equipe', 'Equipe')}
            {aba('cliente', 'Sou cliente')}
          </div>
        )}

        {modo === 'equipe' && (
          <form action={acaoEquipe} className="space-y-3">
            <input name="email" type="email" placeholder="E-mail" autoComplete="email" required className={campo} />
            <input name="senha" type="password" placeholder="Senha" autoComplete="current-password" required className={campo} />
            <Mensagem estado={estadoEquipe} />
            <button disabled={entrando} className={`${botaoPrimario} h-10 w-full text-sm`}>
              {entrando ? 'Entrando…' : 'Entrar'}
            </button>
            <button type="button" onClick={() => setModo('esqueci')} className="text-[13px] text-texto-2 hover:text-marca">
              Esqueci minha senha
            </button>
          </form>
        )}

        {modo === 'cliente' && (
          <form action={acaoLink} className="space-y-3">
            <p className="text-[13px] text-texto-2">Enviaremos um link de acesso para o seu e-mail. Não precisa de senha.</p>
            <input name="email" type="email" placeholder="Seu e-mail" autoComplete="email" required className={campo} />
            <Mensagem estado={estadoLink} />
            <button disabled={enviandoLink} className={`${botaoPrimario} h-10 w-full text-sm`}>
              {enviandoLink ? 'Enviando…' : 'Receber link por e-mail'}
            </button>
          </form>
        )}

        {modo === 'esqueci' && (
          <form action={acaoEsqueci} className="space-y-3">
            <p className="text-[13px] text-texto-2">Informe seu e-mail para receber um link de redefinição de senha.</p>
            <input name="email" type="email" placeholder="E-mail" autoComplete="email" required className={campo} />
            <Mensagem estado={estadoEsqueci} />
            <button disabled={enviandoEsqueci} className={`${botaoPrimario} h-10 w-full text-sm`}>
              {enviandoEsqueci ? 'Enviando…' : 'Enviar link'}
            </button>
            <button type="button" onClick={() => setModo('equipe')} className="text-[13px] text-texto-2 hover:text-marca">
              Voltar
            </button>
          </form>
        )}
      </div>
    </main>
  )
}
