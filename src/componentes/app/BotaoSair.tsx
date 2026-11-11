import { sair } from '@/app/(auth)/login/acoes'

export function BotaoSair({ className = '' }: { className?: string }) {
  return (
    <form action={sair}>
      <button>Sair</button>
    </form>
  )
}
