'use client'

import { useActionState, useState } from 'react'
import { Marca } from '@/componentes/Marca'
import { entrar, enviarLink, esqueciSenha, type Estado } from './acoes'

type Modo = 'equipe' | 'cliente' | 'esqueci'

function Mensagem({ estado }: { estado: Estado }) {
  if (estado?.erro) return <p>{estado.erro}</p>
  if (estado?.ok) return <p>{estado.ok}</p>
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
    >
      {texto}
    </button>
  )

  return (
    <main>
      <div>
        <section className="hidden">
          <div>
            <Marca tamanho="h-9 w-9 text-sm" />
            <div>
              <p>Grupo SRV</p>
              <p>Plataforma da agência</p>
            </div>
          </div>

          <div>
            <span>
              Trabalho em um só lugar
            </span>
            <h1>
              Organize. Produza. Entregue.
            </h1>
            <p>
              Operação, clientes e aprovações conectados em uma plataforma feita para o ritmo da SRV.
            </p>

            <div>
              {[
                ['PLANEJAMENTO', 'Campanha de outubro', '#d11a22'],
                ['EM PRODUÇÃO', 'Criativos para social', '#0091ff'],
                ['APROVADO', 'Calendário editorial', '#16a36a'],
              ].map(([status, titulo, cor], i) => (
                <div key={status}>
                  <span style={{ background: cor }} />
                  <span>{titulo}</span>
                  <span>{status}</span>
                </div>
              ))}
            </div>
          </div>

          <p>Conteúdo · Operação · Clientes</p>
        </section>

        <section>
          <div>
            <div>
              <span>
                <Marca tamanho="h-11 w-11 text-lg" />
              </span>
            </div>
            <div>
              <p>Acesso seguro</p>
              <h2>Bem-vindo de volta</h2>
              <p>Entre para continuar na plataforma Grupo SRV.</p>
            </div>

            {modo !== 'esqueci' && (
              <div>
                {aba('equipe', 'Equipe')}
                {aba('cliente', 'Sou cliente')}
              </div>
            )}

            {modo === 'equipe' && (
              <form action={acaoEquipe}>
                <input aria-label="E-mail" name="email" type="email" placeholder="E-mail" autoComplete="email" required />
                <input aria-label="Senha" name="senha" type="password" placeholder="Senha" autoComplete="current-password" required />
                <Mensagem estado={estadoEquipe} />
                <button disabled={entrando}>
                  {entrando ? 'Entrando…' : 'Entrar'}
                </button>
                <button type="button" onClick={() => setModo('esqueci')}>
                  Esqueci minha senha
                </button>
              </form>
            )}

            {modo === 'cliente' && (
              <form action={acaoLink}>
                <p>Enviaremos um link de acesso para o seu e-mail. Não precisa de senha.</p>
                <input aria-label="Seu e-mail" name="email" type="email" placeholder="Seu e-mail" autoComplete="email" required />
                <Mensagem estado={estadoLink} />
                <button disabled={enviandoLink}>
                  {enviandoLink ? 'Enviando…' : 'Receber link por e-mail'}
                </button>
              </form>
            )}

            {modo === 'esqueci' && (
              <form action={acaoEsqueci}>
                <p>Informe seu e-mail para receber um link de redefinição de senha.</p>
                <input aria-label="E-mail" name="email" type="email" placeholder="E-mail" autoComplete="email" required />
                <Mensagem estado={estadoEsqueci} />
                <button disabled={enviandoEsqueci}>
                  {enviandoEsqueci ? 'Enviando…' : 'Enviar link'}
                </button>
                <button type="button" onClick={() => setModo('equipe')}>
                  Voltar
                </button>
              </form>
            )}

            <p>Acesso restrito a colaboradores e clientes autorizados.</p>
          </div>
        </section>
      </div>
    </main>
  )
}
