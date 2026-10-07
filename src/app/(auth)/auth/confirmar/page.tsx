'use client'

import type { EmailOtpType } from '@supabase/supabase-js'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { destinoAposConfirmar } from '@/dominio/convite'
import { criarClienteNavegador } from '@/infra/supabase/navegador'

/**
 * Recebe os três formatos de link do Supabase:
 * - ?token_hash=&type= (modelos de e-mail próprios — exigem SMTP próprio);
 * - #access_token=&refresh_token= (links pedidos sem PKCE: funcionam em qualquer aparelho);
 * - ?code= (PKCE: só no mesmo navegador que pediu).
 */
export default function Confirmar() {
  const [erro, setErro] = useState<string | null>(null)

  useEffect(() => {
    const sb = criarClienteNavegador()
    const busca = new URLSearchParams(window.location.search)
    const fragmento = new URLSearchParams(window.location.hash.slice(1))

    async function confirmar() {
      if (fragmento.get('error_description') || busca.get('error_description')) {
        throw new Error('expirado')
      }
      const tokenHash = busca.get('token_hash')
      const tipo = busca.get('type') as EmailOtpType | null
      const acesso = fragmento.get('access_token')
      const renovacao = fragmento.get('refresh_token')
      const codigo = busca.get('code')
      let resultado
      if (tokenHash && tipo) resultado = await sb.auth.verifyOtp({ token_hash: tokenHash, type: tipo })
      else if (acesso && renovacao) resultado = await sb.auth.setSession({ access_token: acesso, refresh_token: renovacao })
      else if (codigo) resultado = await sb.auth.exchangeCodeForSession(codigo)
      else throw new Error('sem dados')
      if (resultado.error) throw resultado.error
      // Convite e recuperação levam a definir senha; o resto vai para o início.
      window.location.replace(destinoAposConfirmar(tipo ?? fragmento.get('type')))
    }

    confirmar().catch(() => setErro('Este link expirou ou já foi usado. Peça um novo na tela de login.'))
  }, [])

  return (
    <main className="flex min-h-screen items-center justify-center p-4 text-center">
      {erro ? (
        <div className="space-y-3">
          <p className="text-sm text-perigo">{erro}</p>
          <Link href="/login" className="text-sm text-marca hover:underline">
            Ir para o login
          </Link>
        </div>
      ) : (
        <p className="text-sm text-texto-2">Entrando…</p>
      )}
    </main>
  )
}
