'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const ABAS = [
  ['/config/usuarios', 'Usuários'],
  ['/config/espacos', 'Departamentos'],
] as const

export function AbasConfig() {
  const caminho = usePathname()
  return (
    <nav className="mt-3 flex gap-4 border-b border-borda">
      {ABAS.map(([href, rotulo]) => (
        <Link
          key={href}
          href={href}
          className={`-mb-px border-b-2 pb-2 text-[13px] font-medium ${caminho === href ? 'border-marca text-marca' : 'border-transparent text-texto-2 hover:text-texto'}`}
        >
          {rotulo}
        </Link>
      ))}
    </nav>
  )
}
