import { cookies } from 'next/headers'
import { COOKIE_LATERAL, COR_LATERAL_PADRAO, normalizarHex } from '@/dominio/tema-lateral'
import { exigirAdmin } from '@/infra/supabase/sessao'
import { SeletorLateral } from './SeletorLateral'

export default async function Aparencia() {
  await exigirAdmin()
  const salva = normalizarHex((await cookies()).get(COOKIE_LATERAL)?.value ?? '')
  return <SeletorLateral atual={salva ?? COR_LATERAL_PADRAO} />
}
