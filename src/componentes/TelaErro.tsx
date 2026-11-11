'use client'

import { TriangleAlert } from 'lucide-react'

/** Conteúdo padrão das páginas de erro: mensagem humana, código para suporte e botão de tentar de novo. */
export function TelaErro({ digest, retry }: { digest?: string; retry: () => void }) {
  return (
    <div role="alert">
      <span><TriangleAlert aria-hidden="true" /></span>
      <h1>Algo deu errado</h1>
      <p>Não foi possível carregar esta página. Tente de novo; se continuar, avise a equipe informando o código abaixo.</p>
      {digest && <code>código {digest}</code>}
      <button type="button" onClick={retry}>Tentar de novo</button>
    </div>
  )
}
