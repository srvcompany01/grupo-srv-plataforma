import type { ReactNode } from 'react'
import type { PeriodoAnuncios } from '@/dominio/periodo-anuncios'
import type { Cliente } from '@/servicos/clientes-plataforma'
import { situacaoGoogle } from '@/servicos/google-agencia'
import { dadosDoCliente } from '@/servicos/relatorio-cliente'
import { RelatorioCliente } from './RelatorioCliente'

/** Busca tudo do cliente (Instagram, Meta e Google) e monta o relatório. Vai dentro de um Suspense. */
export async function CarregarRelatorio({ cliente, periodo, seletor }: { cliente: Cliente; periodo: PeriodoAnuncios; seletor: ReactNode }) {
  const google = await situacaoGoogle()
  const dados = await dadosDoCliente(cliente, periodo, google.conectado)
  return <RelatorioCliente dados={dados} periodo={periodo} seletor={seletor} />
}
