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
    <nav className="mt-5 flex gap-6 border-b border-borda">
      {ABAS.map(([href, rotulo]) => (
        <Link
          key={href}
          href={href}
          className={`-mb-px border-b-2 pb-2.5 text-[13px] font-semibold ${caminho === href ? 'border-texto text-texto' : 'border-transparent text-texto-2 hover:text-texto'}`}
        >
          {rotulo}
        </Link>
      ))}
    </nav>
  )
}
