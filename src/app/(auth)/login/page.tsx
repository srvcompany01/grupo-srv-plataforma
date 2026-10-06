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
      className={`flex-1 rounded-full py-2 text-[12px] font-semibold transition ${modo === m ? 'bg-texto text-white' : 'text-texto-2 hover:text-texto'}`}
    >
      {texto}
    </button>
  )

  return (
    <main className="min-h-screen bg-white p-4 md:p-8">
      <div className="mx-auto grid min-h-[calc(100vh-2rem)] max-w-[1120px] overflow-hidden rounded-[20px] border border-borda bg-white md:min-h-[calc(100vh-4rem)] md:grid-cols-[1.1fr_0.9fr]">
        <section className="hidden flex-col justify-between bg-fundo p-10 md:flex lg:p-14">
          <div className="flex items-center gap-3">
            <Marca tamanho="h-9 w-9 text-sm" />
            <div>
              <p className="font-[var(--font-plus-jakarta)] text-sm font-bold tracking-[-0.025em]">Grupo SRV</p>
              <p className="font-mono text-[9px] uppercase tracking-[0.08em] text-texto-3">Plataforma da agência</p>
            </div>
          </div>

          <div className="max-w-lg">
            <span className="inline-flex rounded-full border border-borda bg-white px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.08em] text-texto-2">
              Trabalho em um só lugar
            </span>
            <h1 className="mt-5 text-[48px] leading-[1.05] font-extrabold tracking-[-0.045em] text-texto lg:text-[58px]">
              Organize. Produza. Entregue.
            </h1>
            <p className="mt-5 max-w-md text-base leading-7 text-texto-2">
              Operação, clientes e aprovações conectados em uma plataforma feita para o ritmo da SRV.
            </p>

            <div className="mt-8 overflow-hidden rounded-2xl border border-borda bg-white">
              {[
                ['PLANEJAMENTO', 'Campanha de outubro', '#6647f0'],
                ['EM PRODUÇÃO', 'Criativos para social', '#0091ff'],
                ['APROVADO', 'Calendário editorial', '#16a36a'],
              ].map(([status, titulo, cor], i) => (
                <div key={status} className={`flex items-center gap-3 px-4 py-3.5 ${i ? 'border-t border-borda' : ''}`}>
                  <span className="h-2.5 w-2.5 rounded-full" style={{ background: cor }} />
                  <span className="min-w-0 flex-1 truncate text-[13px] font-medium">{titulo}</span>
                  <span className="rounded-full bg-fundo px-2 py-1 font-mono text-[9px] tracking-[0.05em] text-texto-2">{status}</span>
                </div>
              ))}
            </div>
          </div>

          <p className="font-mono text-[10px] uppercase tracking-[0.08em] text-texto-3">Conteúdo · Operação · Clientes</p>
        </section>

        <section className="flex items-center justify-center p-6 sm:p-10 lg:p-14">
          <div className="w-full max-w-[400px]">
            <div className="flex justify-center md:hidden">
              <span className="brand-orbit rounded-xl bg-white p-0.5">
                <Marca tamanho="h-11 w-11 text-lg" />
              </span>
            </div>
            <div className="mt-5 text-center md:mt-0 md:text-left">
              <p className="eyebrow">Acesso seguro</p>
              <h2 className="mt-2 text-[30px] leading-tight font-bold tracking-[-0.035em] text-texto">Bem-vindo de volta</h2>
              <p className="mt-2 text-sm text-texto-2">Entre para continuar na plataforma Grupo SRV.</p>
            </div>

            {modo !== 'esqueci' && (
              <div className="mt-7 flex gap-1 rounded-full border border-borda bg-fundo p-1">
                {aba('equipe', 'Equipe')}
                {aba('cliente', 'Sou cliente')}
              </div>
            )}

            {modo === 'equipe' && (
              <form action={acaoEquipe} className="mt-6 space-y-3">
                <input aria-label="E-mail" name="email" type="email" placeholder="E-mail" autoComplete="email" required className={campo} />
                <input aria-label="Senha" name="senha" type="password" placeholder="Senha" autoComplete="current-password" required className={campo} />
                <Mensagem estado={estadoEquipe} />
                <button disabled={entrando} className={`${botaoPrimario} h-11 w-full text-sm`}>
                  {entrando ? 'Entrando…' : 'Entrar'}
                </button>
                <button type="button" onClick={() => setModo('esqueci')} className="w-full py-1 text-[12px] font-medium text-texto-2 hover:text-texto">
                  Esqueci minha senha
                </button>
              </form>
            )}

            {modo === 'cliente' && (
              <form action={acaoLink} className="mt-6 space-y-3">
                <p className="rounded-xl border border-borda bg-fundo p-3 text-[12px] leading-5 text-texto-2">Enviaremos um link de acesso para o seu e-mail. Não precisa de senha.</p>
                <input aria-label="Seu e-mail" name="email" type="email" placeholder="Seu e-mail" autoComplete="email" required className={campo} />
                <Mensagem estado={estadoLink} />
                <button disabled={enviandoLink} className={`${botaoPrimario} h-11 w-full text-sm`}>
                  {enviandoLink ? 'Enviando…' : 'Receber link por e-mail'}
                </button>
              </form>
            )}

            {modo === 'esqueci' && (
              <form action={acaoEsqueci} className="mt-7 space-y-3">
                <p className="rounded-xl border border-borda bg-fundo p-3 text-[12px] leading-5 text-texto-2">Informe seu e-mail para receber um link de redefinição de senha.</p>
                <input aria-label="E-mail" name="email" type="email" placeholder="E-mail" autoComplete="email" required className={campo} />
                <Mensagem estado={estadoEsqueci} />
                <button disabled={enviandoEsqueci} className={`${botaoPrimario} h-11 w-full text-sm`}>
                  {enviandoEsqueci ? 'Enviando…' : 'Enviar link'}
                </button>
                <button type="button" onClick={() => setModo('equipe')} className="w-full py-1 text-[12px] font-medium text-texto-2 hover:text-texto">
                  Voltar
                </button>
              </form>
            )}

            <p className="mt-8 text-center text-[11px] leading-5 text-texto-3">Acesso restrito a colaboradores e clientes autorizados.</p>
          </div>
        </section>
      </div>
    </main>
  )
}
