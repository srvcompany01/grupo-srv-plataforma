'use client'

import { TriangleAlert } from 'lucide-react'
import { botaoPrimario } from '@/lib/ui'

/** Conteúdo padrão das páginas de erro: mensagem humana, código para suporte e botão de tentar de novo. */
export function TelaErro({ digest, retry }: { digest?: string; retry: () => void }) {
  return (
    <div className="flex min-h-[60dvh] flex-col items-center justify-center gap-3 px-4 text-center" role="alert">
      <span className="flex h-12 w-12 items-center justify-center rounded-full bg-perigo-fundo text-perigo"><TriangleAlert className="h-6 w-6" aria-hidden="true" /></span>
      <h1 className="text-destaque font-semibold">Algo deu errado</h1>
      <p className="max-w-sm text-rotulo text-texto-2">Não foi possível carregar esta página. Tente de novo; se continuar, avise a equipe informando o código abaixo.</p>
      {digest && <code className="rounded bg-hover px-2 py-1 text-legenda text-texto-2">código {digest}</code>}
      <button type="button" className={botaoPrimario} onClick={retry}>Tentar de novo</button>
    </div>
  )
}
