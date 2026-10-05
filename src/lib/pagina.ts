import { notFound } from 'next/navigation'
import { ErroRegra } from '@/dominio/erros'

/** Em páginas: "não encontrado" do domínio vira a página 404 do Next. */
export async function ou404<T>(promessa: Promise<T>): Promise<T> {
  try {
    return await promessa
  } catch (e) {
    if (e instanceof ErroRegra && e.codigo === 'nao_encontrado') notFound()
    throw e
  }
}
