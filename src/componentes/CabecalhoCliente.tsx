import Link from 'next/link'
import { Marca } from './Marca'

export function CabecalhoCliente({ nome, token }: { nome: string; token: string }) {
  return (
    <header>
      <div>
        <Link href={`/c/${token}`}>
          <Marca />
        </Link>
        <div>
          <p>Aprovação de conteúdo</p>
          <p>{nome}</p>
        </div>
      </div>
    </header>
  )
}
