'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import s from './config.module.css'

const ABAS = [
  ['/config/usuarios', 'Usuários'],
  ['/config/espacos', 'Espaços'],
  ['/config/campos', 'Campos personalizados'],
  ['/config/formularios', 'Formulários'],
  ['/config/campos-clientes', 'Campos de cliente'],
  ['/config/integracoes', 'Integrações'],
  ['/config/armazenamento', 'Armazenamento'],
  ['/config/custos', 'Custos e usos'],
  ['/config/personalizacao', 'Personalização'],
  ['/config/design', 'Design'],
] as const

export function AbasConfig() {
  const caminho = usePathname()
  return (
    <nav className={s.abas} aria-label="Configurações">
      {ABAS.map(([href, rotulo]) => (
        <Link
          key={href}
          href={href}
          className={s.aba}
          aria-current={caminho === href || caminho?.startsWith(`${href}/`) ? 'page' : undefined}
        >
          {rotulo}
        </Link>
      ))}
    </nav>
  )
}
