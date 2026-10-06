import { sair } from '@/app/(auth)/login/acoes'
import { botaoSecundario } from '@/lib/ui'

export function BotaoSair({ className = '' }: { className?: string }) {
  return (
    <form action={sair}>
      <button className={`${botaoSecundario} ${className}`}>Sair</button>
    </form>
  )
}
