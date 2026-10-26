import type { ReactNode } from 'react'
import type { PeriodoAnuncios } from '@/dominio/periodo-anuncios'
import type { Cliente } from '@/servicos/clientes-plataforma'
import { situacaoGoogle } from '@/servicos/google-agencia'
import { criarClienteServidor } from '@/infra/supabase/servidor'
import { seguidoresPagosNoPeriodo } from '@/servicos/meta-anuncios'
import { cliquesLinkBioNoPeriodo } from '@/servicos/performance'
import { dadosDoCliente } from '@/servicos/relatorio-cliente'
import { RelatorioCliente } from './RelatorioCliente'

/** Busca tudo do cliente (Instagram, Meta e Google) e monta o relatório. Vai dentro de um Suspense. */
export async function CarregarRelatorio({ cliente, periodo, seletor }: { cliente: Cliente; periodo: PeriodoAnuncios; seletor: ReactNode }) {
  const google = await situacaoGoogle()
  const [dados, cliquesLinkBio, seguidoresPagos] = await Promise.all([dadosDoCliente(cliente, periodo, google.conectado), criarClienteServidor().then((sb) => cliquesLinkBioNoPeriodo(sb, cliente.id, periodo.de, periodo.ate)), seguidoresPagosNoPeriodo(cliente.metaContaId, periodo)])
  return <RelatorioCliente dados={dados} periodo={periodo} seletor={seletor} cliquesLinkBio={cliquesLinkBio} seguidoresPagos={seguidoresPagos} />
}
