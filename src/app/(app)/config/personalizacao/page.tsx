import { cookies } from 'next/headers'
import { COOKIE_COR_BARRA, lerCorBarra } from '@/dominio/barra'
import { exigirAdmin } from '@/infra/supabase/sessao'
import { criarClienteServidor } from '@/infra/supabase/servidor'
import { temaAtual } from '@/servicos/tema'
import { CorDaBarra } from './CorDaBarra'
import { EditorTema } from './EditorTema'

export default async function Personalizacao() {
  await exigirAdmin()
  const corBarra = lerCorBarra((await cookies()).get(COOKIE_COR_BARRA)?.value)
  return (
    <>
      <CorDaBarra inicial={corBarra} />
      <EditorTema atual={await temaAtual(await criarClienteServidor())} />
    </>
  )
}
