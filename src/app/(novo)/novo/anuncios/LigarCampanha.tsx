'use client'

import { Interruptor, useAlterar } from '@/componentes/anuncios/ControleAnuncios'

/** Liga/pausa uma campanha na tabela (mesma ação e confirmação da tela atual). */
export function LigarCampanha({ clienteId, plataforma, id, nome, ligado, podeGerir }: { clienteId: string; plataforma: 'meta' | 'google'; id: string; nome: string; ligado: boolean; podeGerir: boolean }) {
  const { pendente, alterar } = useAlterar(clienteId)
  return <Interruptor ligado={ligado} nome={nome} desabilitado={!podeGerir || pendente} aoMudar={(ligar) => alterar({ plataforma, nivel: 'campanha', objetoId: id, acao: ligar ? 'ativar' : 'pausar' })} />
}
