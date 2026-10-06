import { exigirCliente } from '@/infra/supabase/sessao'
import { Marca } from '@/componentes/Marca'
import { BotaoSair } from '@/componentes/app/BotaoSair'

export default async function Portal() {
  const eu = await exigirCliente()
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 p-4 text-center">
      <Marca tamanho="h-11 w-11 text-lg" />
      <h1 className="text-xl font-semibold">Olá, {eu.nome || 'cliente'}!</h1>
      <p className="max-w-sm text-sm text-texto-2">Seu portal estará disponível em breve.</p>
      <BotaoSair />
    </main>
  )
}
