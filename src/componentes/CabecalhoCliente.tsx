import Link from 'next/link'
import { Marca } from './Marca'

export function CabecalhoCliente({ nome, token }: { nome: string; token: string }) {
  return (
    <header className="sticky top-0 z-10 border-b border-borda bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-[560px] items-center gap-3 px-4 py-3">
        <Link href={`/c/${token}`}>
          <Marca />
        </Link>
        <div className="min-w-0 leading-tight">
          <p className="text-legenda font-medium uppercase tracking-wide text-texto-3">Aprovação de conteúdo</p>
          <p className="truncate font-semibold">{nome}</p>
        </div>
      </div>
    </header>
  )
}
